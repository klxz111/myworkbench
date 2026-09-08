import { NextRequest, NextResponse } from 'next/server';
import { importOpml } from '@/lib/rss';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const xml = typeof body.xml === 'string' ? body.xml : '';
    if (!xml.trim()) {
      return NextResponse.json({ error: '缺少 OPML 内容' }, { status: 400 });
    }
    const result = importOpml(xml);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error importing OPML:', error);
    return NextResponse.json({ error: '导入失败' }, { status: 500 });
  }
}
