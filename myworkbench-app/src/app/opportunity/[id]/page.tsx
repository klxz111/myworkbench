import { Suspense } from 'react';
import { OpportunityDetailClient } from './OpportunityDetailClient';

export const dynamic = 'force-dynamic';

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <Suspense fallback={<div className="text-gray-500">Loading opportunity...</div>}>
        <OpportunityDetailClient id={id} />
      </Suspense>
    </div>
  );
}
