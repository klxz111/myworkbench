import { Suspense } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui';
import { CapitalClient } from './CapitalClient';

export const dynamic = 'force-dynamic';

export default function CapitalPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="资本"
        description="多维度资本追踪"
        actions={<Link href="/entities/capital/new" className="btn-primary">新建资本条目</Link>}
      />
        <Suspense fallback={<div className="text-gray-500">加载资本中...</div>}>
        <CapitalClient />
      </Suspense>
    </div>
  );
}
