import { Suspense } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui';
import { ProjectsClient } from './ProjectsClient';

export const dynamic = 'force-dynamic';

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="项目"
        description="进行中与已完成的项目"
        actions={<Link href="/projects/new" className="btn-primary">新建项目</Link>}
      />
        <Suspense fallback={<div className="text-gray-500">加载项目中...</div>}>
        <ProjectsClient />
      </Suspense>
    </div>
  );
}
