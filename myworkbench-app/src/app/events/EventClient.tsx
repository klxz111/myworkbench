'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useListControls, ListToolbar } from '@/components/ListControls';

interface EventItem {
  id: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
}

export function EventClient() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch('/api/entities/event');
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此事件吗？')) return;
    try {
      const res = await fetch(`/api/entities/event/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      setEvents(events.filter((e) => e.id !== id));
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('删除事件失败');
    }
  };

  const controls = useListControls(events);

  if (loading) {
    return <div className="text-gray-500">加载事件中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">事件</h1>
        <Link
          href="/entities/event/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          新建事件
        </Link>
      </div>

      {events.length > 0 && (
        <ListToolbar {...controls.toolbar} placeholder="搜索事件标题 / 标签..." />
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {events.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            暂无事件。创建您的第一个事件以开始。
          </div>
        ) : controls.items.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            没有匹配当前筛选条件的事件。
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {controls.items.map((event) => (
              <li key={event.id}>
                <div className="flex items-center justify-between p-6">
                  <Link
                    href={`/events/${event.id}`}
                    className="flex-1 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {event.title}
                        </h3>
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            event.status === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {event.status}
                          </span>
                          <span>更新：{new Date(event.updated_at).toLocaleDateString()}</span>
                        </div>
                        {event.tags && event.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {event.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                  <div className="flex gap-2 ml-4">
                    <Link
                      href={`/events/${event.id}/edit`}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      编辑
                    </Link>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
