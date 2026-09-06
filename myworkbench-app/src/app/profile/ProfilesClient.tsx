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

export function ProfilesClient() {
  const { items: profiles, total, facets, loading, loadingMore, hasMore, loadMore, reset } = useEntityListPage<Entity>('profile');

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此个人档案吗？')) return;
    try {
      const res = await fetch(`/api/entities/profile/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      await reset();
    } catch (error) {
      console.error('Error deleting profile:', error);
      alert('删除个人档案失败');
    }
  };

  const controls = useListControls(profiles, facets);

  if (loading) {
    return <div className="text-gray-500">加载档案中...</div>;
  }

  return (
    <div>
      {total > 0 && (
        <ListToolbar {...controls.toolbar} placeholder="搜索档案标题 / 标签..." />
      )}
      <div className="card">
      {total === 0 ? (
              <div className="p-6 text-center text-gray-500">
              暂无档案。
            </div>
      ) : controls.items.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          没有匹配当前筛选条件的档案。
        </div>
      ) : (
        <>
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {controls.items.map((profile) => (
            <li key={profile.id}>
              <div className="flex items-center justify-between p-6">
                <Link
                  href={`/profile/${profile.id}`}
                  className="flex-1 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {profile.title}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            profile.status === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {profile.status}
                        </span>
                        <span>更新：{new Date(profile.updated_at).toLocaleDateString()}</span>
                      </div>
                      {profile.tags && profile.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {profile.tags.map((tag) => (
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
                        href={`/entities/profile/${profile.id}/edit`}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        编辑
                      </Link>
                      <button
                        onClick={() => handleDelete(profile.id)}
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
