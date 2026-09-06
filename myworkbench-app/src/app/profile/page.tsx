import { Suspense } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui';
import { ProfilesClient } from './ProfilesClient';

export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="个人档案"
        description="已编译的专业档案"
        actions={<Link href="/entities/profile/new" className="btn-primary">新建个人档案</Link>}
      />
        <Suspense fallback={<div className="text-gray-500">加载档案中...</div>}>
        <ProfilesClient />
      </Suspense>
    </div>
  );
}
