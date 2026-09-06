import { Suspense } from 'react';
import Link from 'next/link';
import { CapitalClient } from './CapitalClient';

export const dynamic = 'force-dynamic';

export default function CapitalPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            资本
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            多维度资本追踪
          </p>
        </div>
        <Link
          href="/entities/capital/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          新建资本条目
        </Link>
      </div>
        <Suspense fallback={<div className="text-gray-500">加载资本中...</div>}>
        <CapitalClient />
      </Suspense>
    </div>
  );
}
