import { Suspense } from 'react';
import { RadarDetailClient } from './RadarDetailClient';

export const dynamic = 'force-dynamic';

export default async function RadarDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-6">
        <Suspense fallback={<div className="text-gray-500">加载雷达中...</div>}>
        <RadarDetailClient id={id} />
      </Suspense>
    </div>
  );
}
