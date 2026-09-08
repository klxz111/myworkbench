import { NextRequest, NextResponse } from 'next/server';
import { getEntry, markEntryRead } from '@/lib/rss';

export const runtime = 'nodejs';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const entryId = Number(id);
    if (!Number.isInteger(entryId) || entryId <= 0) {
      return NextResponse.json({ error: '无效的条目 ID' }, { status: 400 });
    }
    const entry = getEntry(entryId);
    if (!entry) {
      return NextResponse.json({ error: '条目不存在' }, { status: 404 });
    }
    markEntryRead(entryId);
    return NextResponse.json({ entry });
  } catch (error) {
    console.error('Error fetching entry:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
