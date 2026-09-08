'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DetailShell } from '@/components/DetailShell';

interface Research {
  id: string;
  title: string;
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  content: string;
  summary?: string;
  methodology?: string;
  findings?: string;
  confidence?: string;
  related_papers?: string[];
  knowledge_tree?: string[];
}

interface ResearchDetailProps {
  id: string;
}

export function ResearchDetailClient({ id }: ResearchDetailProps) {
  const [research, setResearch] = useState<Research | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchResearch() {
      try {
        const res = await fetch(`/api/entities/research/${id}`);
        if (!res.ok) throw new Error('Research not found');
        const data = await res.json();
        setResearch(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载研究失败');
      } finally {
        setLoading(false);
      }
    }
    fetchResearch();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('确定要删除此研究吗？')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/entities/research/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      window.location.href = '/research';
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除研究失败');
      setDeleting(false);
    }
  };

  if (loading) return <div className="text-gray-500">加载研究中...</div>;
  if (error || !research) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-200">{error || '未找到研究'}</p>
        <Link href="/research" className="mt-4 inline-block text-accent-600 dark:text-accent-400 hover:underline">← 返回研究列表</Link>
      </div>
    );
  }

  return (
    <DetailShell
      entityType="research"
      id={id}
      title={research.title}
      status={research.status}
      tags={research.tags || []}
      created_at={research.created_at}
      updated_at={research.updated_at}
      listPath="/research"
      editHref={`/entities/research/${id}/edit`}
      onDelete={handleDelete}
      deleting={deleting}
      frontmatter={research as unknown as Record<string, unknown>}
    >
      {research.knowledge_tree && research.knowledge_tree.length > 0 && (
        <section className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">知识树定位</h3>
          <div className="flex flex-wrap gap-2">
            {research.knowledge_tree.map((name) => (
              <Link
                key={name}
                href="/graph?view=knowledge"
                className="px-2.5 py-1 rounded-full text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60"
              >
                {name}
              </Link>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-400">
            在「<Link href="/graph?view=knowledge" className="text-accent-600 dark:text-accent-400 hover:underline">知识树</Link>」页可查看这些方向在智源热度版图中的位置
          </p>
        </section>
      )}

      {research.summary && (
        <section className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">摘要</h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{research.summary}</p>
        </section>
      )}

      {research.methodology && (
        <section className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">方法</h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{research.methodology}</p>
        </section>
      )}

      {research.findings && (
        <section className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">发现</h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{research.findings}</p>
        </section>
      )}

      {research.related_papers && research.related_papers.length > 0 && (
        <section className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">相关论文</h3>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
            {research.related_papers.map((paper, i) => <li key={i}>{paper}</li>)}
          </ul>
        </section>
      )}
    </DetailShell>
  );
}
