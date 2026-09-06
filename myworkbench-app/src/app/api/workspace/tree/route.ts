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

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: TreeNode[];
  updated_at?: string;
}

function buildTree(dirPath: string, relDir: string): TreeNode[] {
  if (!fs.existsSync(dirPath)) return [];

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const nodes: TreeNode[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dirPath, entry.name);
    const relPath = path.join(relDir, entry.name);

    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        path: relPath,
        type: 'directory',
        children: buildTree(fullPath, relPath),
      });
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      let updated_at: string | undefined;
      try {
        const stat = fs.statSync(fullPath);
        updated_at = stat.mtime.toISOString();
      } catch {}
      nodes.push({
        name: entry.name,
        path: relPath,
        type: 'file',
        updated_at,
      });
    }
  }

  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export async function GET() {
  try {
    const root = getWorkspaceRoot();
    if (!fs.existsSync(/*turbopackIgnore: true*/ root)) {
      return NextResponse.json({ tree: [] });
    }

    const tree = buildTree(root, '');
    return NextResponse.json({ tree });
  } catch (error) {
    console.error('Failed to load workspace tree:', error);
    return NextResponse.json({ error: 'Failed to load workspace tree' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { path: relPath, content, frontmatter } = body as { path: string; content?: string; frontmatter?: Record<string, unknown> };

    if (!relPath) {
      return NextResponse.json({ error: 'Missing path' }, { status: 400 });
    }

    const root = getWorkspaceRoot();
    const fullPath = safeJoin(root, relPath);

    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const finalFrontmatter = {
      title: path.basename(relPath, '.md'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...frontmatter,
    };

    const finalContent = content || '';
    const raw = matter.stringify(finalContent, finalFrontmatter);
    fs.writeFileSync(fullPath, raw, 'utf-8');

    return NextResponse.json({ success: true, path: relPath });
  } catch (error) {
    console.error('Failed to save workspace file:', error);
    return NextResponse.json({ error: 'Failed to save file' }, { status: 500 });
  }
}
