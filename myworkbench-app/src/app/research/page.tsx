import { Suspense } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui';
import { ResearchClient } from './ResearchClient';

export const dynamic = 'force-dynamic';

export default function ResearchPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="研究"
        description="研究主题、身份与证据"
        actions={<Link href="/research/new" className="btn-primary">新建研究</Link>}
      />
        <Suspense fallback={<div className="text-gray-500">加载研究中...</div>}>
        <ResearchClient />
      </Suspense>
    </div>
  );
}
