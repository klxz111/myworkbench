import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getWorkspaceRoot } from '@/lib/workspace-path';

export const runtime = 'nodejs';

/**
 * 工作区全文搜索：扫描全部 Markdown 内容（含 frontmatter），返回命中行与片段。
 * 单文件最多 3 个片段；按命中次数排序，最多返回 30 个文件。
 */

const MAX_SCAN_FILES = 300;
const MAX_FILES_RETURNED = 30;
const SNIPPET_RADIUS = 40;

interface Match {
  line: number;
  snippet: string;
}

interface SearchResult {
  path: string;
  name: string;
  count: number;
  mtimeMs: number;
  matches: Match[];
}

function walkMdFiles(dirPath: string, relDir: string, out: { path: string; fullPath: string; mtimeMs: number }[]): void {
  if (!fs.existsSync(dirPath) || out.length >= MAX_SCAN_FILES) return;
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (out.length >= MAX_SCAN_FILES) return;
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dirPath, entry.name);
    const relPath = relDir ? `${relDir}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      walkMdFiles(fullPath, relPath, out);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      try {
        out.push({ path: relPath, fullPath, mtimeMs: fs.statSync(fullPath).mtimeMs });
      } catch {
        /* 跳过 */
      }
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const q = (new URL(request.url).searchParams.get('q') || '').trim();
    if (!q || q.length > 100) {
      return NextResponse.json({ results: [] });
    }

    const root = getWorkspaceRoot();
    const files: { path: string; fullPath: string; mtimeMs: number }[] = [];
    walkMdFiles(root, '', files);

    const lowerQ = q.toLowerCase();
    const results: SearchResult[] = [];
    for (const file of files) {
      let raw: string;
      try {
        raw = fs.readFileSync(file.fullPath, 'utf-8');
      } catch {
        continue;
      }
      const lower = raw.toLowerCase();
      let from = 0;
      let count = 0;
      const matches: Match[] = [];
      while (count < 100) {
        const idx = lower.indexOf(lowerQ, from);
        if (idx === -1) break;
        count++;
        if (matches.length < 3) {
          const lineNo = raw.slice(0, idx).split('\n').length;
          const start = Math.max(0, idx - SNIPPET_RADIUS);
          const snippet = raw.slice(start, idx + q.length + SNIPPET_RADIUS).replace(/\s+/g, ' ').trim();
          matches.push({
            line: lineNo,
            snippet: (start > 0 ? '…' : '') + snippet + (idx + q.length + SNIPPET_RADIUS < raw.length ? '…' : ''),
          });
        }
        from = idx + lowerQ.length;
      }
      if (count > 0) {
        results.push({ path: file.path, name: path.basename(file.path), count, mtimeMs: file.mtimeMs, matches });
      }
    }

    results.sort((a, b) => b.count - a.count || b.mtimeMs - a.mtimeMs);
    return NextResponse.json({ results: results.slice(0, MAX_FILES_RETURNED), query: q });
  } catch (error) {
    console.error('Failed to search workspace:', error);
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 });
  }
}
