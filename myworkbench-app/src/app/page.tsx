import { Suspense } from 'react';
import { Navigation } from '@/components/Navigation';
import { HomeClient } from './HomeClient';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Where am I
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Strategic overview and recent changes
        </p>
      </div>
      <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
        <HomeClient />
      </Suspense>
    </div>
  );
}
