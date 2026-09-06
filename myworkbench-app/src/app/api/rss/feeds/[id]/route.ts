import { NextRequest, NextResponse } from 'next/server';
import { removeFeed } from '@/lib/rss';

export const runtime = 'nodejs';

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const feedId = Number(id);
    if (!Number.isInteger(feedId) || feedId <= 0) {
      return NextResponse.json({ error: 'Invalid feed id' }, { status: 400 });
    }
    removeFeed(feedId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting feed:', error);
    return NextResponse.json({ error: 'Failed to delete feed' }, { status: 500 });
  }
}
