'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * 工作区文件树：目录折叠 + 名称过滤搜索 + 文件置顶（localStorage mwbench_ws_pinned）。
 * 过滤时自动展开命中的子树；置顶文件始终显示在顶部「置顶」区。
 */

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: TreeNode[];
  updated_at?: string;
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

  useEffect(() => {
    setPinned(new Set(loadPinned()));
  }, []);

  useEffect(() => {
    async function fetchTree() {
      try {
        const res = await fetch('/api/workspace/tree');
        if (!res.ok) throw new Error('Failed to load tree');
        const data = await res.json();
        setTree(data.tree || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    }
    fetchTree();
  }, [refreshKey]);

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
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">文件浏览器</h3>
        {loading && <span className="text-xs text-gray-400">加载中...</span>}
      </div>
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
        <div className="space-y-0.5 max-h-[420px] overflow-y-auto scroll-thin">
          {displayTree.map(renderRow)}
          {displayTree.length === 0 && filtering && (
            <p className="text-gray-400 text-sm px-2 py-1">没有匹配的文件。</p>
          )}
        </div>
      )}
    </div>
  );
}
