'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface NewFileDialogProps {
  trigger?: React.ReactNode;
}

export function NewFileDialog({ trigger }: NewFileDialogProps) {
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCreate = async () => {
    if (!path.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/workspace/tree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: path.trim(), content: '# ' + path.trim() }),
      });
      if (!res.ok) throw new Error('创建失败');
      router.push(`/workspace/${path.trim()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        + 新建文件
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">新建 Markdown 文件</h2>
            {error && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  文件路径（相对于 workspace/）
                </label>
                <input
                  type="text"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="例如：notebook/idea-2026-001.md"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300"
                >
                  取消
                </button>
                <button
                  onClick={handleCreate}
                  disabled={loading || !path.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? '创建中...' : '创建'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
