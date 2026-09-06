'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { BacklinksSection } from '@/components/BacklinksSection';

interface Evidence {
  id: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
  content: string;
  source_type?: string;
  source_url?: string;
  confidence?: string;
  date?: string;
  linked_beliefs?: string[];
  linked_decisions?: string[];
}

interface EvidenceDetailProps {
  id: string;
}

export function EvidenceDetailClient({ id }: EvidenceDetailProps) {
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchEvidence() {
      try {
        const res = await fetch(`/api/entities/evidence/${id}`);
        if (!res.ok) throw new Error('Evidence not found');
        const data = await res.json();
        setEvidence(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载证据失败');
      } finally {
        setLoading(false);
      }
    }
    fetchEvidence();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('确定要删除此证据吗？')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/entities/evidence/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      window.location.href = '/evidence';
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除证据失败');
      setDeleting(false);
    }
  };

  if (loading) return <div className="text-gray-500">加载证据中...</div>;
  if (error || !evidence) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-200">{error || '未找到证据'}</p>
        <Link href="/evidence" className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline">← 返回证据列表</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{evidence.title}</h2>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              {evidence.source_type && <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">{evidence.source_type}</span>}
              {evidence.confidence && <span>置信度：{evidence.confidence}</span>}
              {evidence.date && <span>日期：{evidence.date}</span>}
              <span>更新：{new Date(evidence.updated_at).toLocaleDateString()}</span>
            </div>
            {evidence.tags && evidence.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {evidence.tags.map((tag) => <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">{tag}</span>)}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Link href={`/entities/evidence/${id}/edit`} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">编辑</Link>
            <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50">{deleting ? '删除中...' : '删除'}</button>
          </div>
        </div>
      </div>

      {evidence.source_url && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">来源链接</h3>
          <a href={evidence.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline break-all">{evidence.source_url}</a>
        </section>
      )}

      <MarkdownViewer entityType="evidence" id={id} />
      <BacklinksSection entityType="evidence" entityId={id} />

      <div className="flex gap-4">
        <Link href="/evidence" className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">← 返回证据列表</Link>
      </div>
    </div>
  );
}
