import { NextResponse } from 'next/server';
import { readEntity } from '@/lib/markdown';
import { EntityType } from '@/lib/markdown';
import { resolveWikiLinks } from '@/lib/wiki-links';
import { getWikiResolver } from '@/lib/wiki-resolver';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { type, id } = await params;
    const result = readEntity(type as EntityType, id);
    if (!result) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }
    // [[id]] wiki 链接解析为真实路由链接
    const markdown = resolveWikiLinks(result.content, getWikiResolver());
    return NextResponse.json({ markdown });
  } catch (error) {
    console.error('Failed to load markdown:', error);
    return NextResponse.json(
      { error: 'Failed to load markdown file' },
      { status: 500 }
    );
  }
}
