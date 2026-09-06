'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui';
import { FileTree } from './FileTree';
import { NewFileDialog } from './NewFileDialog';

/**
 * 工作台落地页：不只是文件管理，而是写作驾驶舱。
 * 左=文件树（过滤/置顶）；中=继续写作 + 写作统计；右=快速捕获 + 跨文件笔记待办（勾选回写原文件）。
 * 数据来自 /api/workspace/overview；待办回写走 /api/workspace/todo。
 */

interface Overview {
  stats: { fileCount: number; totalWords: number; active7d: { date: string; count: number }[] };
  recent: { path: string; name: string; mtime: string; words: number }[];
  todos: { file: string; line: number; text: string; checked: boolean }[];
  daily_today: { path: string; exists: boolean };
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} 天前`;
  return new Date(iso).toLocaleDateString('zh-CN');
}

export function WorkspaceHome() {
  const router = useRouter();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [treeKey, setTreeKey] = useState(0);
  const [quickTitle, setQuickTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [dailyBusy, setDailyBusy] = useState(false);
  const [togglingTodo, setTogglingTodo] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  const flash = useCallback((text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(''), 2500);
  }, []);

  const loadOverview = useCallback(async () => {
    try {
      const res = await fetch('/api/workspace/overview');
      if (res.ok) setOverview(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const quickAdd = async () => {
    const title = quickTitle.trim();
    if (!title) return;
    setAdding(true);
    try {
      const slug = `task-${Date.now().toString(36)}`;
      const today = new Date();
      const p = (n: number) => String(n).padStart(2, '0');
      const due = `${today.getFullYear()}-${p(today.getMonth() + 1)}-${p(today.getDate())}`;
      const res = await fetch('/api/entities/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          data: { id: slug, type: 'task', title, status: 'todo', tags: ['quick-capture'], due_date: due },
          content: '',
        }),
      });
      if (!res.ok) throw new Error('创建失败');
      setQuickTitle('');
      flash('已加入今日任务 ✓');
    } catch {
      flash('快速捕获失败');
    } finally {
      setAdding(false);
    }
  };

  const openDaily = async () => {
    if (!overview?.daily_today) return;
    setDailyBusy(true);
    try {
      const { path, exists } = overview.daily_today;
      if (!exists) {
        const today = new Date();
        const res = await fetch('/api/workspace/tree', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path, content: `# ${path.replace('daily/', '').replace('.md', '')}\n\n` }),
        });
        if (!res.ok) throw new Error();
        setTreeKey((k) => k + 1);
        await loadOverview();
      }
      router.push(`/workspace/${path}`);
    } catch {
      flash('打开今日笔记失败');
    } finally {
      setDailyBusy(false);
    }
  };

  const toggleTodo = async (todo: Overview['todos'][number]) => {
    const key = `${todo.file}:${todo.line}`;
    setTogglingTodo(key);
    // 乐观更新
    setOverview((prev) =>
      prev
        ? { ...prev, todos: prev.todos.map((t) => (t.file === todo.file && t.line === todo.line ? { ...t, checked: !t.checked } : t)) }
        : prev
    );
    try {
      const res = await fetch('/api/workspace/todo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: todo.file, line: todo.line, checked: !todo.checked }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || '回写失败');
      }
    } catch (err) {
      // 回滚
      setOverview((prev) =>
        prev
          ? { ...prev, todos: prev.todos.map((t) => (t.file === todo.file && t.line === todo.line ? { ...t, checked: todo.checked } : t)) }
          : prev
      );
      alert(err instanceof Error ? err.message : '回写失败');
    } finally {
      setTogglingTodo(null);
    }
  };

  const stats = overview?.stats;
  const maxActive = Math.max(1, ...(stats?.active7d.map((d) => d.count) || [1]));
  const openTodos = (overview?.todos || []).filter((t) => !t.checked);
  const doneTodos = (overview?.todos || []).filter((t) => t.checked);

  return (
    <div className="space-y-6">
      <PageHeader
        title="工作台"
        description="写作驾驶舱：文件、字数、笔记里的待办，都在这里"
        actions={
          <>
            <button onClick={openDaily} disabled={dailyBusy || loading} className="btn-secondary">
              {dailyBusy ? '准备中...' : overview?.daily_today.exists ? '打开今日笔记' : '新建今日笔记'}
            </button>
            <NewFileDialog />
          </>
        }
      />

      {notice && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左：文件树 */}
        <div className="lg:col-span-1">
          <FileTree refreshKey={treeKey} />
        </div>

        {/* 中：继续写作 + 写作统计 */}
        <div className="lg:col-span-1 space-y-6">
          <section className="card p-5">
            <h2 className="section-title mb-3">继续写作</h2>
            {loading ? (
              <p className="text-sm text-gray-400 py-1">加载中...</p>
            ) : !overview || overview.recent.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-1">工作区还没有文件，点「新建文件」开始。</p>
            ) : (
              <ul className="space-y-2">
                {overview.recent.slice(0, 3).map((file) => (
                  <li key={file.path}>
                    <Link
                      href={`/workspace/${file.path}`}
                      className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                    >
                      <span className="flex-1 min-w-0">
                        <span className="block truncate text-sm font-medium text-gray-900 dark:text-white">{file.name}</span>
                        <span className="block text-xs text-gray-400 mt-0.5">{relativeTime(file.mtime)} · 约 {file.words} 字</span>
                      </span>
                      <span className="shrink-0 text-xs text-blue-600 dark:text-blue-400">继续 →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card p-5">
            <h2 className="section-title mb-3">写作统计</h2>
            <div className="flex items-baseline gap-4">
              <p className="text-3xl font-bold text-gray-900 dark:text-white leading-none">
                {(stats?.totalWords || 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-400">总字数 · {stats?.fileCount || 0} 个文件</p>
            </div>
            <div className="mt-4 flex items-end gap-1.5 h-16">
              {(stats?.active7d || []).map((day) => (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1" title={`${day.date}：${day.count} 个文件更新`}>
                  <div
                    className={`w-full rounded-t ${day.count > 0 ? 'bg-blue-500' : 'bg-gray-100 dark:bg-gray-800'}`}
                    style={{ height: `${Math.max(6, (day.count / maxActive) * 100)}%` }}
                  />
                  <span className="text-[10px] text-gray-400">{day.date.slice(8)}</span>
                </div>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-gray-400">近 7 天每天有更新的文件数</p>
          </section>
        </div>

        {/* 右：快速捕获 + 跨文件待办 */}
        <div className="lg:col-span-1 space-y-6">
          <section className="card p-5">
            <h2 className="section-title mb-3">快速捕获</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !adding && quickAdd()}
                placeholder="写作时想到一件事..."
                className="input flex-1 min-w-0"
              />
              <button onClick={quickAdd} disabled={adding || !quickTitle.trim()} className="btn-primary shrink-0">
                添加
              </button>
            </div>
          </section>

          <section className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title">笔记内待办</h2>
              <span className="text-xs text-gray-400">
                {openTodos.length > 0 ? `待办 ${openTodos.length}` : doneTodos.length > 0 ? '全部完成' : ''}
              </span>
            </div>
            {!overview || overview.todos.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-1">
                在任意笔记里写 <code className="text-xs">- [ ] 待办内容</code>，会自动汇总到这里，勾选后直接回写原文件。
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[420px] overflow-y-auto scroll-thin">
                {[...openTodos, ...doneTodos].map((todo) => {
                  const key = `${todo.file}:${todo.line}`;
                  return (
                    <li key={key} className="flex items-start gap-2.5 py-2">
                      <button
                        onClick={() => toggleTodo(todo)}
                        disabled={togglingTodo === key}
                        title={todo.checked ? '标为未完成（回写原文件）' : '完成（回写原文件）'}
                        className={`mt-0.5 shrink-0 w-4 h-4 rounded border flex items-center justify-center text-[10px] leading-none transition-colors ${
                          todo.checked
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-gray-300 dark:border-gray-600 hover:border-emerald-500'
                        }`}
                      >
                        {todo.checked ? '✓' : ''}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm break-words ${
                            todo.checked ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-gray-200'
                          }`}
                        >
                          {todo.text}
                        </p>
                        <Link
                          href={`/workspace/${todo.file}`}
                          className="mt-0.5 inline-block text-[11px] text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {todo.file.split('/').pop()} →
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
