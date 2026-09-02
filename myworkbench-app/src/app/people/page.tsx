import { Suspense } from 'react';
import { PeopleClient } from './PeopleClient';

export const dynamic = 'force-dynamic';

export default function PeoplePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            People
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Network and relationships
          </p>
        </div>
      </div>
      <Suspense fallback={<div className="text-gray-500">Loading people...</div>}>
        <PeopleClient />
      </Suspense>
    </div>
  );
}
