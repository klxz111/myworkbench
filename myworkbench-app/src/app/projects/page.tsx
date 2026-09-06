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
            项目
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            进行中与已完成的项目
          </p>
        </div>
        <Link
          href="/projects/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          新建项目
        </Link>
      </div>
        <Suspense fallback={<div className="text-gray-500">加载项目中...</div>}>
        <ProjectsClient />
      </Suspense>
    </div>
  );
}
