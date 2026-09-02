'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Entity {
  id: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
}

export function ProjectsClient() {
  const [projects, setProjects] = useState<Entity[]>([]);
  const [experiments, setExperiments] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [projectsRes, experimentsRes] = await Promise.all([
          fetch('/api/entities/project').then((r) => r.json()),
          fetch('/api/entities/experiment').then((r) => r.json()),
        ]);
        setProjects(projectsRes);
        setExperiments(experimentsRes);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="text-gray-500">Loading projects...</div>;
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Projects
          </h2>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {projects.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No projects yet.
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {projects.map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.id}`}
                    className="block hover:bg-gray-50 dark:hover:bg-gray-700 p-6 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {project.title}
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          project.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : project.status === 'completed'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {project.status}
                      </span>
                      <span>Updated: {new Date(project.updated_at).toLocaleDateString()}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Experiments
          </h2>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {experiments.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No experiments yet.
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {experiments.map((exp) => (
                <li key={exp.id}>
                  <div className="p-6">
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
                      <span>Updated: {new Date(exp.updated_at).toLocaleDateString()}</span>
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
