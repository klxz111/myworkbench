import { Suspense } from 'react';
import { StrategyDetailClient } from './StrategyDetailClient';

export const dynamic = 'force-dynamic';

export default function StrategyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Strategy
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Strategy detail
          </p>
        </div>
      </div>
      <Suspense fallback={<div className="text-gray-500">Loading strategy...</div>}>
        <StrategyDetailClient id={params.id} />
      </Suspense>
    </div>
  );
}
