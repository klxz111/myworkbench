'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { BacklinksSection } from '@/components/BacklinksSection';
import { StatusBadge } from '@/components/ui';

/**
 * 想法详情：一句话假设 / 新颖性 / 可行性 / 相关工作 / 下一步 + 正文与反链。
 */

interface Idea {
  id: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
  content: string;
  hypothesis?: string;
  novelty?: string;
  feasibility?: string;
  related?: string;
  next_step?: string;
}

const LEVEL_LABEL: Record<string, string> = { high: '高', medium: '中', low: '低' };

export function IdeaDetailClient({ id }: { id: string }) {
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchIdea() {
      try {
        const res = await fetch(`/api/entities/idea/${id}`);
        if (!res.ok) throw new Error('Idea not found');
        setIdea(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载想法失败');
      } finally {
        setLoading(false);
      }
    }
    fetchIdea();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('确定要删除此想法吗？')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/entities/idea/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      window.location.href = '/ideas';
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除想法失败');
      setDeleting(false);
    }
  };

  if (loading) return <div className="text-gray-500">加载想法中...</div>;
  if (error || !idea) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-200">{error || '未找到想法'}</p>
        <Link href="/ideas" className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline">← 返回想法看板</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{idea.title}</h2>
            <div className="mt-2 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <StatusBadge status={idea.status || 'idea'} />
              {idea.novelty && <span>新颖性：{LEVEL_LABEL[idea.novelty] || idea.novelty}</span>}
              {idea.feasibility && <span>可行性：{LEVEL_LABEL[idea.feasibility] || idea.feasibility}</span>}
              <span>更新：{new Date(idea.updated_at).toLocaleDateString()}</span>
            </div>
            {idea.tags && idea.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {idea.tags.map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-3 shrink-0">
            <Link href={`/entities/idea/${id}/edit`} className="btn-primary">编辑</Link>
            <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50">
              {deleting ? '删除中...' : '删除'}
            </button>
          </div>
        </div>
      </div>

      {idea.hypothesis && (
        <section className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">一句话假设</h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{idea.hypothesis}</p>
        </section>
      )}

      {idea.next_step && (
        <section className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">下一步动作</h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{idea.next_step}</p>
        </section>
      )}

      {idea.related && (
        <section className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">相关工作 / 验证实验</h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{idea.related}</p>
        </section>
      )}

      <MarkdownViewer entityType="idea" id={id} />
      <BacklinksSection entityType="idea" entityId={id} />

      <div className="flex gap-4">
        <Link href="/ideas" className="btn-secondary">← 返回想法看板</Link>
      </div>
    </div>
  );
}
