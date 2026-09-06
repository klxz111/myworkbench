import { NetworkClient } from './NetworkClient';

export default function NetworkPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          NETWORK
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          人员、组织与关系网络——申请硕博的版图视图
        </p>
      </div>
      <NetworkClient />
    </div>
  );
}
