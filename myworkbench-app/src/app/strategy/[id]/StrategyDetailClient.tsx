'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { BacklinksSection } from '@/components/BacklinksSection';

interface Strategy {
  id: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
  content: string;
  vision?: string;
  mission?: string;
  objectives?: string[];
  constraints?: string[];
  key_results?: Array<{ result: string; metric?: string; target?: string }>;
}

interface StrategyDetailProps {
  id: string;
}

export function StrategyDetailClient({ id }: StrategyDetailProps) {
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchStrategy() {
      try {
        const res = await fetch(`/api/entities/strategy/${id}`);
        if (!res.ok) throw new Error('Strategy not found');
        const data = await res.json();
        setStrategy(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载策略失败');
      } finally {
        setLoading(false);
      }
    }
    fetchStrategy();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('确定要删除此策略吗？')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/entities/strategy/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      window.location.href = '/strategy';
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除策略失败');
      setDeleting(false);
    }
  };

  if (loading) return <div className="text-gray-500">加载策略中...</div>;
  if (error || !strategy) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-200">{error || '未找到策略'}</p>
        <Link href="/strategy" className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline">← 返回策略列表</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{strategy.title}</h2>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${strategy.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>{strategy.status}</span>
              <span>更新：{new Date(strategy.updated_at).toLocaleDateString()}</span>
            </div>
            {strategy.tags && strategy.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {strategy.tags.map((tag) => <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">{tag}</span>)}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Link href={`/entities/strategy/${id}/edit`} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">编辑</Link>
            <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50">{deleting ? '删除中...' : '删除'}</button>
          </div>
        </div>
      </div>

      {strategy.vision && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">愿景</h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{strategy.vision}</p>
        </section>
      )}

      {strategy.mission && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">使命</h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{strategy.mission}</p>
        </section>
      )}

      {strategy.objectives && strategy.objectives.length > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">目标</h3>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
            {strategy.objectives.map((o, i) => <li key={i}>{o}</li>)}
          </ul>
        </section>
      )}

      {strategy.constraints && strategy.constraints.length > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">约束</h3>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
            {strategy.constraints.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </section>
      )}

      {strategy.key_results && strategy.key_results.length > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">关键结果</h3>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {strategy.key_results.map((kr, i) => (
              <li key={i} className="py-2">
                <div className="font-medium text-gray-900 dark:text-white">{kr.result}</div>
                {(kr.metric || kr.target) && <div className="text-sm text-gray-500 dark:text-gray-400">{kr.metric}{kr.target ? `：${kr.target}` : ''}</div>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <MarkdownViewer entityType="strategy" id={id} />
      <BacklinksSection entityType="strategy" entityId={id} />

      <div className="flex gap-4">
        <Link href="/strategy" className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">← 返回策略列表</Link>
      </div>
    </div>
  );
}
