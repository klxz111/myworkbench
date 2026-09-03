import { Suspense } from 'react';
import { GraphClient } from './GraphClient';

export const dynamic = 'force-dynamic';

export default function GraphPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Evidence Chain
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Visualize connections between Evidence, Belief, Decision, and Project
          </p>
        </div>
      </div>
      <Suspense fallback={<div className="text-gray-500">Loading graph...</div>}>
        <GraphClient />
      </Suspense>
    </div>
  );
}
