'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useListControls, ListToolbar } from '@/components/ListControls';

interface Belief {
  id: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
}

const CONFIDENCE_COLORS: Record<string, string> = {
  high: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  low: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export function BeliefClient() {
  const [beliefs, setBeliefs] = useState<Belief[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBeliefs() {
      try {
        const res = await fetch('/api/entities/belief');
        const data = await res.json();
        setBeliefs(data);
      } catch (error) {
        console.error('Error fetching beliefs:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchBeliefs();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此信念吗？')) return;
    try {
      const res = await fetch(`/api/entities/belief/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      setBeliefs(beliefs.filter((b) => b.id !== id));
    } catch (error) {
      console.error('Error deleting belief:', error);
      alert('删除信念失败');
    }
  };

  const controls = useListControls(beliefs);

  if (loading) {
    return <div className="text-gray-500">加载信念中...</div>;
  }

  return (
    <div>
      {beliefs.length > 0 && (
        <ListToolbar {...controls.toolbar} placeholder="搜索信念标题 / 标签..." />
      )}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {beliefs.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
          暂无信念。解读证据以建立您的信念体系。
        </div>
      ) : controls.items.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          没有匹配当前筛选条件的信念。
        </div>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {controls.items.map((belief) => (
            <li key={belief.id}>
              <div className="flex items-center justify-between p-6">
                <Link
                  href={`/belief/${belief.id}`}
                  className="flex-1 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {belief.title}
                      </h3>
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          belief.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {belief.status}
                        </span>
                        <span>
                          更新：{new Date(belief.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                      {belief.tags && belief.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {belief.tags.map((tag) => (
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
                    href={`/entities/belief/${belief.id}/edit`}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    编辑
                  </Link>
                  <button
                    onClick={() => handleDelete(belief.id)}
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
