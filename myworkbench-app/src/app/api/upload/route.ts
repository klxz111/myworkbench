import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { getWorkspaceRoot, safeJoin } from '@/lib/workspace-path';

export const runtime = 'nodejs';

/** 内联渲染白名单：不含 svg（可携带脚本/事件句柄，内联展示有 XSS 面） */
const ALLOWED_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

const MAX_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: '缺少 file 字段' }, { status: 400 });
    }
    const ext = path.extname(file.name).toLowerCase();
    const contentType = ALLOWED_EXT[ext];
    if (!contentType) {
      return NextResponse.json({ error: '仅支持 png/jpg/jpeg/gif/webp 图片' }, { status: 415 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: '文件超过 10MB 上限' }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // 服务端生成文件名：原始文件名不参与路径，杜绝路径注入；按月分目录
    const month = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const rel = `attachments/${month}/${Date.now().toString(36)}-${randomUUID()}${ext}`;
    const fullPath = safeJoin(getWorkspaceRoot(), rel);
    fs.mkdirSync(/* turbopackIgnore: true */ path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(/* turbopackIgnore: true */ fullPath, buffer);

    return NextResponse.json({ path: rel, content_type: contentType, size: buffer.length }, { status: 201 });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: '上传失败' }, { status: 500 });
  }
}
