import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { getWorkspaceRoot, safeJoin } from '@/lib/workspace-path';
import { countWords } from '@/lib/wordcount';

export const runtime = 'nodejs';

/**
 * 工作台总览：写作统计（文件数/总字数/近 7 天活跃）、最近文件（含字数）、
 * 跨文件笔记待办（- [ ] 汇总，配合 PUT /api/workspace/todo 回写勾选）、今日笔记状态。
 */

interface FileMeta {
  path: string;
  name: string;
  mtimeMs: number;
  words: number;
}

const TODO_RE = /^(\s*)[-*+]\s\[( |x|X)\]\s(.*)$/;
const MAX_SCAN_FILES = 300;
const MAX_TODOS = 100;

function walkMdFiles(dirPath: string, relDir: string, out: FileMeta[]): void {
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
        const stat = fs.statSync(fullPath);
        const raw = fs.readFileSync(fullPath, 'utf-8');
        const body = matter(raw).content;
        out.push({ path: relPath, name: entry.name, mtimeMs: stat.mtimeMs, words: countWords(body).words });
      } catch {
        /* 单个文件读失败跳过 */
      }
    }
  }
}

export async function GET() {
  try {
    const root = getWorkspaceRoot();
    if (!fs.existsSync(root)) {
      return NextResponse.json({
        stats: { fileCount: 0, totalWords: 0, active7d: [] },
        recent: [],
        todos: [],
        daily_today: { path: '', exists: false },
      });
    }

    const files: FileMeta[] = [];
    walkMdFiles(root, '', files);

    const totalWords = files.reduce((sum, f) => sum + f.words, 0);

    // 近 7 天活跃：每天有更新的文件数（按本地日期）
    const dayKey = (ms: number) => {
      const d = new Date(ms);
      const p = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    };
    const countByDay = new Map<string, number>();
    for (const f of files) {
      const key = dayKey(f.mtimeMs);
      countByDay.set(key, (countByDay.get(key) || 0) + 1);
    }
    const active7d: { date: string; count: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = dayKey(d.getTime());
      active7d.push({ date: key, count: countByDay.get(key) || 0 });
    }

    const recent = [...files]
      .sort((a, b) => b.mtimeMs - a.mtimeMs)
      .slice(0, 8)
      .map((f) => ({ path: f.path, name: f.name, mtime: new Date(f.mtimeMs).toISOString(), words: f.words }));

    // 跨文件待办：按文件修改时间新→旧扫描
    const todos: { file: string; line: number; text: string; checked: boolean }[] = [];
    for (const f of [...files].sort((a, b) => b.mtimeMs - a.mtimeMs)) {
      if (todos.length >= MAX_TODOS) break;
      let raw: string;
      try {
        raw = fs.readFileSync(safeJoin(root, f.path), 'utf-8');
      } catch {
        continue;
      }
      const lines = raw.split('\n');
      for (let i = 0; i < lines.length && todos.length < MAX_TODOS; i++) {
        const m = lines[i].match(TODO_RE);
        if (m) {
          todos.push({ file: f.path, line: i + 1, text: m[3].trim().slice(0, 120), checked: m[2].toLowerCase() === 'x' });
        }
      }
    }

    const today = dayKey(Date.now());
    const dailyPath = `daily/${today}.md`;
    const dailyExists = fs.existsSync(safeJoin(root, dailyPath));

    return NextResponse.json({
      stats: { fileCount: files.length, totalWords, active7d },
      recent,
      todos,
      daily_today: { path: dailyPath, exists: dailyExists },
    });
  } catch (error) {
    console.error('Failed to build workspace overview:', error);
    return NextResponse.json({ error: 'Failed to build overview' }, { status: 500 });
  }
}
