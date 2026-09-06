import { CalendarClient } from './CalendarClient';

export default function CalendarPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">日历</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          任务截止、门控审核、人脉跟进、机会截止与事件的统一时间视图
        </p>
      </div>
      <CalendarClient />
    </div>
  );
}
