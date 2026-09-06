import { Suspense } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui';
import { OpportunitiesClient } from './OpportunitiesClient';

export const dynamic = 'force-dynamic';

export default function OpportunityPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="机会"
        description="可能改变您道路的外部机会"
        actions={<Link href="/entities/opportunity/new" className="btn-primary">新建机会</Link>}
      />
        <Suspense fallback={<div className="text-gray-500">加载机会中...</div>}>
        <OpportunitiesClient />
      </Suspense>
    </div>
  );
}
