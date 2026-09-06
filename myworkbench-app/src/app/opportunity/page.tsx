import { Suspense } from 'react';
import Link from 'next/link';
import { OpportunitiesClient } from './OpportunitiesClient';

export const dynamic = 'force-dynamic';

export default function OpportunityPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            机会
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            可能改变您道路的外部机会
          </p>
        </div>
        <Link
          href="/entities/opportunity/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          新建机会
        </Link>
      </div>
        <Suspense fallback={<div className="text-gray-500">加载机会中...</div>}>
        <OpportunitiesClient />
      </Suspense>
    </div>
  );
}
