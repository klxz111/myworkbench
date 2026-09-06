import { TodayClient } from './TodayClient';

export default function TodayPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">今日</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            逾期、今日到期、未来安排与进行中的任务——每天从这里开始
          </p>
        </div>
        <a
          href="/calendar"
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
        >
          日历视图
        </a>
      </div>
      <TodayClient />
    </div>
  );
}
