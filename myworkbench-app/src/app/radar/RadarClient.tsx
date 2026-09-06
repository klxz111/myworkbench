'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useListControls, ListToolbar } from '@/components/ListControls';

interface Entity {
  id: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
}

export function RadarClient() {
  const [radars, setRadars] = useState<Entity[]>([]);
  const [enriched, setEnriched] = useState<Record<string, { category?: string; signal_strength?: string }>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/entities/radar');
        if (res.ok) {
          const data = await res.json();
          setRadars(data);
          const enrichedMap: Record<string, { category?: string; signal_strength?: string }> = {};
          for (const item of data) {
            try {
              const detailRes = await fetch(`/api/entities/radar/${item.id}`);
              if (detailRes.ok) {
                const detail = await detailRes.json();
                enrichedMap[item.id] = {
                  category: detail.category,
                  signal_strength: detail.signal_strength,
                };
              }
            } catch {
              // ignore enrichment failure
            }
          }
          setEnriched(enrichedMap);
        }
      } catch (error) {
        console.error('Error fetching radar:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filtered = radars.filter((r) => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (categoryFilter !== 'all' && enriched[r.id]?.category !== categoryFilter) return false;
    return true;
  });

  const activeCount = radars.filter((r) => r.status === 'active').length;
  const draftCount = radars.filter((r) => r.status === 'draft').length;
  const controls = useListControls(filtered);

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此雷达条目吗？')) return;
    try {
      const res = await fetch(`/api/entities/radar/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      setRadars(radars.filter((r) => r.id !== id));
    } catch (error) {
      console.error('Error deleting radar:', error);
      alert('删除雷达条目失败');
    }
  };

  if (loading) {
    return <div className="text-gray-500">加载雷达中...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
          {[
            { key: 'all', label: `全部 (${radars.length})` },
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
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="all">全部分类</option>
          <option value="ai_research">AI 研究</option>
          <option value="frontier_lab">前沿实验室</option>
          <option value="company">公司</option>
          <option value="university">大学</option>
          <option value="hardware">硬件</option>
          <option value="ml_systems">ML 系统</option>
          <option value="robotics">机器人</option>
          <option value="funding">融资</option>
          <option value="policy">政策</option>
          <option value="ecosystem">生态</option>
        </select>
      </div>

      {radars.length > 0 && (
        <ListToolbar {...controls.toolbar} statuses={[]} placeholder="搜索雷达条目 / 标签..." />
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            暂无雷达条目。
          </div>
        ) : controls.items.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            没有匹配当前搜索条件的雷达条目。
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {controls.items.map((radar) => {
              const extra = enriched[radar.id] || {};
              return (
                <li key={radar.id}>
                  <div className="flex items-center justify-between p-6">
                    <Link
                      href={`/radar/${radar.id}`}
                      className="flex-1 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {radar.title}
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                radar.status === 'active'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {radar.status}
                            </span>
                            {extra.category && (
                              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs capitalize">
                                {extra.category.replace(/_/g, ' ')}
                              </span>
                            )}
                            {extra.signal_strength && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                extra.signal_strength === 'high'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  : extra.signal_strength === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              }`}>
                                {extra.signal_strength} signal
                              </span>
                            )}
                            <span>更新：{new Date(radar.updated_at).toLocaleDateString()}</span>
                          </div>
                           {radar.tags && radar.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {radar.tags.map((tag) => (
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
                        href={`/entities/radar/${radar.id}/edit`}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        编辑
                      </Link>
                      <button
                        onClick={() => handleDelete(radar.id)}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
