import { NextRequest, NextResponse } from 'next/server';
import { initDb } from '@/lib/db';
import { syncMarkdownToSqlite } from '@/lib/sync';

export const runtime = 'nodejs';

/** 含 CJK（中日韩文字/假名/谚文）时 FTS 的 unicode61 分词器把整段文字当一个 token，子串搜索必然落空，改走 LIKE */
const CJK_RE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]/;

function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (m) => '\\' + m);
}

function buildSnippet(title: string, content: string, query: string): string {
  const lowerQ = query.toLowerCase();
  if (title.toLowerCase().includes(lowerQ)) return title;

  const lowerContent = content.toLowerCase();
  const index = lowerContent.indexOf(lowerQ);
  if (index < 0) return '';

  const start = Math.max(0, index - 50);
  const end = Math.min(content.length, index + query.length + 50);
  return (
    (start > 0 ? '...' : '') +
    content.slice(start, end) +
    (end < content.length ? '...' : '')
  );
}

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q')?.trim() || '';

    if (!query) {
      return NextResponse.json({ query: '', results: [] });
    }

    // 自愈：保证 SQLite 缓存与 Markdown 一致
    syncMarkdownToSqlite();

    const db = initDb();
    let rows: { type: string; title: string; slug: string; content: string }[];

    if (CJK_RE.test(query)) {
      // 中文/日文/韩文子串搜索：LIKE 扫描（个人规模数据量下成本可忽略）
      const like = `%${escapeLike(query)}%`;
      rows = db.prepare(`
        SELECT e.type, e.title, e.slug, e.content
        FROM entities e
        WHERE e.title LIKE ? ESCAPE '\\'
           OR e.content LIKE ? ESCAPE '\\'
           OR e.tags LIKE ? ESCAPE '\\'
        ORDER BY e.updated_at DESC
      `).all(like, like, like) as typeof rows;
    } else {
      const terms = query
        .split(/\s+/)
        .filter(Boolean)
        .map((t) => t.replace(/"/g, '""'));
      const match = terms
        .map((t, i) => (i < terms.length - 1 ? `"${t}"` : `${t.replace(/\*+$/, '')}*`))
        .join(' ');
      // entities_fts 是 contentless 表（不存列值），须按 rowid 关联主表
      rows = db.prepare(`
        SELECT
          e.type,
          e.title,
          e.slug,
          e.content
        FROM entities_fts
        JOIN entities e ON e.rowid = entities_fts.rowid
        WHERE entities_fts MATCH ?
        ORDER BY bm25(entities_fts)
      `).all(match) as typeof rows;
    }

    const results = rows.map((row) => ({
      type: row.type,
      title: row.title,
      slug: row.slug,
      snippet: buildSnippet(row.title, row.content || '', query),
    }));

    return NextResponse.json({ query, results });
  } catch (error) {
    console.error('Error searching entities:', error);
    return NextResponse.json({ error: 'Failed to search entities' }, { status: 500 });
  }
}
