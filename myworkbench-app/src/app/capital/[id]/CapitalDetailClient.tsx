'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { BacklinksSection } from '@/components/BacklinksSection';

interface Capital {
  id: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
  content: string;
  category?: string;
  amount?: string;
  currency?: string;
  owner?: string;
  risk_level?: string;
}

interface CapitalDetailProps {
  id: string;
}

export function CapitalDetailClient({ id }: CapitalDetailProps) {
  const [capital, setCapital] = useState<Capital | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchCapital() {
      try {
        const res = await fetch(`/api/entities/capital/${id}`);
        if (!res.ok) throw new Error('Capital not found');
        const data = await res.json();
        setCapital(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载资本失败');
      } finally {
        setLoading(false);
      }
    }
    fetchCapital();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('确定要删除此资本条目吗？')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/entities/capital/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      window.location.href = '/capital';
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除资本失败');
      setDeleting(false);
    }
  };

  if (loading) return <div className="text-gray-500">加载资本中...</div>;
  if (error || !capital) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-200">{error || '未找到资本'}</p>
        <Link href="/capital" className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline">← 返回资本列表</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{capital.title}</h2>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              {capital.category && <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-full text-xs">{capital.category}</span>}
              {(capital.amount && capital.currency) && <span>金额：{capital.currency} {capital.amount}</span>}
              {capital.owner && <span>所有者：{capital.owner}</span>}
              {capital.risk_level && <span>风险：{capital.risk_level}</span>}
              <span>更新：{new Date(capital.updated_at).toLocaleDateString()}</span>
            </div>
            {capital.tags && capital.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {capital.tags.map((tag) => <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">{tag}</span>)}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Link href={`/entities/capital/${id}/edit`} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">编辑</Link>
            <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50">{deleting ? '删除中...' : '删除'}</button>
          </div>
        </div>
      </div>

      <MarkdownViewer entityType="capital" id={id} />
      <BacklinksSection entityType="capital" entityId={id} />

      <div className="flex gap-4">
        <Link href="/capital" className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">← 返回资本列表</Link>
      </div>
    </div>
  );
}
