'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DetailShell } from '@/components/DetailShell';

interface Evidence {
  id: string;
  title: string;
  status: string;
  tags: string[];
  created_at: string;
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
        <Link href="/evidence" className="mt-4 inline-block text-accent-600 dark:text-accent-400 hover:underline">← 返回证据列表</Link>
      </div>
    );
  }

  return (
    <DetailShell
      entityType="evidence"
      id={id}
      title={evidence.title}
      status={evidence.status}
      tags={evidence.tags || []}
      created_at={evidence.created_at}
      updated_at={evidence.updated_at}
      listPath="/evidence"
      editHref={`/entities/evidence/${id}/edit`}
      onDelete={handleDelete}
      deleting={deleting}
      frontmatter={evidence as unknown as Record<string, unknown>}
    >
      {evidence.source_url && (
        <section className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">来源链接</h3>
          <a href={evidence.source_url} target="_blank" rel="noopener noreferrer" className="text-accent-600 dark:text-accent-400 hover:underline break-all">{evidence.source_url}</a>
        </section>
      )}
    </DetailShell>
  );
}
