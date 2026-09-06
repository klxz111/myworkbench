import { Suspense } from 'react';
import Link from 'next/link';
import { BeliefClient } from './BeliefClient';

export const dynamic = 'force-dynamic';

export default function BeliefPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            信念
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            指导决策的证据解读
          </p>
        </div>
        <Link
          href="/belief/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          新建信念
        </Link>
      </div>
        <Suspense fallback={<div className="text-gray-500">加载信念中...</div>}>
        <BeliefClient />
      </Suspense>
    </div>
  );
}
