'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useListControls, ListToolbar, LoadMoreRow, useEntityListPage } from '@/components/ListControls';

interface Entity {
  id: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
}

export function ResearchClient() {
  const {
    items: research, total, facets, loading: loadingResearch, loadingMore, hasMore, loadMore, reset,
  } = useEntityListPage<Entity>('research');
  const [evidence, setEvidence] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/entities/evidence')
      .then((r) => r.json())
      .then((d) => setEvidence(Array.isArray(d) ? d : []))
      .catch((error) => console.error('Error fetching evidence:', error))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (type: string, id: string) => {
    if (!confirm(`确定要删除此${type === 'research' ? '研究' : '证据'}吗？`)) return;
    try {
      const res = await fetch(`/api/entities/${type}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      if (type === 'research') {
        await reset();
      } else {
        setEvidence(evidence.filter((e) => e.id !== id));
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      alert(`删除${type === 'research' ? '研究' : '证据'}失败`);
    }
  };

  const controlsR = useListControls(research, facets);
  const controlsE = useListControls(evidence);

  if (loading || loadingResearch) {
    return <div className="text-gray-500">加载研究中...</div>;
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            研究主题
          </h2>
        </div>
        {total > 0 && (
          <ListToolbar {...controlsR.toolbar} placeholder="搜索研究主题 / 标签..." />
        )}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {total === 0 ? (
              <div className="p-6 text-center text-gray-500">
              暂无研究主题。
            </div>
          ) : controlsR.items.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              没有匹配当前筛选条件的研究主题。
            </div>
          ) : (
            <>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {controlsR.items.map((item) => (
                <li key={item.id}>
                  <div className="flex items-center justify-between p-6">
                    <Link
                      href={`/research/${item.id}`}
                      className="flex-1 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        {item.title}
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.status === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                         >
                           {item.status}
                         </span>
                         <span>更新：{new Date(item.updated_at).toLocaleDateString()}</span>
                       </div>
                     </Link>
                     <div className="flex gap-2 ml-4">
                       <Link
                         href={`/entities/research/${item.id}/edit`}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        编辑
                      </Link>
                      <button
                        onClick={() => handleDelete('research', item.id)}
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
              loadedCount={controlsR.items.length}
              total={total}
              onLoadMore={loadMore}
            />
            </>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            证据
          </h2>
        </div>
        {evidence.length > 0 && (
          <ListToolbar {...controlsE.toolbar} placeholder="搜索证据 / 标签..." />
        )}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {evidence.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
              暂无证据条目。
            </div>
          ) : controlsE.items.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              没有匹配当前筛选条件的证据条目。
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {controlsE.items.map((item) => (
                <li key={item.id}>
                  <div className="flex items-center justify-between p-6">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {item.title}
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.status === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                         >
                           {item.status}
                         </span>
                         <span>更新：{new Date(item.updated_at).toLocaleDateString()}</span>
                       </div>
                     </div>
                     <div className="flex gap-2 ml-4">
                       <Link
                         href={`/entities/evidence/${item.id}/edit`}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        编辑
                      </Link>
                      <button
                        onClick={() => handleDelete('evidence', item.id)}
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
      </section>
    </div>
  );
}
