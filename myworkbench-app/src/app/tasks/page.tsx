import { TasksClient } from './TasksClient';

export default function TasksPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">任务</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            追踪下一步行动：待办、进行中与已完成
          </p>
        </div>
        <a
          href="/entities/task/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          新建任务
        </a>
      </div>
      <TasksClient />
    </div>
  );
}
