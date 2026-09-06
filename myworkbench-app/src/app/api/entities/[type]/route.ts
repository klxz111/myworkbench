import { NextRequest, NextResponse } from 'next/server';
import { initDb } from '@/lib/db';
import {
  listEntities,
  isKnownEntityType,
  isValidSlug,
  EntityType,
} from '@/lib/markdown';
import { createEntity, syncMarkdownToSqlite } from '@/lib/sync';
import { parseExtras } from '@/lib/list-extras';

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
    const sp = request.nextUrl.searchParams;
    const status = sp.get('status')?.trim() || '';
    const tag = sp.get('tag')?.trim() || '';
    const limitParam = sp.get('limit');

    // 组合 WHERE：type 恒定，status/tag 可选（tags 是 JSON 列，用 json_each 匹配）
    const whereParts = ['type = ?'];
    const whereParams: (string | number)[] = [type];
    if (status) {
      whereParts.push('status = ?');
      whereParams.push(status);
    }
    if (tag) {
      whereParts.push('EXISTS (SELECT 1 FROM json_each(entities.tags) WHERE json_each.value = ?)');
      whereParams.push(tag);
    }
    const where = whereParts.join(' AND ');

    const mapRow = (row: any) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      tags: JSON.parse(row.tags || '[]'),
      updated_at: row.updated_at,
      ...parseExtras(row.extra),
    });

    if (limitParam !== null) {
      // 分页模式：{ items, total, facets }；不带 limit 的调用保持旧的纯数组形状（零破坏）
      const limit = Math.min(Math.max(Number(limitParam) || 50, 1), 200);
      const offset = Math.max(Number(sp.get('offset')) || 0, 0);
      const totalRow = db.prepare(`SELECT COUNT(*) AS c FROM entities WHERE ${where}`).get(...whereParams) as { c: number };
      const rows = db
        .prepare(`SELECT id, title, status, tags, updated_at, extra FROM entities WHERE ${where} ORDER BY updated_at DESC, id DESC LIMIT ? OFFSET ?`)
        .all(...whereParams, limit, offset) as any[];
      // facets 覆盖该类型的全部条目（不受当前筛选影响），供工具栏下拉使用
      const statusRows = db.prepare('SELECT status, COUNT(*) AS c FROM entities WHERE type = ? GROUP BY status ORDER BY status').all(type) as { status: string; c: number }[];
      const tagRows = db.prepare(`SELECT json_each.value AS tag, COUNT(*) AS c FROM entities, json_each(entities.tags) WHERE entities.type = ? GROUP BY tag ORDER BY tag`).all(type) as { tag: string; c: number }[];
      return NextResponse.json({
        items: rows.map(mapRow),
        total: totalRow.c,
        facets: {
          statuses: statusRows.map((r) => r.status),
          tags: tagRows.map((r) => r.tag),
        },
      });
    }

    const rows = db.prepare(`SELECT id, title, status, tags, updated_at, extra FROM entities WHERE ${where} ORDER BY updated_at DESC, id DESC`).all(...whereParams) as any[];
    return NextResponse.json(rows.map(mapRow));
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
