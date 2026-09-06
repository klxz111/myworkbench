import { NextRequest, NextResponse } from 'next/server';
import { initDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q')?.trim() || '';

    if (!query) {
      return NextResponse.json({ query: '', results: [] });
    }

    const db = initDb();
    // entities_fts 是 contentless 表（不存列值），须按 rowid 关联主表
    const rows = db.prepare(`
      SELECT
        e.type,
        e.title,
        e.slug,
        e.content
      FROM entities_fts
      JOIN entities e ON e.rowid = entities_fts.rowid
      WHERE entities_fts MATCH ?
      ORDER BY bm25(entities_fts)
    `).all(query) as any[];

    const results = rows.map((row) => {
      const title = row.title;
      const content = row.content || '';
      const lowerQ = query.toLowerCase();
      let snippet = '';

      if (title.toLowerCase().includes(lowerQ)) {
        snippet = title;
      } else {
        const lowerContent = content.toLowerCase();
        const index = lowerContent.indexOf(lowerQ);
        if (index >= 0) {
          const start = Math.max(0, index - 50);
          const end = Math.min(content.length, index + query.length + 50);
          snippet =
            (start > 0 ? '...' : '') +
            content.slice(start, end) +
            (end < content.length ? '...' : '');
        }
      }

      return {
        type: row.type,
        title,
        slug: row.slug,
        snippet,
      };
    });

    return NextResponse.json({ query, results });
  } catch (error) {
    console.error('Error searching entities:', error);
    return NextResponse.json({ error: 'Failed to search entities' }, { status: 500 });
  }
}
