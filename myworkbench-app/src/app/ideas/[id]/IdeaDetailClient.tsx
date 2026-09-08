'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DetailShell } from '@/components/DetailShell';

interface Idea {
  id: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
  created_at: string;
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
        <Link href="/ideas" className="mt-4 inline-block text-accent-600 dark:text-accent-400 hover:underline">← 返回想法看板</Link>
      </div>
    );
  }

  return (
    <DetailShell entityType="idea" id={id} title={idea.title} status={idea.status}
      tags={idea.tags || []} created_at={idea.created_at || ''} updated_at={idea.updated_at}
      listPath="/ideas" editHref={`/entities/idea/${id}/edit`} onDelete={handleDelete} deleting={deleting}
      frontmatter={idea as unknown as Record<string, unknown>}>
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
    </DetailShell>
  );
}
