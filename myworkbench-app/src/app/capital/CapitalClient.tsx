'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CapitalRadarChart } from '@/components/CapitalRadarChart';
import { useListControls, ListToolbar } from '@/components/ListControls';

interface Entity {
  id: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
}

export function CapitalClient() {
  const [entries, setEntries] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [latestCapital, setLatestCapital] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/entities/capital');
        if (res.ok) {
          const data = await res.json();
          setEntries(data);
          const latest = data.find((e: Entity) => e.status === 'active') || data[0];
          if (latest) {
            const detailRes = await fetch(`/api/entities/capital/${latest.id}`);
            if (detailRes.ok) {
              const detail = await detailRes.json();
              setLatestCapital(detail.frontmatter || detail);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching capital:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filtered = filter === 'all' ? entries : entries.filter((e) => e.status === filter);
  const controls = useListControls(filtered);
  const activeCount = entries.filter((e) => e.status === 'active').length;
  const draftCount = entries.filter((e) => e.status === 'draft').length;

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此资本条目吗？')) return;
    try {
      const res = await fetch(`/api/entities/capital/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      setEntries(entries.filter((e) => e.id !== id));
    } catch (error) {
      console.error('Error deleting capital:', error);
      alert('删除资本条目失败');
    }
  };

  if (loading) {
    return <div className="text-gray-500">加载资本中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
          {[
            { key: 'all', label: `全部 (${entries.length})` },
            { key: 'active', label: `活跃 (${activeCount})` },
            { key: 'draft', label: `草稿 (${draftCount})` },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                filter === item.key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-200 mb-2">
          资本仪表板
        </h2>
        <p className="text-blue-800 dark:text-blue-300 mb-4">
          追踪并累积您的多维度资本。
        </p>
        {latestCapital && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <CapitalRadarChart frontmatter={latestCapital} />
          </div>
        )}
      </div>

      {entries.length > 0 && (
        <ListToolbar {...controls.toolbar} statuses={[]} placeholder="搜索资本条目 / 标签..." />
      )}

      <div className="card">
        {filtered.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
               暂无资本条目。创建您的第一个资本条目以开始追踪。
             </div>
        ) : controls.items.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            没有匹配当前搜索条件的资本条目。
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {controls.items.map((entry) => (
              <li key={entry.id}>
                <div className="flex items-center justify-between p-6">
                  <Link
                    href={`/capital/${entry.id}`}
                    className="flex-1 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {entry.title}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              entry.status === 'active'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {entry.status}
                          </span>
                          <span>更新：{new Date(entry.updated_at).toLocaleDateString()}</span>
                        </div>
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {entry.tags.map((tag) => (
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
                        href={`/entities/capital/${entry.id}/edit`}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        编辑
                      </Link>
                      <button
                        onClick={() => handleDelete(entry.id)}
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
