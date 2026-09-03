import { Suspense } from 'react';
import { EvidenceClient } from './EvidenceClient';

export const dynamic = 'force-dynamic';

export default function EvidencePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Evidence
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Raw observations, experiments, and external signals
          </p>
        </div>
      </div>
      <Suspense fallback={<div className="text-gray-500">Loading evidence...</div>}>
        <EvidenceClient />
      </Suspense>
    </div>
  );
}
