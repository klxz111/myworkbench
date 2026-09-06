'use client';

import { useCallback, useEffect, useState } from 'react';
import { ENTITY_LABELS } from '@/lib/entity-paths';

interface TrashItem {
  file: string;
  type: string;
  slug: string;
  title: string;
  deleted_at: string;
}

function formatDeletedAt(raw: string): string {
  const m = raw.match(/^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})$/);
  if (!m) return raw;
  return `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6]}`;
}

export function TrashClient() {
  const [items, setItems] = useState<TrashItem[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/trash');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const restore = async (item: TrashItem) => {
    setBusy(item.file);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: item.file }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '恢复失败');
      setMessage(`已恢复 ${ENTITY_LABELS[item.type] || item.type}：${item.title}`);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : '恢复失败');
    } finally {
      setBusy(null);
    }
  };

  const purge = async (item: TrashItem) => {
    if (!confirm(`彻底删除「${item.title}」？此操作不可撤销。`)) return;
    setBusy(item.file);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/trash', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: item.file }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '删除失败');
      }
      setMessage(`已彻底删除：${item.title}`);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      {message && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-green-800 dark:text-green-200">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {items === null ? (
          <div className="p-6 text-center text-gray-500">加载回收站中...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            回收站为空。删除的实体会先移入回收站，可随时恢复。
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {items.map((item) => (
              <li key={item.file} className="flex items-center justify-between p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.title}</p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {ENTITY_LABELS[item.type] || item.type} · {item.slug} · 删除于 {formatDeletedAt(item.deleted_at)}
                  </p>
                </div>
                <div className="flex gap-2 ml-4 shrink-0">
                  <button
                    onClick={() => restore(item)}
                    disabled={busy === item.file}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    {busy === item.file ? '...' : '恢复'}
                  </button>
                  <button
                    onClick={() => purge(item)}
                    disabled={busy === item.file}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
                  >
                    彻底删除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
