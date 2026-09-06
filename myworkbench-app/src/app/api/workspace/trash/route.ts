import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getWorkspaceRoot, safeJoin } from '@/lib/workspace-path';

export const runtime = 'nodejs';

/**
 * 工作区回收站：DELETE /api/workspace/file 的软删目标目录是 workspace/.trash/，
 * 条目文件名格式 `<YYYYMMDD-HHmmss>-<原相对路径（/ → __）>`，恢复时反向解析。
 */

const TRASH_DIR = '.trash';
const NAME_PREFIX_RE = /^(\d{8}-\d{6})-(.+)$/;

function trashDirPath(): string {
  return safeJoin(getWorkspaceRoot(), TRASH_DIR);
}

/** 从回收站文件名解析原相对路径（含合法性校验，拒绝路径注入） */
function originOf(trashName: string): string | null {
  if (!/^[0-9]{8}-[0-9]{6}-.+$/.test(trashName) || trashName.includes('/') || trashName.includes('..')) return null;
  const m = trashName.match(NAME_PREFIX_RE);
  if (!m) return null;
  const origin = m[2].replace(/__/g, '/');
  if (origin.startsWith('.') || origin.includes('..')) return null;
  return origin;
}

export async function GET() {
  try {
    const dir = trashDirPath();
    if (!fs.existsSync(dir)) {
      return NextResponse.json({ items: [] });
    }
    const items = fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile())
      .map((e) => {
        const stat = fs.statSync(path.join(dir, e.name));
        return {
          name: e.name,
          origin: originOf(e.name) || e.name,
          trashedAt: stat.mtime.toISOString(),
          size: stat.size,
        };
      })
      .sort((a, b) => b.trashedAt.localeCompare(a.trashedAt));
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Failed to list workspace trash:', error);
    return NextResponse.json({ error: 'Failed to list trash' }, { status: 500 });
  }
}

/** 恢复：按文件名反向解析原路径；原路径已存在同位文件时拒绝 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === 'string' ? body.name : '';
    const origin = originOf(name);
    if (!origin) {
      return NextResponse.json({ error: '无效的回收站条目' }, { status: 400 });
    }
    const root = getWorkspaceRoot();
    const trashPath = path.join(trashDirPath(), name);
    const originPath = safeJoin(root, origin);
    if (!fs.existsSync(trashPath)) {
      return NextResponse.json({ error: '回收站条目不存在' }, { status: 404 });
    }
    if (fs.existsSync(originPath)) {
      return NextResponse.json({ error: `原位置已存在 ${origin}` }, { status: 409 });
    }
    fs.mkdirSync(path.dirname(originPath), { recursive: true });
    fs.renameSync(trashPath, originPath);
    return NextResponse.json({ ok: true, origin });
  } catch (error) {
    console.error('Failed to restore workspace trash item:', error);
    return NextResponse.json({ error: 'Failed to restore' }, { status: 500 });
  }
}

/** 彻底删除：?name=<条目> 或 ?name=all 清空回收站 */
export async function DELETE(request: NextRequest) {
  try {
    const name = new URL(request.url).searchParams.get('name') || '';
    const dir = trashDirPath();
    if (!fs.existsSync(dir)) {
      return NextResponse.json({ ok: true });
    }
    if (name === 'all') {
      for (const entry of fs.readdirSync(dir)) {
        fs.unlinkSync(path.join(dir, entry));
      }
      return NextResponse.json({ ok: true });
    }
    if (!originOf(name)) {
      return NextResponse.json({ error: '无效的回收站条目' }, { status: 400 });
    }
    const target = path.join(dir, name);
    if (!fs.existsSync(target)) {
      return NextResponse.json({ error: '回收站条目不存在' }, { status: 404 });
    }
    fs.unlinkSync(target);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to purge workspace trash item:', error);
    return NextResponse.json({ error: 'Failed to purge' }, { status: 500 });
  }
}
