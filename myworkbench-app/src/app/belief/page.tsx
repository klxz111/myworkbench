import { Suspense } from 'react';
import { BeliefClient } from './BeliefClient';

export const dynamic = 'force-dynamic';

export default function BeliefPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Beliefs
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Interpretations of evidence that inform decisions
          </p>
        </div>
      </div>
      <Suspense fallback={<div className="text-gray-500">Loading beliefs...</div>}>
        <BeliefClient />
      </Suspense>
    </div>
  );
}
