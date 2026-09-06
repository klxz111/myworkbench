import { NextRequest, NextResponse } from 'next/server';
import { addFeed, getStaleFeedIds, listFeeds } from '@/lib/rss';

export const runtime = 'nodejs';

export async function GET() {
  try {
    return NextResponse.json({
      feeds: listFeeds(),
      stale_feed_ids: getStaleFeedIds(),
      stale_ttl_minutes: 30,
    });
  } catch (error) {
    console.error('Error listing feeds:', error);
    return NextResponse.json({ error: 'Failed to list feeds' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const url = typeof body.url === 'string' ? body.url : '';
    const category = typeof body.category === 'string' ? body.category : '';
    if (!url) {
      return NextResponse.json({ error: '缺少 url' }, { status: 400 });
    }
    const result = await addFeed(url, category);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ feed: result.feed });
  } catch (error) {
    console.error('Error adding feed:', error);
    return NextResponse.json({ error: 'Failed to add feed' }, { status: 500 });
  }
}
