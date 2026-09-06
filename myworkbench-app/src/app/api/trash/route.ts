import { NextRequest, NextResponse } from 'next/server';
import { listTrash, restoreFromTrash, purgeTrashFile } from '@/lib/markdown';
import { syncMarkdownToSqlite } from '@/lib/sync';

export const runtime = 'nodejs';

export async function GET() {
  try {
    return NextResponse.json({ items: listTrash() });
  } catch (error) {
    console.error('Error listing trash:', error);
    return NextResponse.json({ error: 'Failed to list trash' }, { status: 500 });
  }
}

/** 恢复：body { file } */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const file: string = body?.file;
    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }
    const result = restoreFromTrash(file);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.error?.includes('已存在') ? 409 : 400 });
    }
    syncMarkdownToSqlite();
    return NextResponse.json({ success: true, type: result.type, slug: result.slug });
  } catch (error) {
    console.error('Error restoring from trash:', error);
    return NextResponse.json({ error: 'Failed to restore' }, { status: 500 });
  }
}

/** 彻底删除：body { file } */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const file: string = body?.file;
    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }
    const ok = purgeTrashFile(file);
    if (!ok) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error purging trash file:', error);
    return NextResponse.json({ error: 'Failed to purge' }, { status: 500 });
  }
}
