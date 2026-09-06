import { Suspense } from 'react';
import { ProfileDetailClient } from './ProfileDetailClient';

export const dynamic = 'force-dynamic';

export default async function ProfileDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-6">
        <Suspense fallback={<div className="text-gray-500">加载档案中...</div>}>
        <ProfileDetailClient id={id} />
      </Suspense>
    </div>
  );
}
