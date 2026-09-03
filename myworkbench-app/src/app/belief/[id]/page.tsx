import { Suspense } from 'react';
import { BeliefDetailClient } from './BeliefDetailClient';

export const dynamic = 'force-dynamic';

export default async function BeliefDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
        <BeliefDetailClient id={id} />
      </Suspense>
    </div>
  );
}
