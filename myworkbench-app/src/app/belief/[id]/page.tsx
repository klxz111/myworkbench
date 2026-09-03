import { Suspense } from 'react';
import { BeliefDetailClient } from './BeliefDetailClient';

export const dynamic = 'force-dynamic';

export default function BeliefDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Belief
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Belief detail
          </p>
        </div>
      </div>
      <Suspense fallback={<div className="text-gray-500">Loading belief...</div>}>
        <BeliefDetailClient id={params.id} />
      </Suspense>
    </div>
  );
}
