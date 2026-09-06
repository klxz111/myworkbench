import { NextRequest, NextResponse } from 'next/server';
import { removeFeed, setFeedCategory } from '@/lib/rss';

export const runtime = 'nodejs';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const feedId = Number(id);
    if (!Number.isInteger(feedId) || feedId <= 0) {
      return NextResponse.json({ error: 'Invalid feed id' }, { status: 400 });
    }
    const body = await request.json().catch(() => ({}));
    if (typeof body.category !== 'string' || !setFeedCategory(feedId, body.category)) {
      return NextResponse.json({ error: '无效的分类或订阅不存在' }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error updating feed:', error);
    return NextResponse.json({ error: 'Failed to update feed' }, { status: 500 });
  }
}

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
