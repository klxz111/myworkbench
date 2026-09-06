import { NextRequest, NextResponse } from 'next/server';
import { initDb } from '@/lib/db';
import { readEntity, writeEntity, EntityType } from '@/lib/markdown';
import { buildRelations } from '@/lib/sync';

export const runtime = 'nodejs';

interface RelationEntry {
  to?: string;
  id?: string;
  type?: string;
  relation?: string;
}

function sameRelation(entry: RelationEntry, toId: string, relType: string): boolean {
  const to = entry.to ?? entry.id;
  const relation = entry.type ?? entry.relation;
  return to === toId && relation === relType;
}

function getWritebackInfo(fromId: string): { type: EntityType; slug: string } | null {
  const db = initDb();
  const row = db
    .prepare('SELECT type, slug FROM entities WHERE id = ?')
    .get(fromId) as { type: string; slug: string } | undefined;
  if (!row) return null;
  return { type: row.type as EntityType, slug: row.slug };
}

export async function GET(request: NextRequest) {
  try {
    const fromId = request.nextUrl.searchParams.get('from');
    const toId = request.nextUrl.searchParams.get('to');
    const db = initDb();

    if (fromId && toId) {
      return NextResponse.json({ error: 'Provide only one of from or to' }, { status: 400 });
    }

    if (fromId) {
      const relations = db.prepare(`
        SELECT r.to_id, r.relation, e.type, e.title, e.slug
        FROM relations r
        JOIN entities e ON e.id = r.to_id
        WHERE r.from_id = ?
        ORDER BY r.relation, e.title
      `).all(fromId) as any[];

      const results = relations.map((row) => ({
        to_id: row.to_id,
        relation: row.relation,
        title: row.title,
        type: row.type,
        slug: row.slug,
      }));

      return NextResponse.json({ from: fromId, relations: results });
    }

    if (toId) {
      const relations = db.prepare(`
        SELECT r.from_id, r.relation, e.type, e.title, e.slug
        FROM relations r
        JOIN entities e ON e.id = r.from_id
        WHERE r.to_id = ?
        ORDER BY r.relation, e.title
      `).all(toId) as any[];

      const results = relations.map((row) => ({
        from_id: row.from_id,
        relation: row.relation,
        title: row.title,
        type: row.type,
        slug: row.slug,
      }));

      return NextResponse.json({ to: toId, relations: results });
    }

    const allRelations = db.prepare(`
      SELECT r.from_id, r.to_id, r.relation, e.type, e.title, e.slug
      FROM relations r
      JOIN entities e ON e.id = r.to_id
      ORDER BY r.from_id, r.relation, e.title
    `).all() as any[];

    const results = allRelations.map((row) => ({
      from_id: row.from_id,
      to_id: row.to_id,
      relation: row.relation,
      title: row.title,
      type: row.type,
      slug: row.slug,
    }));

    return NextResponse.json({ relations: results });
  } catch (error) {
    console.error('Error fetching relations:', error);
    return NextResponse.json({ error: 'Failed to fetch relations' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const from_id = request.nextUrl.searchParams.get('from');
    const to_id = request.nextUrl.searchParams.get('to');
    const relation = request.nextUrl.searchParams.get('relation');

    if (!from_id || !to_id || !relation) {
      return NextResponse.json({ error: 'Missing from_id, to_id, or relation' }, { status: 400 });
    }

    const info = getWritebackInfo(from_id);
    if (!info) {
      return NextResponse.json({ error: 'From entity not found' }, { status: 404 });
    }

    const file = readEntity(info.type, info.slug);
    if (!file) {
      return NextResponse.json({ error: 'Entity markdown not found' }, { status: 404 });
    }

    const frontmatter = { ...file.frontmatter };
    const existing = Array.isArray(frontmatter.relations)
      ? (frontmatter.relations as RelationEntry[])
      : [];

    const next = existing.filter((entry) => !sameRelation(entry, to_id, relation));
    if (next.length === existing.length) {
      return NextResponse.json({ error: 'Relation not found' }, { status: 404 });
    }

    if (next.length === 0) {
      delete frontmatter.relations;
    } else {
      frontmatter.relations = next;
    }
    writeEntity(info.type, info.slug, frontmatter, file.content);
    buildRelations();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting relation:', error);
    return NextResponse.json({ error: 'Failed to delete relation' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { from_id, to_id, relation } = await request.json();

    if (!from_id || !to_id || !relation) {
      return NextResponse.json({ error: 'Missing from_id, to_id, or relation' }, { status: 400 });
    }

    if (from_id === to_id) {
      return NextResponse.json({ error: 'Cannot create self-relation' }, { status: 400 });
    }

    const db = initDb();
    const toExists = db.prepare('SELECT id FROM entities WHERE id = ?').get(to_id);
    if (!toExists) {
      return NextResponse.json({ error: 'Target entity not found' }, { status: 404 });
    }

    const info = getWritebackInfo(from_id);
    if (!info) {
      return NextResponse.json({ error: 'From entity not found' }, { status: 404 });
    }

    const file = readEntity(info.type, info.slug);
    if (!file) {
      return NextResponse.json({ error: 'Entity markdown not found' }, { status: 404 });
    }

    const frontmatter = { ...file.frontmatter };
    const existing = Array.isArray(frontmatter.relations)
      ? (frontmatter.relations as RelationEntry[])
      : [];

    if (existing.some((entry) => sameRelation(entry, to_id, relation))) {
      return NextResponse.json({ error: 'Relation already exists' }, { status: 409 });
    }

    existing.push({ to: to_id, type: relation });
    frontmatter.relations = existing;
    writeEntity(info.type, info.slug, frontmatter, file.content);
    buildRelations();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating relation:', error);
    return NextResponse.json({ error: 'Failed to create relation' }, { status: 500 });
  }
}