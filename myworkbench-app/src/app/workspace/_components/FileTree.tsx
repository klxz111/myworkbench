'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: TreeNode[];
}

interface FileTreeProps {
  level?: number;
}

function TreeItem({ node, level }: { node: TreeNode; level: number }) {
  const [expanded, setExpanded] = useState(level < 1);

  if (node.type === 'directory') {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 w-full text-left px-2 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          <span className="text-gray-400">{expanded ? '▼' : '▶'}</span>
          <span>📁</span>
          <span>{node.name}</span>
        </button>
        {expanded && node.children && (
          <div>
            {node.children.map((child) => (
              <TreeItem key={child.path} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={`/workspace/${node.path}`}
      className="flex items-center gap-1 px-2 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
      style={{ paddingLeft: `${level * 16 + 24}px` }}
    >
      <span>📄</span>
      <span>{node.name}</span>
    </Link>
  );
}

export function FileTree() {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }, []);

  if (loading) return <div className="text-gray-500 text-sm">加载文件树...</div>;
  if (error) return <div className="text-red-600 text-sm">{error}</div>;
  if (tree.length === 0) return <div className="text-gray-500 text-sm">工作区为空</div>;

  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">文件浏览器</h3>
      <div className="space-y-1">
        {tree.map((node) => (
          <TreeItem key={node.path} node={node} level={0} />
        ))}
      </div>
    </div>
  );
}
