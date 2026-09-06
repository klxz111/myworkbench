'use client';

import Link from 'next/link';
import { useListControls, ListToolbar, LoadMoreRow, useEntityListPage } from '@/components/ListControls';

interface Entity {
  id: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
}

export function PeopleClient() {
  const { items: people, total, facets, loading, loadingMore, hasMore, loadMore, reset } = useEntityListPage<Entity>('person');

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此人员吗？')) return;
    try {
      const res = await fetch(`/api/entities/person/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      await reset();
    } catch (error) {
      console.error('Error deleting person:', error);
      alert('删除人员失败');
    }
  };

  const controls = useListControls(people, facets);

  if (loading) {
    return <div className="text-gray-500">加载人员中...</div>;
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">人员</h2>
        </div>
        {total > 0 && (
          <ListToolbar {...controls.toolbar} placeholder="搜索人员姓名 / 标签..." />
        )}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {total === 0 ? (
            <div className="p-6 text-center text-gray-500">暂无人员条目。</div>
          ) : controls.items.length === 0 ? (
            <div className="p-6 text-center text-gray-500">没有匹配当前筛选条件的人员条目。</div>
          ) : (
            <>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {controls.items.map((person) => (
                <li key={person.id} className="flex items-center justify-between p-6">
                  <Link
                    href={`/people/${person.id}`}
                    className="flex-1 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">{person.title}</div>
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              person.status === 'active'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {person.status}
                          </span>
                          <span>更新：{new Date(person.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                  <div className="flex gap-2 ml-4">
                    <Link
                      href={`/entities/person/${person.id}/edit`}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      编辑
                    </Link>
                    <button
                      onClick={() => handleDelete(person.id)}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                    >
                      删除
                    </button>
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
      </section>
    </div>
  );
}
