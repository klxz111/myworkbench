'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useListControls, ListToolbar, LoadMoreRow, useEntityListPage } from '@/components/ListControls';

interface Entity {
  id: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
}

const MAX_COMPARE = 4;

export function ExperimentsClient() {
  const { items: experiments, total, facets, loading, loadingMore, hasMore, loadMore, reset } = useEntityListPage<Entity>('experiment');
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= MAX_COMPARE) {
          alert(`最多同时对比 ${MAX_COMPARE} 个实验`);
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  };

  const startCompare = () => {
    if (selected.size < 2) return;
    router.push(`/experiment/compare?ids=${[...selected].join(',')}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此实验吗？')) return;
    try {
      const res = await fetch(`/api/entities/experiment/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await reset();
    } catch (error) {
      console.error('Error deleting experiment:', error);
      alert('删除实验失败');
    }
  };

  const controls = useListControls(experiments, facets);

  if (loading) {
    return <div className="text-gray-500">加载实验中...</div>;
  }

  return (
    <div>
      {total > 0 && (
        <ListToolbar {...controls.toolbar} placeholder="搜索实验标题 / 标签..." />
      )}
      {selected.size > 0 && (
        <div className="sticky bottom-4 z-20 flex items-center justify-between card p-4 shadow-lg border-accent-200 dark:border-accent-800">
          <span className="text-sm text-gray-700 dark:text-gray-200">
            已选 {selected.size} 个实验（最多 {MAX_COMPARE}）
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setSelected(new Set())} className="btn-ghost text-sm">
              清除
            </button>
            <button onClick={startCompare} disabled={selected.size < 2} className="btn-primary text-sm disabled:opacity-50">
              开始对比
            </button>
          </div>
        </div>
      )}
      <div className="card">
      {total === 0 ? (
              <div className="p-6 text-center text-gray-500">
              暂无实验。
            </div>
      ) : controls.items.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          没有匹配当前筛选条件的实验。
        </div>
      ) : (
        <>
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {controls.items.map((exp) => (
            <li key={exp.id}>
              <div className="flex items-center justify-between p-6">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={selected.has(exp.id)}
                    onChange={() => toggleSelect(exp.id)}
                    aria-label={`选择对比 ${exp.title}`}
                    className="mt-1.5 shrink-0 h-4 w-4"
                  />
                  <Link
                    href={`/experiment/${exp.id}`}
                    className="flex-1 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {exp.title}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              exp.status === 'active'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {exp.status}
                          </span>
                          <span>更新：{new Date(exp.updated_at).toLocaleDateString()}</span>
                        </div>
                        {exp.tags && exp.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {exp.tags.map((tag) => (
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
                </div>
                <div className="flex gap-2 ml-4">
                      <Link
                        href={`/entities/experiment/${exp.id}/edit`}
                        className="px-3 py-1.5 bg-accent-600 text-white rounded-lg hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-accent-500 text-sm"
                      >
                        编辑
                      </Link>
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                      >
                        删除
                      </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <LoadMoreRow
                    hasMore={hasMore}
                    loading={loadingMore}
                    loadedCount={controls.items.length}
                    total={total}
                    onLoadMore={loadMore}
                  />
                  </>
      )}
      </div>
    </div>
  );
}
