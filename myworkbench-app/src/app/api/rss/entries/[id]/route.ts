import { NextRequest, NextResponse } from 'next/server';
import { initDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const entryId = Number(id);
    if (!Number.isInteger(entryId) || entryId <= 0) {
      return NextResponse.json({ error: 'Invalid entry id' }, { status: 400 });
    }
    const body = await request.json().catch(() => ({}));
    if (typeof body.read !== 'boolean') {
      return NextResponse.json({ error: '缺少 read 布尔值' }, { status: 400 });
    }
    const db = initDb();
    const info = db.prepare('UPDATE rss_entries SET read = ? WHERE id = ?').run(body.read ? 1 : 0, entryId);
    if (info.changes === 0) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error updating entry:', error);
    return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
  }
}
