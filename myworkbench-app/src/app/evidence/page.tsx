import { Suspense } from 'react';
import Link from 'next/link';
import { EvidenceClient } from './EvidenceClient';

export const dynamic = 'force-dynamic';

export default function EvidencePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            证据
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            原始观察、实验与外部信号
          </p>
        </div>
        <Link
          href="/evidence/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          新建证据
        </Link>
      </div>
        <Suspense fallback={<div className="text-gray-500">加载证据中...</div>}>
        <EvidenceClient />
      </Suspense>
    </div>
  );
}
