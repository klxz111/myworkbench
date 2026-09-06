import { Suspense } from 'react';
import { CapitalDetailClient } from './CapitalDetailClient';

export const dynamic = 'force-dynamic';

export default async function CapitalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-6">
        <Suspense fallback={<div className="text-gray-500">加载资本中...</div>}>
        <CapitalDetailClient id={id} />
      </Suspense>
    </div>
  );
}
