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

export function ProjectsClient() {
  const {
    items: projects, total, facets, loading: loadingProjects, loadingMore, hasMore, loadMore, reset,
  } = useEntityListPage<Entity>('project');
  const [experiments, setExperiments] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/entities/experiment')
      .then((r) => r.json())
      .then((d) => setExperiments(Array.isArray(d) ? d : []))
      .catch((error) => console.error('Error fetching experiments:', error))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (type: string, id: string) => {
    if (!confirm(`确定要删除此${type === 'project' ? '项目' : '实验'}吗？`)) return;
    try {
      const res = await fetch(`/api/entities/${type}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      if (type === 'project') {
        await reset();
      } else {
        setExperiments(experiments.filter((e) => e.id !== id));
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      alert(`删除${type === 'project' ? '项目' : '实验'}失败`);
    }
  };

  const controlsP = useListControls(projects, facets);
  const controlsE = useListControls(experiments);

  if (loading || loadingProjects) {
    return <div className="text-gray-500">加载项目中...</div>;
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            项目
          </h2>
        </div>
        {total > 0 && (
          <ListToolbar {...controlsP.toolbar} placeholder="搜索项目标题 / 标签..." />
        )}
        <div className="card">
          {total === 0 ? (
              <div className="p-6 text-center text-gray-500">
              暂无项目。
            </div>
          ) : controlsP.items.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              没有匹配当前筛选条件的项目。
            </div>
          ) : (
            <>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {controlsP.items.map((project) => (
                <li key={project.id}>
                  <div className="flex items-center justify-between p-6">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {project.title}
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            project.status === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : project.status === 'completed'
                              ? 'bg-accent-100 text-accent-800 dark:bg-accent-900 dark:text-accent-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {project.status}
                        </span>
                        <span>更新：{new Date(project.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Link
                        href={`/entities/project/${project.id}/edit`}
                        className="px-3 py-1.5 bg-accent-600 text-white rounded-lg hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-accent-500 text-sm"
                      >
                        编辑
                      </Link>
                      <button
                        onClick={() => handleDelete('project', project.id)}
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
              loadedCount={controlsP.items.length}
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
            实验
          </h2>
        </div>
        {experiments.length > 0 && (
          <ListToolbar {...controlsE.toolbar} placeholder="搜索实验标题 / 标签..." />
        )}
        <div className="card">
          {experiments.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
              暂无实验。
            </div>
          ) : controlsE.items.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              没有匹配当前筛选条件的实验。
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {controlsE.items.map((exp) => (
                <li key={exp.id}>
                  <div className="flex items-center justify-between p-6">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {exp.title}
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
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
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Link
                        href={`/entities/experiment/${exp.id}/edit`}
                        className="px-3 py-1.5 bg-accent-600 text-white rounded-lg hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-accent-500 text-sm"
                      >
                        编辑
                      </Link>
                      <button
                        onClick={() => handleDelete('experiment', exp.id)}
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
