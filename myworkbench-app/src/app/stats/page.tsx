import { StatsClient } from './StatsClient';

export default function StatsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">统计分析</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          实体构成、资本趋势、决策判定与活动热力
        </p>
      </div>
      <StatsClient />
    </div>
  );
}
