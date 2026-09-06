'use client';

import Link from 'next/link';
import { useListControls, ListToolbar, LoadMoreRow, useEntityListPage } from '@/components/ListControls';

interface Evidence {
  id: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
}

const SOURCE_COLORS: Record<string, string> = {
  paper: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  news: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  policy: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  company: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  experiment: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  conversation: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  market: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  observation: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

export function EvidenceClient() {
  const { items: evidence, total, facets, loading, loadingMore, hasMore, loadMore, reset } = useEntityListPage<Evidence>('evidence');

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此证据吗？')) return;
    try {
      const res = await fetch(`/api/entities/evidence/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      await reset();
    } catch (error) {
      console.error('Error deleting evidence:', error);
      alert('删除证据失败');
    }
  };

  const controls = useListControls(evidence, facets);

  if (loading) {
    return <div className="text-gray-500">加载证据中...</div>;
  }

  return (
    <div>
      {total > 0 && (
        <ListToolbar {...controls.toolbar} placeholder="搜索证据标题 / 标签..." />
      )}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {total === 0 ? (
              <div className="p-6 text-center text-gray-500">
              暂无证据。添加观察、文献或实验。
            </div>
      ) : controls.items.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          没有匹配当前筛选条件的证据。
        </div>
      ) : (
        <>
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {controls.items.map((item) => (
            <li key={item.id}>
              <div className="flex items-center justify-between p-6">
                <Link
                  href={`/evidence/${item.id}`}
                  className="flex-1 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {item.title}
                      </h3>
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {item.status}
                        </span>
                        <span>
                          更新：{new Date(item.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                      {item.tags && item.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.tags.map((tag) => (
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
                        href={`/entities/evidence/${item.id}/edit`}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        编辑
                      </Link>
                      <button
                        onClick={() => handleDelete(item.id)}
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
