'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DetailShell } from '@/components/DetailShell';

interface Belief {
  id: string;
  title: string;
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  content: string;
  confidence?: string;
  linked_evidence?: string[];
  linked_decisions?: string[];
}

interface BeliefDetailProps {
  id: string;
}

export function BeliefDetailClient({ id }: BeliefDetailProps) {
  const [belief, setBelief] = useState<Belief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchBelief() {
      try {
        const res = await fetch(`/api/entities/belief/${id}`);
        if (!res.ok) throw new Error('Belief not found');
        const data = await res.json();
        setBelief(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载信念失败');
      } finally {
        setLoading(false);
      }
    }
    fetchBelief();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('确定要删除此信念吗？')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/entities/belief/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      window.location.href = '/belief';
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除信念失败');
      setDeleting(false);
    }
  };

  if (loading) return <div className="text-gray-500">加载信念中...</div>;
  if (error || !belief) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-200">{error || '未找到信念'}</p>
        <Link href="/belief" className="mt-4 inline-block text-accent-600 dark:text-accent-400 hover:underline">← 返回信念列表</Link>
      </div>
    );
  }

  return (
    <DetailShell
      entityType="belief"
      id={id}
      title={belief.title}
      status={belief.status}
      tags={belief.tags || []}
      created_at={belief.created_at}
      updated_at={belief.updated_at}
      listPath="/belief"
      editHref={`/entities/belief/${id}/edit`}
      onDelete={handleDelete}
      deleting={deleting}
      frontmatter={belief as unknown as Record<string, unknown>}
    >
    </DetailShell>
  );
}
