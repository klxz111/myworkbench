'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { BacklinksSection } from '@/components/BacklinksSection';

interface Experiment {
  id: string;
  title: string;
  status: string;
  tags: string[];
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
        <Link href="/experiment" className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline">← 返回实验列表</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{experiment.title}</h2>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${experiment.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>{experiment.status}</span>
              {experiment.linked_project && <span>关联项目：{experiment.linked_project}</span>}
              <span>更新：{new Date(experiment.updated_at).toLocaleDateString()}</span>
            </div>
            {experiment.tags && experiment.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {experiment.tags.map((tag) => <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">{tag}</span>)}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Link href={`/experiment/${id}/edit`} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">编辑</Link>
            <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50">{deleting ? '删除中...' : '删除'}</button>
          </div>
        </div>
      </div>

      {experiment.hypothesis && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">假设</h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{experiment.hypothesis}</p>
        </section>
      )}

      {experiment.setup && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">设置</h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{experiment.setup}</p>
        </section>
      )}

      {experiment.result && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">结果</h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{experiment.result}</p>
        </section>
      )}

      {experiment.conclusion && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">结论</h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{experiment.conclusion}</p>
        </section>
      )}

      <MarkdownViewer entityType="experiment" id={id} />
      <BacklinksSection entityType="experiment" entityId={id} />

      <div className="flex gap-4">
        <Link href="/experiment" className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">← 返回实验列表</Link>
      </div>
    </div>
  );
}
