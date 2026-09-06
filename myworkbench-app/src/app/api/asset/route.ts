import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getWorkspaceRoot, safeJoin } from '@/lib/workspace-path';

export const runtime = 'nodejs';

const CONTENT_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

/** 二进制资产服务：仅限 workspace/attachments/ 子树，扩展名决定 Content-Type */
export async function GET(request: NextRequest) {
  try {
    const rel = request.nextUrl.searchParams.get('path');
    if (!rel) {
      return NextResponse.json({ error: '缺少 path 参数' }, { status: 400 });
    }
    if (!rel.startsWith('attachments/')) {
      return NextResponse.json({ error: '仅支持 attachments/ 下的资产' }, { status: 403 });
    }
    const ext = path.extname(rel).toLowerCase();
    const contentType = CONTENT_TYPES[ext];
    if (!contentType) {
      return NextResponse.json({ error: '不支持的文件类型' }, { status: 415 });
    }

    const fullPath = safeJoin(getWorkspaceRoot(), rel);
    const stat = fs.statSync(/* turbopackIgnore: true */ fullPath);
    if (!stat.isFile()) {
      return NextResponse.json({ error: '资产不存在' }, { status: 404 });
    }

    const data = fs.readFileSync(/* turbopackIgnore: true */ fullPath);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(stat.size),
        'Cache-Control': 'private, max-age=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ error: '资产不存在' }, { status: 404 });
  }
}
