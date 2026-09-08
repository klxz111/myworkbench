'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DetailShell } from '@/components/DetailShell';

interface Opportunity {
  id: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
  created_at: string;
  content: string;
  category?: string;
  timeframe?: string;
  confidence?: string;
  expected_value?: string;
  linked_decisions?: string[];
}

interface OpportunityDetailProps {
  id: string;
}

export function OpportunityDetailClient({ id }: OpportunityDetailProps) {
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchOpportunity() {
      try {
        const res = await fetch(`/api/entities/opportunity/${id}`);
        if (!res.ok) throw new Error('Opportunity not found');
        const data = await res.json();
        setOpportunity(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载机会失败');
      } finally {
        setLoading(false);
      }
    }
    fetchOpportunity();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('确定要删除此机会吗？')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/entities/opportunity/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      window.location.href = '/opportunity';
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除机会失败');
      setDeleting(false);
    }
  };

  if (loading) return <div className="text-gray-500">加载机会中...</div>;
  if (error || !opportunity) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-200">{error || '未找到机会'}</p>
        <Link href="/opportunity" className="mt-4 inline-block text-accent-600 dark:text-accent-400 hover:underline">← 返回机会列表</Link>
      </div>
    );
  }

  return (
    <DetailShell entityType="opportunity" id={id} title={opportunity.title} status={opportunity.status}
      tags={opportunity.tags || []} created_at={opportunity.created_at || ''} updated_at={opportunity.updated_at}
      listPath="/opportunity" editHref={`/entities/opportunity/${id}/edit`} onDelete={handleDelete} deleting={deleting}
      frontmatter={opportunity as unknown as Record<string, unknown>}>
      {/* 暂无专属字段区块 */}
    </DetailShell>
  );
}
