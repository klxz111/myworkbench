'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DetailShell } from '@/components/DetailShell';

interface Person {
  id: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
  created_at: string;
  content: string;
  organization?: string;
  role?: string;
  research_interests?: string[];
  relationship_strength?: string;
  last_interaction?: string;
  next_action?: string;
  next_action_date?: string;
  follow_up_notes?: string;
}

interface PersonDetailProps {
  id: string;
}

export function PersonDetailClient({ id }: PersonDetailProps) {
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchPerson() {
      try {
        const res = await fetch(`/api/entities/person/${id}`);
        if (!res.ok) throw new Error('Person not found');
        const data = await res.json();
        setPerson(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载人员失败');
      } finally {
        setLoading(false);
      }
    }
    fetchPerson();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('确定要删除此人员吗？')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/entities/person/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      window.location.href = '/people';
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除人员失败');
      setDeleting(false);
    }
  };

  if (loading) return <div className="text-gray-500">加载人员中...</div>;
  if (error || !person) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-200">{error || '未找到人员'}</p>
        <Link href="/people" className="mt-4 inline-block text-accent-600 dark:text-accent-400 hover:underline">
          ← 返回人员列表
        </Link>
      </div>
    );
  }

  return (
    <DetailShell entityType="person" id={id} title={person.title} status={person.status}
      tags={person.tags || []} created_at={person.created_at || ''} updated_at={person.updated_at}
      listPath="/people" editHref={`/entities/person/${id}/edit`} onDelete={handleDelete} deleting={deleting}
      frontmatter={person as unknown as Record<string, unknown>}>
      {(person.research_interests && person.research_interests.length > 0) && (
        <section className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">研究兴趣</h3>
          <div className="flex flex-wrap gap-2">
            {person.research_interests.map((item) => (
              <span key={item} className="px-2 py-1 bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 rounded text-sm">{item}</span>
            ))}
          </div>
        </section>
      )}

      {(person.next_action || person.next_action_date) && (
        <section className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">跟进提醒</h3>
          <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            {person.next_action && <div>下一步行动：{person.next_action}</div>}
            {person.next_action_date && <div>计划日期：{person.next_action_date}</div>}
            {person.follow_up_notes && <div>备注：{person.follow_up_notes}</div>}
          </div>
        </section>
      )}
    </DetailShell>
  );
}
