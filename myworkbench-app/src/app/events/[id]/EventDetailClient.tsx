'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DetailShell } from '@/components/DetailShell';

interface Event {
  id: string;
  title: string;
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  content: string;
  event_type?: string;
  event_date?: string;
  location?: string;
  participants?: string[];
}

interface EventDetailProps {
  id: string;
}

export function EventDetailClient({ id }: EventDetailProps) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/entities/event/${id}`);
        if (!res.ok) throw new Error('Event not found');
        const data = await res.json();
        setEvent(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载事件失败');
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('确定要删除此事件吗？')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/entities/event/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      window.location.href = '/events';
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除事件失败');
      setDeleting(false);
    }
  };

  if (loading) return <div className="text-gray-500">加载事件中...</div>;
  if (error || !event) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-200">{error || '未找到事件'}</p>
        <Link href="/events" className="mt-4 inline-block text-accent-600 dark:text-accent-400 hover-underline">
          ← 返回事件列表
        </Link>
      </div>
    );
  }

  return (
    <DetailShell
      entityType="event"
      id={id}
      title={event.title}
      status={event.status}
      tags={event.tags || []}
      created_at={event.created_at}
      updated_at={event.updated_at}
      listPath="/events"
      editHref={`/events/${id}/edit`}
      onDelete={handleDelete}
      deleting={deleting}
      frontmatter={event as unknown as Record<string, unknown>}
    >
      {event.participants && event.participants.length > 0 && (
        <section className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">参与人员</h3>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
            {event.participants.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </section>
      )}
    </DetailShell>
  );
}
