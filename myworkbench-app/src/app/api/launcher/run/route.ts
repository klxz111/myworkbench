import { NextRequest, NextResponse } from 'next/server';
import { runLauncherButton } from '@/lib/launcher';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const id = typeof body.id === 'string' ? body.id : '';
    if (!id) {
      return NextResponse.json({ error: '缺少 id' }, { status: 400 });
    }
    const result = await runLauncherButton(id);
    if (!result) {
      return NextResponse.json({ error: '按钮不存在' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, label: result.button.label });
  } catch (error) {
    console.error('Failed to run launcher button:', error);
    return NextResponse.json({ error: '启动失败' }, { status: 500 });
  }
}
