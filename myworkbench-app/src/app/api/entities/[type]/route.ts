import { NextRequest, NextResponse } from 'next/server';
import { initDb } from '@/lib/db';
import {
  listEntities,
  isKnownEntityType,
  isValidSlug,
  EntityType,
} from '@/lib/markdown';
import { createEntity, syncMarkdownToSqlite } from '@/lib/sync';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    if (!isKnownEntityType(type)) {
      return NextResponse.json({ error: 'Unknown entity type' }, { status: 404 });
    }
    const q = request.nextUrl.searchParams.get('q')?.trim() || '';

    // 自愈：保证 SQLite 缓存与 Markdown 一致（含旧库重建后的回填）
    syncMarkdownToSqlite();

    if (q) {
      const entities = listEntities(type as EntityType);
      const lowerQ = q.toLowerCase();
      const results = entities
        .filter((e) =>
          e.frontmatter.title.toLowerCase().includes(lowerQ) ||
          e.content.toLowerCase().includes(lowerQ)
        )
        .map((e) => {
          const title = e.frontmatter.title;
          const content = e.content;
          let snippet = '';

          if (title.toLowerCase().includes(lowerQ)) {
            snippet = title;
          } else {
            const lowerContent = content.toLowerCase();
            const index = lowerContent.indexOf(lowerQ);
            if (index >= 0) {
              const start = Math.max(0, index - 50);
              const end = Math.min(content.length, index + q.length + 50);
              snippet =
                (start > 0 ? '...' : '') +
                content.slice(start, end) +
                (end < content.length ? '...' : '');
            }
          }

          return {
            type: e.type,
            title,
            slug: e.slug,
            snippet,
          };
        });

      return NextResponse.json({ query: q, results });
    }

    const db = initDb();
    const rows = db.prepare('SELECT id, title, status, tags, updated_at FROM entities WHERE type = ? ORDER BY updated_at DESC').all(type) as any[];

    const data = rows.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      tags: JSON.parse(row.tags || '[]'),
      updated_at: row.updated_at,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching entities:', error);
    return NextResponse.json({ error: 'Failed to fetch entities' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    if (!isKnownEntityType(type)) {
      return NextResponse.json({ error: 'Unknown entity type' }, { status: 404 });
    }
    const body = await request.json();
    const { slug, data, content } = body;

    if (!slug || !data || typeof content !== 'string') {
      return NextResponse.json({ error: 'Missing required fields: slug, data, content' }, { status: 400 });
    }
    if (!isValidSlug(slug)) {
      return NextResponse.json({ error: '非法的 slug' }, { status: 400 });
    }

    const entityData = {
      ...data,
      content,
      id: data.id || slug,
    };
    const entity = createEntity(type as EntityType, slug, entityData);

    return NextResponse.json(entity, { status: 201 });
  } catch (error) {
    console.error('Error creating entity:', error);
    return NextResponse.json({ error: 'Failed to create entity' }, { status: 500 });
  }
}
