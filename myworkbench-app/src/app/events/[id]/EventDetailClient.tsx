'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { BacklinksSection } from '@/components/BacklinksSection';

interface Event {
  id: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
  content: string;
  event_type?: string;
  date?: string;
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
        <Link href="/events" className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline">
          ← 返回事件列表
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{event.title}</h2>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                event.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {event.status}
              </span>
              {event.event_type && <span>类型：{event.event_type}</span>}
              {event.date && <span>日期：{event.date}</span>}
              {event.location && <span>地点：{event.location}</span>}
              <span>更新：{new Date(event.updated_at).toLocaleDateString()}</span>
            </div>
            {event.tags && event.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Link href={`/events/${id}/edit`} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              编辑
            </Link>
            <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50">
              {deleting ? '删除中...' : '删除'}
            </button>
          </div>
        </div>
      </div>

      {event.participants && event.participants.length > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">参与人员</h3>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
            {event.participants.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </section>
      )}

      <MarkdownViewer entityType="event" id={id} />
      <BacklinksSection entityType="event" entityId={id} />

      <div className="flex gap-4">
        <Link href="/events" className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
          ← 返回事件列表
        </Link>
      </div>
    </div>
  );
}
