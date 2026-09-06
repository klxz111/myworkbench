import { DailyClient } from './DailyClient';

export default function DailyPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">每日笔记</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          每天一页：捕获想法、记录事件与决策
        </p>
      </div>
      <DailyClient />
    </div>
  );
}
