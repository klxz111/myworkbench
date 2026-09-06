import { Suspense } from 'react';
import Link from 'next/link';
import { ResearchClient } from './ResearchClient';

export const dynamic = 'force-dynamic';

export default function ResearchPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            研究
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            研究主题、身份与证据
          </p>
        </div>
        <Link
          href="/research/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          新建研究
        </Link>
      </div>
        <Suspense fallback={<div className="text-gray-500">加载研究中...</div>}>
        <ResearchClient />
      </Suspense>
    </div>
  );
}
