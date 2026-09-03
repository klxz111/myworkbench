import { Suspense } from 'react';
import Link from 'next/link';
import { RadarClient } from './RadarClient';

export const dynamic = 'force-dynamic';

export default function RadarPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Radar
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            External signals and strategic landscape changes
          </p>
        </div>
        <Link
          href="/radar/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          New Radar Entry
        </Link>
      </div>
      <Suspense fallback={<div className="text-gray-500">Loading radar...</div>}>
        <RadarClient />
      </Suspense>
    </div>
  );
}
