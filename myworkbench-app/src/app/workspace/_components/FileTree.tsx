'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

/**
 * 工作区文件浏览器：文件页签（目录折叠 + 名称过滤 + 置顶 + 回收站）
 * 与搜索页签（跨文件全文搜索，关键词高亮，点击直达编辑页）。
 * 置顶存 localStorage（mwbench_ws_pinned）；回收站走 /api/workspace/trash。
 */

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: TreeNode[];
  updated_at?: string;
}

interface SearchMatch {
  line: number;
  snippet: string;
}

interface SearchResult {
  path: string;
  name: string;
  count: number;
  matches: SearchMatch[];
}

interface TrashItem {
  name: string;
  origin: string;
  trashedAt: string;
  size: number;
}

const PINNED_KEY = 'mwbench_ws_pinned';

function loadPinned(): string[] {
  try {
    const raw = localStorage.getItem(PINNED_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((p) => typeof p === 'string') : [];
  } catch {
    return [];
  }
}

function savePinned(paths: string[]): void {
  try {
    localStorage.setItem(PINNED_KEY, JSON.stringify(paths));
  } catch {
    /* 存储不可用时忽略 */
  }
}

/** 过滤：保留名称/路径命中的节点，目录在有命中后代时保留；过滤模式下全部展开 */
function filterTree(nodes: TreeNode[], q: string): TreeNode[] {
  const lower = q.toLowerCase();
  const walk = (list: TreeNode[]): TreeNode[] => {
    const result: TreeNode[] = [];
    for (const node of list) {
      if (node.type === 'file') {
        if (node.path.toLowerCase().includes(lower) || node.name.toLowerCase().includes(lower)) {
          result.push(node);
        }
      } else {
        const children = node.children ? walk(node.children) : [];
        if (children.length > 0 || node.name.toLowerCase().includes(lower)) {
          result.push({ ...node, children });
        }
      }
    }
    return result;
  };
  return walk(nodes);
}

/** 片段里高亮关键词（大小写不敏感） */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-700/60 rounded-sm px-0.5 text-inherit">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function TreeItem({
  node,
  level,
  expandedSet,
  toggleDir,
  pinned,
  onTogglePin,
  forceExpand = false,
}: {
  node: TreeNode;
  level: number;
  expandedSet: Set<string>;
  toggleDir: (path: string) => void;
  pinned: Set<string>;
  onTogglePin: (path: string) => void;
  forceExpand?: boolean;
}) {
  if (node.type === 'directory') {
    const expanded = expandedSet.has(node.path) || forceExpand;
    return (
      <div>
        <button
          onClick={() => toggleDir(node.path)}
          className="flex items-center gap-1 w-full text-left px-2 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          style={{ paddingLeft: `${level * 14 + 8}px` }}
        >
          <span className={`text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}>▶</span>
          <span className="truncate">{node.name}</span>
        </button>
        {expanded && node.children && (
          <div>
            {node.children.map((child) => (
              <TreeItem
                key={child.path}
                node={child}
                level={level + 1}
                expandedSet={expandedSet}
                toggleDir={toggleDir}
                pinned={pinned}
                onTogglePin={onTogglePin}
                forceExpand={forceExpand}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isPinned = pinned.has(node.path);
  return (
    <div className="group relative">
      <Link
        href={`/workspace/${node.path}`}
        className="flex items-center gap-1.5 px-2 py-1 pr-12 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
        style={{ paddingLeft: `${level * 14 + 24}px` }}
      >
        <span className="truncate">{node.name}</span>
      </Link>
      <button
        onClick={() => onTogglePin(node.path)}
        title={isPinned ? '取消置顶' : '置顶'}
        aria-label={`${isPinned ? '取消置顶' : '置顶'} ${node.name}`}
        className={`absolute right-1 top-1 px-1 text-xs rounded transition-opacity ${
          isPinned
            ? 'text-amber-500 opacity-100'
            : 'text-gray-400 opacity-0 group-hover:opacity-100 hover:text-amber-500'
        }`}
      >
        ★
      </button>
    </div>
  );
}

export function FileTree({ refreshKey = 0 }: { refreshKey?: number }) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [pinned, setPinned] = useState<Set<string>>(new Set());
  const [expandedSet, setExpandedSet] = useState<Set<string>>(new Set());

  // 页签与全文搜索
  const [tab, setTab] = useState<'files' | 'search'>('files');
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);

  // 回收站
  const [trashOpen, setTrashOpen] = useState(false);
  const [trashItems, setTrashItems] = useState<TrashItem[] | null>(null);
  const [trashBusy, setTrashBusy] = useState(false);

  const loadTree = useCallback(async () => {
    try {
      const res = await fetch('/api/workspace/tree');
      if (!res.ok) throw new Error('Failed to load tree');
      const data = await res.json();
      const nextTree: TreeNode[] = data.tree || [];
      setTree(nextTree);
      // 顶级目录默认展开（折叠状态持久语义仍归用户点击控制；恢复/刷新后保持已展开的）
      setExpandedSet((prev) => {
        const next = new Set(prev);
        for (const node of nextTree) {
          if (node.type === 'directory') next.add(node.path);
        }
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTree();
  }, [loadTree, refreshKey]);

  useEffect(() => {
    setPinned(new Set(loadPinned()));
  }, []);

  // 全文搜索（300ms 防抖；空词清空结果）
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (tab !== 'search') return;
    const q = searchQ.trim();
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!q) {
      setSearchResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/workspace/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchQ, tab]);

  const loadTrash = useCallback(async () => {
    try {
      const res = await fetch('/api/workspace/trash');
      if (res.ok) {
        const data = await res.json();
        setTrashItems(data.items || []);
      }
    } catch {
      /* 忽略 */
    }
  }, []);

  const toggleTrash = () => {
    const next = !trashOpen;
    setTrashOpen(next);
    if (next && trashItems === null) loadTrash();
  };

  const restoreTrash = async (item: TrashItem) => {
    setTrashBusy(true);
    try {
      const res = await fetch('/api/workspace/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: item.name }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || '恢复失败');
      }
      await loadTrash();
      await loadTree();
    } catch (err) {
      alert(err instanceof Error ? err.message : '恢复失败');
    } finally {
      setTrashBusy(false);
    }
  };

  const purgeTrash = async (name: string) => {
    if (name === 'all' && !window.confirm('彻底删除回收站里的全部文件？不可恢复。')) return;
    setTrashBusy(true);
    try {
      const res = await fetch(`/api/workspace/trash?name=${encodeURIComponent(name)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      await loadTrash();
    } catch {
      alert('删除失败');
    } finally {
      setTrashBusy(false);
    }
  };

  const toggleDir = (dirPath: string) => {
    setExpandedSet((prev) => {
      const next = new Set(prev);
      if (next.has(dirPath)) next.delete(dirPath);
      else next.add(dirPath);
      return next;
    });
  };

  const onTogglePin = (filePath: string) => {
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(filePath)) next.delete(filePath);
      else next.add(filePath);
      savePinned([...next]);
      return next;
    });
  };

  const filtering = filter.trim().length > 0;
  const displayTree = filtering ? filterTree(tree, filter.trim()) : tree;

  // 置顶文件（从完整树中找，不经过滤）
  const pinnedNodes: TreeNode[] = [];
  const collect = (list: TreeNode[]) => {
    for (const node of list) {
      if (node.type === 'file' && pinned.has(node.path)) pinnedNodes.push(node);
      if (node.children) collect(node.children);
    }
  };
  collect(tree);

  const renderRow = (node: TreeNode) => (
    <TreeItem
      key={node.path}
      node={node}
      level={0}
      expandedSet={expandedSet}
      toggleDir={toggleDir}
      pinned={pinned}
      onTogglePin={onTogglePin}
      forceExpand={filtering}
    />
  );

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          {[
            { key: 'files' as const, label: '文件' },
            { key: 'search' as const, label: '搜索全文' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                tab === t.key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab === 'files' && loading && <span className="text-xs text-gray-400">加载中...</span>}
      </div>

      {tab === 'files' ? (
        <>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="过滤文件名 / 路径..."
            className="input text-sm mb-2"
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {!error && pinnedNodes.length > 0 && (
            <div className="mb-2">
              <p className="px-2 mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">置顶</p>
              <div className="space-y-0.5">{pinnedNodes.map(renderRow)}</div>
            </div>
          )}
          {!error && tree.length === 0 ? (
            <p className="text-gray-500 text-sm">工作区为空</p>
          ) : (
            <div className="space-y-0.5 max-h-[360px] overflow-y-auto scroll-thin">
              {displayTree.map(renderRow)}
              {displayTree.length === 0 && filtering && <p className="text-gray-400 text-sm px-2 py-1">没有匹配的文件。</p>}
            </div>
          )}

          {/* 回收站 */}
          <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-2">
            <button
              onClick={toggleTrash}
              className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <span>{trashOpen ? '▼' : '▶'}</span>
              🗑 回收站{trashItems && trashItems.length > 0 ? `（${trashItems.length}）` : ''}
            </button>
            {trashOpen && (
              <div className="mt-1.5">
                {trashItems === null ? (
                  <p className="text-xs text-gray-400 px-2">加载中...</p>
                ) : trashItems.length === 0 ? (
                  <p className="text-xs text-gray-400 px-2">回收站是空的。删除的文件会移到这里，可恢复。</p>
                ) : (
                  <>
                    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                      {trashItems.map((item) => (
                        <li key={item.name} className="flex items-center gap-1.5 py-1.5">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-700 dark:text-gray-300 truncate" title={item.origin}>
                              {item.origin}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {new Date(item.trashedAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <button
                            onClick={() => restoreTrash(item)}
                            disabled={trashBusy}
                            className="shrink-0 px-1.5 py-0.5 rounded text-[10px] btn-ghost disabled:opacity-50"
                          >
                            恢复
                          </button>
                          <button
                            onClick={() => purgeTrash(item.name)}
                            disabled={trashBusy}
                            title="彻底删除"
                            className="shrink-0 w-5 h-5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 text-xs leading-none disabled:opacity-50"
                          >
                            ✕
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => purgeTrash('all')}
                      disabled={trashBusy}
                      className="mt-1 px-2 py-1 rounded text-[10px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50"
                    >
                      清空回收站
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <input
            type="text"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="搜索全部笔记内容..."
            className="input text-sm mb-2"
            autoFocus
          />
          <div className="max-h-[460px] overflow-y-auto scroll-thin">
            {!searchQ.trim() ? (
              <p className="text-xs text-gray-400 px-1 py-2">输入关键词，搜索所有 Markdown 的内容（含标题与标签）。</p>
            ) : searching ? (
              <p className="text-xs text-gray-400 px-1 py-2">搜索中...</p>
            ) : !searchResults || searchResults.length === 0 ? (
              <p className="text-xs text-gray-400 px-1 py-2">没有匹配的内容。</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {searchResults.map((r) => (
                  <li key={r.path}>
                    <Link
                      href={`/workspace/${r.path}`}
                      className="block px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <p className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                        <span className="truncate">{r.name}</span>
                        <span className="shrink-0 text-[10px] font-normal text-gray-400">{r.count} 处</span>
                      </p>
                      {r.matches.map((m, i) => (
                        <p key={i} className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">
                          <span className="text-gray-400 mr-1">L{m.line}</span>
                          <Highlight text={m.snippet} query={searchQ.trim()} />
                        </p>
                      ))}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
