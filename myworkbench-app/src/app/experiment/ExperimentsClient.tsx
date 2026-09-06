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

export function ExperimentsClient() {
  const [experiments, setExperiments] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/entities/experiment');
        if (res.ok) {
          const data = await res.json();
          setExperiments(data);
        }
      } catch (error) {
        console.error('Error fetching experiments:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此实验吗？')) return;
    try {
      const res = await fetch(`/api/entities/experiment/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      setExperiments(experiments.filter((e) => e.id !== id));
    } catch (error) {
      console.error('Error deleting experiment:', error);
      alert('删除实验失败');
    }
  };

  const controls = useListControls(experiments);

  if (loading) {
    return <div className="text-gray-500">加载实验中...</div>;
  }

  return (
    <div>
      {experiments.length > 0 && (
        <ListToolbar {...controls.toolbar} placeholder="搜索实验标题 / 标签..." />
      )}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {experiments.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
              暂无实验。
            </div>
      ) : controls.items.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          没有匹配当前筛选条件的实验。
        </div>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {controls.items.map((exp) => (
            <li key={exp.id}>
              <div className="flex items-center justify-between p-6">
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
                <div className="flex gap-2 ml-4">
                      <Link
                        href={`/entities/experiment/${exp.id}/edit`}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
      )}
      </div>
    </div>
  );
}
