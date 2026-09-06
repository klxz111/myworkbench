import { Suspense } from 'react';
import { FileTree } from '@/app/workspace/_components/FileTree';
import { RecentFiles } from '@/app/workspace/_components/RecentFiles';
import { NewFileDialog } from '@/app/workspace/_components/NewFileDialog';
import { PageHeader } from '@/components/ui';

export default function WorkspacePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="工作台"
        description="自由 Markdown 文档管理空间"
        actions={<NewFileDialog />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Suspense fallback={<div className="text-gray-500">加载文件树...</div>}>
            <FileTree />
          </Suspense>
        </div>
        <div className="lg:col-span-2">
          <Suspense fallback={<div className="text-gray-500">加载最近文件...</div>}>
            <RecentFiles />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
