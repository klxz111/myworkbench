import { Suspense } from 'react';
import Link from 'next/link';
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
        <Link
          href="/evidence/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          New Evidence
        </Link>
      </div>
      <Suspense fallback={<div className="text-gray-500">Loading evidence...</div>}>
        <EvidenceClient />
      </Suspense>
    </div>
  );
}
