import { Suspense } from 'react';
import { NetworkOverview } from './_components/NetworkOverview';

export default function NetworkPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          NETWORK
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          人员、组织与关系网络
        </p>
      </div>
      <Suspense fallback={<div className="text-gray-500">加载网络概览...</div>}>
        <NetworkOverview />
      </Suspense>
    </div>
  );
}
