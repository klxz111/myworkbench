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

export function HomeClient() {
  const [recentDecisions, setRecentDecisions] = useState<Entity[]>([]);
  const [recentResearch, setRecentResearch] = useState<Entity[]>([]);
  const [recentProjects, setRecentProjects] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [decisions, research, projects] = await Promise.all([
          fetch('/api/entities/decision').then((r) => r.json()),
          fetch('/api/entities/research').then((r) => r.json()),
          fetch('/api/entities/project').then((r) => r.json()),
        ]);
        setRecentDecisions(decisions.slice(0, 5));
        setRecentResearch(research.slice(0, 5));
        setRecentProjects(projects.slice(0, 5));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="text-gray-500">Loading dashboard...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Active Decisions
          </h2>
          <Link
            href="/decisions"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          {recentDecisions.length === 0 ? (
            <p className="text-gray-500 text-sm">No decisions yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentDecisions.map((decision) => (
                <li key={decision.id}>
                  <Link
                    href={`/decisions/${decision.id}`}
                    className="block hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md p-2 -mx-2 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {decision.title}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Updated: {new Date(decision.updated_at).toLocaleDateString()}
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
            Current Projects
          </h2>
          <Link
            href="/projects"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          {recentProjects.length === 0 ? (
            <p className="text-gray-500 text-sm">No projects yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentProjects.map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.id}`}
                    className="block hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md p-2 -mx-2 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {project.title}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Status: {project.status} · Updated:{' '}
                      {new Date(project.updated_at).toLocaleDateString()}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="space-y-4 lg:col-span-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Recent Research
          </h2>
          <Link
            href="/research"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          {recentResearch.length === 0 ? (
            <p className="text-gray-500 text-sm">No research entries yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentResearch.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/research/${item.id}`}
                    className="block hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md p-2 -mx-2 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {item.title}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Updated: {new Date(item.updated_at).toLocaleDateString()}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
