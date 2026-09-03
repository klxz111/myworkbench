import { Suspense } from 'react';
import { EvidenceDetailClient } from './EvidenceDetailClient';

export const dynamic = 'force-dynamic';

export default async function EvidenceDetailPage({
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
            Evidence
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Evidence detail
          </p>
        </div>
      </div>
      <Suspense fallback={<div className="text-gray-500">Loading evidence...</div>}>
        <EvidenceDetailClient id={id} />
      </Suspense>
    </div>
  );
}
