import { NextRequest, NextResponse } from 'next/server';
import { initDb } from '@/lib/db';
import { readEntity, writeEntity, deleteEntity, computeContentHash } from '@/lib/markdown';
import { EntityType } from '@/lib/markdown';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; slug: string }> }
) {
  try {
    const { type, slug } = await params;
    const entity = readEntity(type as EntityType, slug);
    if (!entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: entity.frontmatter.id,
      type: entity.type,
      slug: entity.slug,
      title: entity.frontmatter.title,
      status: entity.frontmatter.status,
      tags: entity.frontmatter.tags || [],
      created_at: entity.frontmatter.created_at,
      updated_at: entity.frontmatter.updated_at,
      content: entity.content,
    });
  } catch (error) {
    console.error('Error fetching entity:', error);
    return NextResponse.json({ error: 'Failed to fetch entity' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; slug: string }> }
) {
  try {
    const { type, slug } = await params;
    const body = await request.json();

    const existing = readEntity(type as EntityType, slug);
    if (!existing) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    const updatedData = {
      ...existing.frontmatter,
      ...body.data,
      updated_at: new Date().toISOString(),
    };

    const entity = writeEntity(type as EntityType, slug, updatedData, body.content || existing.content);

    const db = initDb();
    const contentHash = computeContentHash(JSON.stringify(updatedData) + entity.content);
    db.prepare(
      `UPDATE entities SET title = ?, status = ?, tags = ?, content_hash = ?, content = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      updatedData.title,
      updatedData.status || 'active',
      JSON.stringify(updatedData.tags || []),
      contentHash,
      entity.content,
      entity.id
    );

    return NextResponse.json({
      id: entity.frontmatter.id,
      title: entity.frontmatter.title,
      status: entity.frontmatter.status,
      tags: entity.frontmatter.tags || [],
      updated_at: entity.frontmatter.updated_at,
      content: entity.content,
    });
  } catch (error) {
    console.error('Error updating entity:', error);
    return NextResponse.json({ error: 'Failed to update entity' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; slug: string }> }
) {
  try {
    const { type, slug } = await params;

    const success = deleteEntity(type as EntityType, slug);
    if (!success) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    const db = initDb();
    db.prepare('DELETE FROM relations WHERE from_id = ? OR to_id = ?').run(slug, slug);
    db.prepare('DELETE FROM entities WHERE id = ?').run(slug);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting entity:', error);
    return NextResponse.json({ error: 'Failed to delete entity' }, { status: 500 });
  }
}
