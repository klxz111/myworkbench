import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { getWorkspaceRoot, safeJoin } from '@/lib/workspace-path';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const relPath = url.searchParams.get('path');
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

    return NextResponse.json({
      path: relPath,
      content: raw,
      frontmatter: parsed.data,
      body: parsed.content,
    });
  } catch (error) {
    console.error('Failed to read workspace file:', error);
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const url = new URL(request.url);
    const relPath = url.searchParams.get('path');
    const body = await request.json();
    const { content, frontmatter } = body as { content: string; frontmatter?: Record<string, unknown> };

    if (!relPath) {
      return NextResponse.json({ error: 'Missing path' }, { status: 400 });
    }

    const root = getWorkspaceRoot();
    const fullPath = safeJoin(root, relPath);

    const dir = path.dirname(fullPath);
    if (!fs.existsSync(/*turbopackIgnore: true*/ dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let raw = content;
    if (frontmatter && Object.keys(frontmatter).length > 0) {
      raw = matter.stringify(content, frontmatter);
    }

    fs.writeFileSync(fullPath, raw, 'utf-8');

    return NextResponse.json({ success: true, path: relPath });
  } catch (error) {
    console.error('Failed to update workspace file:', error);
    return NextResponse.json({ error: 'Failed to update file' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const relPath = url.searchParams.get('path');
    if (!relPath) {
      return NextResponse.json({ error: 'Missing path' }, { status: 400 });
    }

    const root = getWorkspaceRoot();
    const fullPath = safeJoin(root, relPath);

    if (!fs.existsSync(/*turbopackIgnore: true*/ fullPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    fs.unlinkSync(/*turbopackIgnore: true*/ fullPath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete workspace file:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
