import { Suspense } from 'react';
import { EvidenceDetailClient } from './EvidenceDetailClient';

export const dynamic = 'force-dynamic';

export default function EvidenceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Evidence
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Evidence detail
          </p>
        </div>
      </div>
      <Suspense fallback={<div className="text-gray-500">Loading evidence...</div>}>
        <EvidenceDetailClient id={params.id} />
      </Suspense>
    </div>
  );
}
