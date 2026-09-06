'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { BacklinksSection } from '@/components/BacklinksSection';

interface Person {
  id: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
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
        <Link href="/people" className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline">
          ← 返回人员列表
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{person.title}</h2>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              {person.organization && <span>组织：{person.organization}</span>}
              {person.role && <span>角色：{person.role}</span>}
              <span>更新：{new Date(person.updated_at).toLocaleDateString()}</span>
            </div>
            {person.tags && person.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {person.tags.map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Link href={`/entities/person/${id}/edit`} className="btn-primary">
              编辑
            </Link>
            <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50">
              {deleting ? '删除中...' : '删除'}
            </button>
          </div>
        </div>
      </div>

      {(person.research_interests && person.research_interests.length > 0) && (
        <section className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">研究兴趣</h3>
          <div className="flex flex-wrap gap-2">
            {person.research_interests.map((item) => (
              <span key={item} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-sm">{item}</span>
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

      <MarkdownViewer entityType="person" id={id} />
      <BacklinksSection entityType="person" entityId={id} />

      <div className="flex gap-4">
        <Link href="/people" className="btn-secondary">
          ← 返回人员列表
        </Link>
      </div>
    </div>
  );
}
