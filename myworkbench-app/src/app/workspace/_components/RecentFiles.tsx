'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface FileRecord {
  path: string;
  name: string;
  updated_at?: string;
}

export function RecentFiles() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFiles() {
      try {
        const res = await fetch('/api/workspace/tree');
        if (!res.ok) throw new Error('Failed to load files');
        const data = await res.json();

        const flatten = (nodes: any[]): FileRecord[] => {
          const result: FileRecord[] = [];
          for (const node of nodes) {
            if (node.type === 'file') {
              result.push({
                path: node.path,
                name: node.name,
                updated_at: node.updated_at,
              });
            }
            if (node.children) {
              result.push(...flatten(node.children));
            }
          }
          return result;
        };

        const fileList = flatten(data.tree || []);
        fileList.sort((a, b) => {
          const timeA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          const timeB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return timeB - timeA;
        });
        setFiles(fileList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchFiles();
  }, []);

  if (loading) return <div className="text-gray-500 text-sm">加载最近文件...</div>;

  if (files.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">最近文件</h3>
        <p className="text-gray-500 text-sm">工作区为空，点击「新建文件」开始</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">最近文件</h3>
      <div className="space-y-2">
        {files.map((file) => (
          <Link
            key={file.path}
            href={`/workspace/${file.path}`}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <span>📄</span>
            <span className="flex-1">{file.name}</span>
            <span className="text-xs text-gray-400">
              {file.updated_at ? new Date(file.updated_at).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
