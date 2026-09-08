'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DetailShell } from '@/components/DetailShell';

interface Experiment {
  id: string;
  title: string;
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  content: string;
  hypothesis?: string;
  setup?: string;
  result?: string;
  conclusion?: string;
  linked_project?: string;
  linked_evidence?: string[];
}

interface ExperimentDetailProps {
  id: string;
}

export function ExperimentDetailClient({ id }: ExperimentDetailProps) {
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchExperiment() {
      try {
        const res = await fetch(`/api/entities/experiment/${id}`);
        if (!res.ok) throw new Error('Experiment not found');
        const data = await res.json();
        setExperiment(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载实验失败');
      } finally {
        setLoading(false);
      }
    }
    fetchExperiment();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('确定要删除此实验吗？')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/entities/experiment/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      window.location.href = '/experiment';
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除实验失败');
      setDeleting(false);
    }
  };

  if (loading) return <div className="text-gray-500">加载实验中...</div>;
  if (error || !experiment) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-200">{error || '未找到实验'}</p>
        <Link href="/experiment" className="mt-4 inline-block text-accent-600 dark:text-accent-400 hover-underline">← 返回实验列表</Link>
      </div>
    );
  }

  return (
    <DetailShell
      entityType="experiment"
      id={id}
      title={experiment.title}
      status={experiment.status}
      tags={experiment.tags || []}
      created_at={experiment.created_at}
      updated_at={experiment.updated_at}
      listPath="/experiment"
      editHref={`/entities/experiment/${id}/edit`}
      onDelete={handleDelete}
      deleting={deleting}
      frontmatter={experiment as unknown as Record<string, unknown>}
    >
      {experiment.hypothesis && (
        <section className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">假设</h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{experiment.hypothesis}</p>
        </section>
      )}

      {experiment.setup && (
        <section className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">设置</h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{experiment.setup}</p>
        </section>
      )}

      {experiment.result && (
        <section className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">结果</h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{experiment.result}</p>
        </section>
      )}

      {experiment.conclusion && (
        <section className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">结论</h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{experiment.conclusion}</p>
        </section>
      )}
    </DetailShell>
  );
}
