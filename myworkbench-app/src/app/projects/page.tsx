import { Suspense } from 'react';
import Link from 'next/link';
import { ProjectsClient } from './ProjectsClient';

export const dynamic = 'force-dynamic';

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Projects
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Active and completed projects
          </p>
        </div>
        <Link
          href="/projects/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          New Project
        </Link>
      </div>
      <Suspense fallback={<div className="text-gray-500">Loading projects...</div>}>
        <ProjectsClient />
      </Suspense>
    </div>
  );
}
