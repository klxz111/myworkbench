import { NextRequest, NextResponse } from 'next/server';
import { refreshFeeds } from '@/lib/rss';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const feedId = Number(searchParams.get('feedId') || '');
    const feedIds = Number.isInteger(feedId) && feedId > 0 ? [feedId] : undefined;
    const results = await refreshFeeds(feedIds);
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error refreshing feeds:', error);
    return NextResponse.json({ error: 'Failed to refresh feeds' }, { status: 500 });
  }
}
