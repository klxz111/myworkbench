'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { BacklinksSection } from '@/components/BacklinksSection';

interface Opportunity {
  id: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
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
        <Link href="/opportunity" className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline">← 返回机会列表</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{opportunity.title}</h2>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              {opportunity.category && <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-xs">{opportunity.category}</span>}
              {opportunity.confidence && <span>置信度：{opportunity.confidence}</span>}
              {opportunity.timeframe && <span>时间框架：{opportunity.timeframe}</span>}
              {opportunity.expected_value && <span>预期价值：{opportunity.expected_value}</span>}
              <span>更新：{new Date(opportunity.updated_at).toLocaleDateString()}</span>
            </div>
            {opportunity.tags && opportunity.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {opportunity.tags.map((tag) => <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">{tag}</span>)}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Link href={`/opportunity/${id}/edit`} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">编辑</Link>
            <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50">{deleting ? '删除中...' : '删除'}</button>
          </div>
        </div>
      </div>

      <MarkdownViewer entityType="opportunity" id={id} />
      <BacklinksSection entityType="opportunity" entityId={id} />

      <div className="flex gap-4">
        <Link href="/opportunity" className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">← 返回机会列表</Link>
      </div>
    </div>
  );
}
