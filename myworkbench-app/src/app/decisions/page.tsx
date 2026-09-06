import { Suspense } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui';
import { DecisionsClient } from './DecisionsClient';

export default function DecisionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="决策"
        description="记录决策并追踪证据与信念"
        actions={
          <Link href="/decisions/new" className="btn-primary">
            新建决策
          </Link>
        }
      />
      <Suspense fallback={<div className="text-gray-500">加载决策中...</div>}>
        <DecisionsClient />
      </Suspense>
    </div>
  );
}
