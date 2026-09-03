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
            Opportunities
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            External opportunities that may change your path
          </p>
        </div>
        <Link
          href="/opportunity/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          New Opportunity
        </Link>
      </div>
      <Suspense fallback={<div className="text-gray-500">Loading opportunities...</div>}>
        <OpportunitiesClient />
      </Suspense>
    </div>
  );
}
