import { Suspense } from 'react';
import Link from 'next/link';
import { ProfilesClient } from './ProfilesClient';

export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            个人档案
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            已编译的专业档案
          </p>
        </div>
        <Link
          href="/entities/profile/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          新建个人档案
        </Link>
      </div>
        <Suspense fallback={<div className="text-gray-500">加载档案中...</div>}>
        <ProfilesClient />
      </Suspense>
    </div>
  );
}
