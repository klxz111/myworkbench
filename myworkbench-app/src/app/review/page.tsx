import { ReviewClient } from './ReviewClient';

export default function ReviewPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">每周回顾</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          本周发生了什么、哪些判断被验证、下周需要关注什么
        </p>
      </div>
      <ReviewClient />
    </div>
  );
}
