'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { entityHref, ENTITY_LABELS } from '@/lib/entity-paths';
import { toggleTheme } from '@/lib/theme';

interface SearchResult {
  type: string;
  title: string;
  slug: string;
  snippet: string;
}

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  group: string;
  run: () => void;
}

const PAGE_COMMANDS: { label: string; href: string }[] = [
  { label: '首页', href: '/' },
  { label: '今日', href: '/today' },
  { label: '任务', href: '/tasks' },
  { label: '日历', href: '/calendar' },
  { label: '每日笔记', href: '/daily' },
  { label: '每周回顾', href: '/review' },
  { label: '策略', href: '/strategy' },
  { label: '研究', href: '/research' },
  { label: '决策', href: '/decisions' },
  { label: '雷达', href: '/radar' },
  { label: '网络', href: '/network' },
  { label: '知识树', href: '/knowledge' },
  { label: '档案', href: '/profile' },
  { label: '资本', href: '/capital' },
  { label: '证据', href: '/evidence' },
  { label: '实验', href: '/experiment' },
  { label: '机会', href: '/opportunity' },
  { label: '统计', href: '/stats' },
  { label: '看板', href: '/board' },
  { label: '图谱', href: '/graph' },
  { label: '工作台', href: '/workspace' },
  { label: 'RSS 订阅', href: '/rss' },
  { label: '回收站', href: '/trash' },
  { label: '设置', href: '/settings' },
];

const CREATE_TYPES = ['decision', 'task', 'evidence', 'experiment', 'opportunity', 'person', 'event', 'belief'];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [];
    for (const p of PAGE_COMMANDS) {
      items.push({
        id: `page:${p.href}`,
        label: p.label,
        hint: p.href,
        group: '页面',
        run: () => router.push(p.href),
      });
    }
    for (const type of CREATE_TYPES) {
      items.push({
        id: `create:${type}`,
        label: `新建${ENTITY_LABELS[type] || type}`,
        hint: `/entities/${type}/new`,
        group: '新建',
        run: () => router.push(`/entities/${type}/new`),
      });
    }
    items.push({
      id: 'action:theme',
      label: '切换明暗主题',
      hint: 'light / dark',
      group: '动作',
      run: () => toggleTheme(),
    });
    return items;
  }, [router]);

  const filteredCommands = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) => c.label.toLowerCase().includes(q) || (c.hint || '').toLowerCase().includes(q)
    );
  }, [commands, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setResults([]);
    setActiveIndex(0);
  }, []);

  const handleOpenEvent = useCallback(() => setOpen(true), []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const shortcut = isMac ? event.metaKey : event.ctrlKey;
      if (shortcut && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
      if (event.key === 'Escape' && open) {
        close();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    // 侧边栏/移动端搜索按钮通过该事件打开面板（Ctrl+K 之外的入口）
    window.addEventListener('mwbench:open-palette', handleOpenEvent);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mwbench:open-palette', handleOpenEvent);
    };
  }, [open, close]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const trimmed = query.trim();
      if (!trimmed) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const totalItems = filteredCommands.length + results.length;

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    const el = listRef.current?.querySelector('[data-active="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const runItem = (index: number) => {
    if (index < filteredCommands.length) {
      const cmd = filteredCommands[index];
      close();
      cmd.run();
    } else {
      const result = results[index - filteredCommands.length];
      if (!result) return;
      close();
      router.push(entityHref(result.type, result.slug));
    }
  };

  const handleListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (totalItems === 0 ? 0 : (i + 1) % totalItems));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (totalItems === 0 ? 0 : (i - 1 + totalItems) % totalItems));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      runItem(activeIndex);
    }
  };

  if (!open) return null;

  let flatIndex = -1;

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-start justify-center pt-[12vh] px-4" onMouseDown={close}>
      <div
        className="w-full max-w-xl card shadow-xl overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-200 dark:border-gray-700 p-3">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleListKeyDown}
            placeholder="搜索实体、跳转页面、新建、切换主题..."
            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div ref={listRef} className="max-h-[50vh] overflow-auto">
          {filteredCommands.length > 0 && (
            <>
              <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-gray-400 uppercase">命令</p>
              {filteredCommands.map((cmd) => {
                flatIndex++;
                const idx = flatIndex;
                return (
                  <button
                    key={cmd.id}
                    data-active={idx === activeIndex}
                    onClick={() => runItem(idx)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`w-full flex items-center justify-between px-4 py-2 text-left text-sm ${
                      idx === activeIndex
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span>{cmd.label}</span>
                    <span className="text-xs text-gray-400">{cmd.hint}</span>
                  </button>
                );
              })}
            </>
          )}

          {results.length > 0 && (
            <>
              <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-gray-400 uppercase">
                实体 {loading ? '· 搜索中...' : ''}
              </p>
              {results.map((result) => {
                flatIndex++;
                const idx = flatIndex;
                return (
                  <button
                    key={`${result.type}-${result.slug}`}
                    data-active={idx === activeIndex}
                    onClick={() => runItem(idx)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`w-full text-left px-4 py-2 ${
                      idx === activeIndex ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded uppercase">
                        {ENTITY_LABELS[result.type] || result.type}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{result.title}</span>
                    </div>
                    {result.snippet && (
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{result.snippet}</p>
                    )}
                  </button>
                );
              })}
            </>
          )}

          {totalItems === 0 && !loading && (
            <p className="px-4 py-8 text-center text-sm text-gray-400">没有匹配的命令或实体。</p>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center gap-3 text-[11px] text-gray-400">
          <span>↑↓ 选择</span>
          <span>Enter 打开</span>
          <span>Esc 关闭</span>
        </div>
      </div>
    </div>
  );
}
