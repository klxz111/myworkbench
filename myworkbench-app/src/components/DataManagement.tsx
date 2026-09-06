'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ImportResult {
  mode: string;
  total: number;
  created: number;
  overwritten: number;
  skipped: number;
  errors?: string[];
}

export function DataManagement() {
  const [importing, setImporting] = useState(false);
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleImport = async (file: File) => {
    setImporting(true);
    setError(null);
    setResult(null);
    try {
      const text = await file.text();
      let snapshot: unknown;
      try {
        snapshot = JSON.parse(text);
      } catch {
        throw new Error('文件不是有效的 JSON');
      }
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshot, mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '导入失败');
      setResult(data as ImportResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-4">
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">导出备份</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="/api/export?format=zip"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-800 text-white rounded-lg font-medium text-sm transition-colors shadow-sm hover:shadow-md"
          >
            <span aria-hidden="true">⬇</span>
            <span>完整备份（ZIP）</span>
          </a>
          <a
            href="/api/export?format=json"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-lg font-medium text-sm transition-colors border border-gray-300 dark:border-gray-600"
          >
            <span aria-hidden="true">⬇</span>
            <span>JSON 快照（含关系）</span>
          </a>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">从 JSON 快照恢复</p>
        <div className="flex flex-wrap gap-2">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as 'merge' | 'replace')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            aria-label="导入模式"
          >
            <option value="merge">合并（跳过已存在）</option>
            <option value="replace">覆盖（替换已存在）</option>
          </select>
          <label
            className={`flex-1 min-w-[160px] flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
              importing
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {importing ? '导入中...' : fileName ? `重新选择文件` : '选择快照文件并导入'}
            <input
              type="file"
              accept=".json,application/json"
              className="hidden"
              disabled={importing}
              onChange={(e) => {
                const file = e.target.files?.[0];
                setFileName(file?.name || null);
                if (file) handleImport(file);
                e.target.value = '';
              }}
            />
          </label>
        </div>
        {fileName && <p className="mt-1.5 text-xs text-gray-400">已选择：{fileName}</p>}
        {result && (
          <p className="mt-1.5 text-xs text-green-700 dark:text-green-400">
            导入完成：新建 {result.created} · 覆盖 {result.overwritten} · 跳过 {result.skipped}（共 {result.total}）
            {result.errors && result.errors.length > 0 && ` · ${result.errors.length} 个错误`}
          </p>
        )}
        {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}
        <p className="mt-1.5 text-xs text-gray-400">
          快照来自「JSON 快照」导出；合并模式不会改动已有实体。
        </p>
      </div>

      <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
        <Link
          href="/trash"
          className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ♻ 回收站 — 恢复误删的实体
        </Link>
      </div>
    </div>
  );
}
