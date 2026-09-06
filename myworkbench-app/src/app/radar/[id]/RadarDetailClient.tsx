'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RelationsSection } from '@/components/RelationsSection';
import { BacklinksSection } from '@/components/BacklinksSection';
import { StatusTimeline } from '@/components/StatusTimeline';

interface RadarDetail {
  id: string;
  title: string;
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  content: string;
  category?:
    | 'ai_research'
    | 'frontier_lab'
    | 'company'
    | 'university'
    | 'hardware'
    | 'ml_systems'
    | 'robotics'
    | 'funding'
    | 'policy'
    | 'immigration'
    | 'ecosystem';
  signal_strength?: 'high' | 'medium' | 'low';
  impact?: string;
  linked_events?: string[];
  linked_decisions?: string[];
}

export function RadarDetailClient({ id }: { id: string }) {
  const [radar, setRadar] = useState<RadarDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchRadar() {
      try {
        const res = await fetch(`/api/entities/radar/${id}`);
        if (!res.ok) {
          throw new Error('Radar entry not found');
        }
        const data = await res.json();
        setRadar(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载雷达失败');
      } finally {
        setLoading(false);
      }
    }
    fetchRadar();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('确定要删除此雷达条目吗？')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/entities/radar/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      window.location.href = '/radar';
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除雷达失败');
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">加载雷达中...</div>;
  }

  if (error || !radar) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-200">{error || '未找到雷达条目'}</p>
        <Link href="/radar" className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline">
          ← 返回雷达列表
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {radar.title}
            </h2>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              {radar.category && (
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs capitalize">
                  {radar.category.replace(/_/g, ' ')}
                </span>
              )}
              {radar.signal_strength && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  radar.signal_strength === 'high'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : radar.signal_strength === 'medium'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {radar.signal_strength} signal
                </span>
              )}
              <span>创建：{new Date(radar.created_at).toLocaleDateString()}</span>
              <span>更新：{new Date(radar.updated_at).toLocaleDateString()}</span>
            </div>
            {radar.tags && radar.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {radar.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Link
              href={`/entities/radar/${id}/edit`}
              className="btn-primary"
            >
              编辑
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            >
              {deleting ? '删除中...' : '删除'}
            </button>
            <Link
              href="/radar"
              className="btn-secondary"
            >
              ← 返回
            </Link>
          </div>
        </div>
      </div>

      {radar.impact && (
        <section className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            影响
          </h3>
          <p className="text-gray-700 dark:text-gray-300">{radar.impact}</p>
        </section>
      )}

      {radar.content && (
        <section className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            详情
          </h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{radar.content}</p>
        </section>
      )}

      {(radar.linked_events && radar.linked_events.length > 0) && (
        <section className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            关联事件
          </h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
            {radar.linked_events.map((event) => (
              <li key={event}>{event}</li>
            ))}
          </ul>
        </section>
      )}

      {(radar.linked_decisions && radar.linked_decisions.length > 0) && (
        <section className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            关联决策
          </h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
            {radar.linked_decisions.map((decision) => (
              <li key={decision}>{decision}</li>
            ))}
          </ul>
        </section>
      )}

      <StatusTimeline createdAt={radar.created_at} updatedAt={radar.updated_at} status={radar.status} />

      <RelationsSection entityId={id} entityType="radar" />
      <BacklinksSection entityType="radar" entityId={id} />
    </div>
  );
}
