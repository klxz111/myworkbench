'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DetailShell } from '@/components/DetailShell';
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
        <Link href="/radar" className="mt-4 inline-block text-accent-600 dark:text-accent-400 hover:underline">
          ← 返回雷达列表
        </Link>
      </div>
    );
  }

  return (
    <DetailShell
      entityType="radar"
      id={id}
      title={radar.title}
      status={radar.status}
      tags={radar.tags || []}
      created_at={radar.created_at}
      updated_at={radar.updated_at}
      listPath="/radar"
      editHref={`/entities/radar/${id}/edit`}
      onDelete={handleDelete}
      deleting={deleting}
      frontmatter={radar as unknown as Record<string, unknown>}
    >
      {radar.impact && (
        <section className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            影响
          </h3>
          <p className="text-gray-700 dark:text-gray-300">{radar.impact}</p>
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
    </DetailShell>
  );
}
