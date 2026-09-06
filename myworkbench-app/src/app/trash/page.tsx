import { TrashClient } from './TrashClient';

export default function TrashPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">回收站</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          已删除的实体保留在 entities/.trash/ 中，可恢复或彻底删除
        </p>
      </div>
      <TrashClient />
    </div>
  );
}
