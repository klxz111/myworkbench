import { Suspense } from 'react';
import Link from 'next/link';
import { ExperimentsClient } from './ExperimentsClient';

export const dynamic = 'force-dynamic';

export default function ExperimentPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            实验
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            研究实验及其结果
          </p>
        </div>
        <Link
          href="/entities/experiment/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          新建实验
        </Link>
      </div>
        <Suspense fallback={<div className="text-gray-500">加载实验中...</div>}>
        <ExperimentsClient />
      </Suspense>
    </div>
  );
}
