import { NextRequest, NextResponse } from 'next/server';
import { resolveWikiLinks } from '@/lib/wiki-links';
import { getWikiResolver } from '@/lib/wiki-resolver';

export const runtime = 'nodejs';

/** 解析正文中的 [[id]] / [[id|别名]] wiki 链接（供实体 markdown 与 workspace 预览共用） */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const content: string = typeof body?.content === 'string' ? body.content : '';
    if (!content) {
      return NextResponse.json({ markdown: '' });
    }
    return NextResponse.json({ markdown: resolveWikiLinks(content, getWikiResolver()) });
  } catch (error) {
    console.error('Failed to resolve wiki links:', error);
    return NextResponse.json({ error: 'Failed to resolve wiki links' }, { status: 500 });
  }
}
