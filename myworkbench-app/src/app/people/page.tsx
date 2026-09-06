import { Suspense } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui';
import { PeopleClient } from './PeopleClient';

export const dynamic = 'force-dynamic';

export default function PeoplePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="人员"
        description="人脉与关系"
        actions={<Link href="/entities/person/new" className="btn-primary">新建人员</Link>}
      />
        <Suspense fallback={<div className="text-gray-500">加载人员中...</div>}>
        <PeopleClient />
      </Suspense>
    </div>
  );
}
