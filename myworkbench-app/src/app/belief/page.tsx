import { Suspense } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui';
import { BeliefClient } from './BeliefClient';

export const dynamic = 'force-dynamic';

export default function BeliefPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="信念"
        description="指导决策的证据解读"
        actions={<Link href="/belief/new" className="btn-primary">新建信念</Link>}
      />
        <Suspense fallback={<div className="text-gray-500">加载信念中...</div>}>
        <BeliefClient />
      </Suspense>
    </div>
  );
}
