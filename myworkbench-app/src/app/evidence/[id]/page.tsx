import { Suspense } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui';
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
            <PageHeader
        title="证据"
        description="证据详情"
        actions={<Link href="/evidence" className="btn-secondary">← 返回</Link>}
      />
        <Suspense fallback={<div className="text-gray-500">加载证据中...</div>}>
        <EvidenceDetailClient id={id} />
      </Suspense>
    </div>
  );
}
