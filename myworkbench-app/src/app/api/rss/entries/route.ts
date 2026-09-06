import { NextRequest, NextResponse } from 'next/server';
import { initDb } from '@/lib/db';

export const runtime = 'nodejs';

export interface RssEntryRow {
  id: number;
  feed_id: number;
  guid: string;
  title: string;
  link: string | null;
  author: string | null;
  published_at: string | null;
  summary: string | null;
  read: number;
  feed_title: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const feedId = Number(searchParams.get('feedId') || '');
    const unreadOnly = searchParams.get('unread') === '1';
    const limit = Math.min(Math.max(Number(searchParams.get('limit') || '50'), 1), 200);
    const offset = Math.max(Number(searchParams.get('offset') || '0'), 0);

    const where: string[] = [];
    const args: (string | number)[] = [];
    if (Number.isInteger(feedId) && feedId > 0) {
      where.push('e.feed_id = ?');
      args.push(feedId);
    }
    if (unreadOnly) {
      where.push('e.read = 0');
    }
    const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const db = initDb();
    const total = (
      db.prepare(`SELECT COUNT(*) AS c FROM rss_entries e ${whereSql}`).get(...args) as { c: number }
    ).c;
    const items = db
      .prepare(
        `SELECT e.id, e.feed_id, e.guid, e.title, e.link, e.author, e.published_at, e.summary, e.read,
                f.title AS feed_title
         FROM rss_entries e JOIN rss_feeds f ON f.id = e.feed_id
         ${whereSql}
         ORDER BY COALESCE(e.published_at, e.fetched_at) DESC, e.id DESC
         LIMIT ? OFFSET ?`
      )
      .all(...args, limit, offset) as RssEntryRow[];

    return NextResponse.json({ items, total, limit, offset });
  } catch (error) {
    console.error('Error listing entries:', error);
    return NextResponse.json({ error: 'Failed to list entries' }, { status: 500 });
  }
}
