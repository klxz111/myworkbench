'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DetailShell } from '@/components/DetailShell';

interface Project {
  id: string;
  title: string;
  status: string;
  tags: string[];
  created_at: string;
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
        <Link href="/projects" className="mt-4 inline-block text-accent-600 dark:text-accent-400 hover:underline">
          ← 返回项目列表
        </Link>
      </div>
    );
  }

  return (
    <DetailShell
      entityType="project"
      id={id}
      title={project.title}
      status={project.status}
      tags={project.tags || []}
      created_at={project.created_at}
      updated_at={project.updated_at}
      listPath="/projects"
      editHref={`/entities/project/${id}/edit`}
      onDelete={handleDelete}
      deleting={deleting}
      frontmatter={project as unknown as Record<string, unknown>}
    >
      {project.current_phase && (
        <section className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">当前阶段</h3>
          <p className="text-gray-700 dark:text-gray-300">{project.current_phase}</p>
        </section>
      )}

      {project.milestones && project.milestones.length > 0 && (
        <section className="card p-6">
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
        <section className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">资源</h3>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
            {project.resources.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </section>
      )}
    </DetailShell>
  );
}
