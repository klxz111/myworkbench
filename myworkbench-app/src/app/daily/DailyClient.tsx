'use client';

import { useCallback, useEffect, useState } from 'react';
import { MarkdownEditor } from '@/app/workspace/_components/MarkdownEditor';

function todayPath(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `daily/${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.md`;
}

function dateFromPath(path: string): string | null {
  const m = path.match(/daily\/(\d{4}-\d{2}-\d{2})\.md$/);
  return m ? m[1] : null;
}

const TEMPLATE = `# 今日笔记

## 捕获

-

## 事件

-

## 决策与判断

-
`;

export function DailyClient() {
  const [today] = useState(() => todayPath());
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [existsToday, setExistsToday] = useState<boolean | null>(null);
  const [creating, setCreating] = useState(false);
  const [notes, setNotes] = useState<{ path: string; date: string }[]>([]);

  const loadList = useCallback(async () => {
    try {
      const res = await fetch('/api/workspace/tree');
      if (!res.ok) return;
      const data = await res.json();
      const norm = (p: string) => p.replace(/\\/g, '/');
      const dailyNode = (data.tree || []).find((n: { path: string }) => norm(n.path) === 'daily');
      const list = (dailyNode?.children || [])
        .map((c: { path: string }) => ({ path: norm(c.path), date: dateFromPath(norm(c.path)) || '' }))
        .filter((c: { date: string }) => c.date)
        .sort((a: { date: string }, b: { date: string }) => b.date.localeCompare(a.date));
      setNotes(list);
    } catch {
      // 列表加载失败不阻塞主流程
    }
  }, []);

  useEffect(() => {
    async function checkToday() {
      try {
        const res = await fetch(`/api/workspace/file?path=${encodeURIComponent(today)}`);
        setExistsToday(res.ok);
        if (res.ok) setSelectedPath(today);
      } catch {
        setExistsToday(false);
      }
    }
    checkToday();
    loadList();
  }, [today, loadList]);

  const createToday = async () => {
    setCreating(true);
    try {
      const dateStr = today.match(/(\d{4}-\d{2}-\d{2})/)?.[1] || '';
      const res = await fetch(`/api/workspace/file?path=${encodeURIComponent(today)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: TEMPLATE,
          frontmatter: {
            title: `日记 ${dateStr}`,
            tags: ['daily'],
            status: 'active',
          },
        }),
      });
      if (!res.ok) throw new Error('创建今日笔记失败');
      setExistsToday(true);
      setSelectedPath(today);
      loadList();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <aside className="lg:col-span-1 space-y-4">
        <div className="card p-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">今日</p>
          {existsToday === null ? (
            <p className="text-xs text-gray-400">检查中...</p>
          ) : existsToday ? (
            <button
              onClick={() => setSelectedPath(today)}
              className={`w-full text-left px-3 py-2 rounded text-sm ${
                selectedPath === today
                  ? 'bg-accent-50 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              今日笔记
            </button>
          ) : (
            <button
              onClick={createToday}
              disabled={creating}
              className="w-full px-3 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 disabled:opacity-50 text-sm"
            >
              {creating ? '创建中...' : '创建今日笔记'}
            </button>
          )}
        </div>

        <div className="card p-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">历史日记</p>
          {notes.length === 0 ? (
            <p className="text-xs text-gray-400">暂无历史日记。</p>
          ) : (
            <ul className="space-y-1">
              {notes.map((n) => (
                <li key={n.path}>
                  <button
                    onClick={() => setSelectedPath(n.path)}
                    className={`w-full text-left px-3 py-1.5 rounded text-sm ${
                      selectedPath === n.path
                        ? 'bg-accent-50 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {n.date}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-[11px] text-gray-400">
            笔记存放在 workspace/daily/，可在工作台查看完整文件树。
          </p>
        </div>
      </aside>

      <main className="lg:col-span-3">
        {selectedPath ? (
          <MarkdownEditor key={selectedPath} filePath={selectedPath} />
        ) : (
          <div className="card p-10 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              选择或创建一篇日记开始记录。日记正文支持 [[entity-id]] 链接实体。
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
