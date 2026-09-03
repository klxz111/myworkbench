import { Suspense } from 'react';
import { StrategyClient } from './StrategyClient';

export const dynamic = 'force-dynamic';

export default function StrategyPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Strategy
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Long-term direction, timeline, and strategic constraints
        </p>
      </div>
      <Suspense fallback={<div className="text-gray-500">Loading strategy...</div>}>
        <StrategyClient />
      </Suspense>
    </div>
  );
}
