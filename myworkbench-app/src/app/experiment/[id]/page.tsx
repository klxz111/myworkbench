import { Suspense } from 'react';
import { ExperimentDetailClient } from './ExperimentDetailClient';

export const dynamic = 'force-dynamic';

export default async function ExperimentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-6">
        <Suspense fallback={<div className="text-gray-500">加载实验中...</div>}>
        <ExperimentDetailClient id={id} />
      </Suspense>
    </div>
  );
}
