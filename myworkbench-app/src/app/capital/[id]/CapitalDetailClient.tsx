'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DetailShell } from '@/components/DetailShell';

interface Capital {
  id: string;
  title: string;
  status: string;
  tags: string[];
  created_at: string;
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
        <Link href="/capital" className="mt-4 inline-block text-accent-600 dark:text-accent-400 hover:underline">← 返回资本列表</Link>
      </div>
    );
  }

  return (
    <DetailShell
      entityType="capital"
      id={id}
      title={capital.title}
      status={capital.status}
      tags={capital.tags || []}
      created_at={capital.created_at}
      updated_at={capital.updated_at}
      listPath="/capital"
      editHref={`/entities/capital/${id}/edit`}
      onDelete={handleDelete}
      deleting={deleting}
      frontmatter={capital as unknown as Record<string, unknown>}
    >
    </DetailShell>
  );
}
