'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { buildPaperNote } from '@/lib/paper-note';

/**
 * 新建文献笔记入口（RSS 之外的通道）：填标题+原文链接 → 生成六段模板的 draft 文献，
 * 直接进入编辑页填写。与 RSS「文献」按钮共用 buildPaperNote。
 */
export function NewPaperButton() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const slug = `evidence-${Date.now().toString(36)}`;
      const note = buildPaperNote({ title: title.trim(), url: url.trim() || undefined });
      const res = await fetch('/api/entities/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          data: { id: slug, type: 'evidence', title: title.trim(), ...note.data },
          content: note.content,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || '创建失败');
      }
      router.push(`/entities/evidence/${slug}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
      setCreating(false);
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary">
        新建文献笔记
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[14vh] px-4" onMouseDown={() => setOpen(false)}>
          <div className="w-full max-w-md card shadow-xl p-6 space-y-4" onMouseDown={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">新建文献笔记</h2>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">论文标题 *</span>
              <input
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !creating && title.trim() && handleCreate()}
                placeholder="例如：Attention Is All You Need"
                autoFocus
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">原文链接（可选，arXiv / 主页）</span>
              <input
                className="input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://arxiv.org/abs/..."
              />
            </label>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              创建为待读（status=draft），出现在首页「待读文献」队列；编辑页已备好六段模板。
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="btn-ghost">
                取消
              </button>
              <button onClick={handleCreate} disabled={creating || !title.trim()} className="btn-primary">
                {creating ? '创建中...' : '创建并编辑'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
