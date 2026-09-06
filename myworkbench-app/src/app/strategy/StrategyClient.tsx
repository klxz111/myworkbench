'use client';

import Link from 'next/link';
import { useListControls, ListToolbar, LoadMoreRow, useEntityListPage } from '@/components/ListControls';

interface Strategy {
  id: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
}

export function StrategyClient() {
  const { items: strategies, total, facets, loading, loadingMore, hasMore, loadMore, reset } = useEntityListPage<Strategy>('strategy');

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此策略吗？')) return;
    try {
      const res = await fetch(`/api/entities/strategy/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      await reset();
    } catch (error) {
      console.error('Error deleting strategy:', error);
      alert('删除策略失败');
    }
  };

  const controls = useListControls(strategies, facets);

  if (loading) {
    return <div className="text-gray-500">加载策略中...</div>;
  }

  return (
    <div className="space-y-6">
      {total > 0 && (
        <ListToolbar {...controls.toolbar} placeholder="搜索策略标题 / 标签..." />
      )}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {total === 0 ? (
          <div className="p-6 text-center text-gray-500">
            暂无策略。请定义您的长期方向。
          </div>
        ) : controls.items.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            没有匹配当前筛选条件的策略。
          </div>
        ) : (
          <>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {controls.items.map((strategy) => (
              <li key={strategy.id}>
                <div className="flex items-center justify-between p-6">
                  <Link
                    href={`/strategy/${strategy.id}`}
                    className="flex-1 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {strategy.title}
                        </h3>
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            strategy.status === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {strategy.status}
                          </span>
                           <span>
                             更新：{new Date(strategy.updated_at).toLocaleDateString()}
                           </span>
                        </div>
                        {strategy.tags && strategy.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {strategy.tags.map((tag) => (
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
                      href={`/entities/strategy/${strategy.id}/edit`}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      编辑
                    </Link>
                    <button
                      onClick={() => handleDelete(strategy.id)}
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
