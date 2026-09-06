import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { getWorkspaceRoot, safeJoin } from '@/lib/workspace-path';

export const runtime = 'nodejs';

const CHECKBOX_RE = /^(\s*[-*+]\s\[)( |x|X)(\].*)$/;

/** 回写笔记内待办的勾选状态：按行号定位，且该行必须仍是 checkbox 行（防止文件变动后错写） */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const relPath = typeof body.path === 'string' ? body.path : '';
    const lineNo = Number(body.line);
    const checked = Boolean(body.checked);
    if (!relPath || !Number.isInteger(lineNo) || lineNo < 1) {
      return NextResponse.json({ error: '缺少 path 或 line' }, { status: 400 });
    }

    const fullPath = safeJoin(getWorkspaceRoot(), relPath);
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const raw = fs.readFileSync(fullPath, 'utf-8');
    const lines = raw.split('\n');
    const idx = lineNo - 1;
    const target = lines[idx];
    if (target === undefined || !CHECKBOX_RE.test(target)) {
      return NextResponse.json({ error: '该行已不是待办项（文件可能已变动），请刷新' }, { status: 409 });
    }
    lines[idx] = target.replace(CHECKBOX_RE, (_s, head: string, _mark: string, tail: string) => `${head}${checked ? 'x' : ' '}${tail}`);
    fs.writeFileSync(fullPath, lines.join('\n'), 'utf-8');

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to toggle workspace todo:', error);
    return NextResponse.json({ error: 'Failed to toggle todo' }, { status: 500 });
  }
}
