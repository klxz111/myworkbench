import { Suspense } from 'react';
import Link from 'next/link';
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
        <div className="flex gap-3">
          <Link
            href={`/entities/belief/${id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Edit
          </Link>
          <Link
            href="/belief"
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            ← Back
          </Link>
        </div>
      </div>
      <Suspense fallback={<div className="text-gray-500">Loading belief...</div>}>
        <BeliefDetailClient id={id} />
      </Suspense>
    </div>
  );
}
