import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const WORKSPACE_ROOT = path.join(process.cwd(), '..', 'workspace');

function getWorkspaceRoot(): string {
  return process.env.MYWORKBENCH_WORKSPACE || WORKSPACE_ROOT;
}

function safeJoin(root: string, rel: string): string {
  const resolved = path.resolve(root, rel);
  if (!resolved.startsWith(root)) {
    throw new Error('路径超出工作区范围');
  }
  return resolved;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const relPath = url.searchParams.get('path');
    const format = url.searchParams.get('format') || 'md';

    if (!relPath) {
      return NextResponse.json({ error: 'Missing path' }, { status: 400 });
    }

    const root = getWorkspaceRoot();
    const fullPath = safeJoin(root, relPath);

    if (!fs.existsSync(/*turbopackIgnore: true*/ fullPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const raw = fs.readFileSync(/*turbopackIgnore: true*/ fullPath, 'utf-8');
    const parsed = matter(raw);

    if (format === 'html') {
      const { marked } = await import('marked');
      const html = await marked.parse(parsed.content);
      const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${parsed.data.title || path.basename(relPath)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.6; color: #333; }
    pre { background: #f5f5f5; padding: 16px; border-radius: 6px; overflow-x: auto; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-family: 'SF Mono', Monaco, monospace; }
    blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 16px; color: #666; }
  </style>
</head>
<body>
${html}
</body>
</html>`;
      return new NextResponse(fullHtml, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="${path.basename(relPath, '.md')}.html"`,
        },
      });
    }

    return new NextResponse(raw, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${path.basename(relPath)}"`,
      },
    });
  } catch (error) {
    console.error('Failed to export workspace file:', error);
    return NextResponse.json({ error: 'Failed to export file' }, { status: 500 });
  }
}
