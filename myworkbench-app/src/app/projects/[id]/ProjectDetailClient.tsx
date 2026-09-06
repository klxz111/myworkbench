'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { BacklinksSection } from '@/components/BacklinksSection';

interface Project {
  id: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
  content: string;
  start_date?: string;
  target_end_date?: string;
  milestones?: Array<{ name: string; date?: string; completed?: boolean }>;
  current_phase?: string;
  resources?: string[];
}

interface ProjectDetailProps {
  id: string;
}

export function ProjectDetailClient({ id }: ProjectDetailProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/entities/project/${id}`);
        if (!res.ok) throw new Error('Project not found');
        const data = await res.json();
        setProject(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载项目失败');
      } finally {
        setLoading(false);
      }
    }
    fetchProject();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('确定要删除此项目吗？')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/entities/project/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      window.location.href = '/projects';
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除项目失败');
      setDeleting(false);
    }
  };

  if (loading) return <div className="text-gray-500">加载项目中...</div>;
  if (error || !project) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-200">{error || '未找到项目'}</p>
        <Link href="/projects" className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline">
          ← 返回项目列表
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{project.title}</h2>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                project.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {project.status}
              </span>
              {project.start_date && <span>开始：{project.start_date}</span>}
              {project.target_end_date && <span>目标结束：{project.target_end_date}</span>}
              <span>更新：{new Date(project.updated_at).toLocaleDateString()}</span>
            </div>
            {project.tags && project.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Link href={`/projects/${id}/edit`} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              编辑
            </Link>
            <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50">
              {deleting ? '删除中...' : '删除'}
            </button>
          </div>
        </div>
      </div>

      {project.current_phase && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">当前阶段</h3>
          <p className="text-gray-700 dark:text-gray-300">{project.current_phase}</p>
        </section>
      )}

      {project.milestones && project.milestones.length > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">里程碑</h3>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {project.milestones.map((milestone, i) => (
              <li key={i} className="py-2 flex items-center justify-between">
                <span className="text-gray-900 dark:text-white">{milestone.name}</span>
                <div className="flex items-center gap-2">
                  {milestone.date && <span className="text-sm text-gray-500 dark:text-gray-400">{milestone.date}</span>}
                  {milestone.completed && <span className="text-xs text-green-600 dark:text-green-400">已完成</span>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {project.resources && project.resources.length > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">资源</h3>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
            {project.resources.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </section>
      )}

      <MarkdownViewer entityType="project" id={id} />
      <BacklinksSection entityType="project" entityId={id} />

      <div className="flex gap-4">
        <Link href="/projects" className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
          ← 返回项目列表
        </Link>
      </div>
    </div>
  );
}
