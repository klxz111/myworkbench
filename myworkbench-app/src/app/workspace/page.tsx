import { Suspense } from 'react';
import { FileTree } from '@/app/workspace/_components/FileTree';
import { RecentFiles } from '@/app/workspace/_components/RecentFiles';
import { NewFileDialog } from '@/app/workspace/_components/NewFileDialog';

export default function WorkspacePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            工作台
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            自由 Markdown 文档管理空间
          </p>
        </div>
        <NewFileDialog />
      </div>

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
