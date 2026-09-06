'use client';

import { ReactNode } from 'react';

interface StatusTimelineProps {
  createdAt: string;
  updatedAt: string;
  status?: string;
  children?: ReactNode;
}

export function StatusTimeline({ createdAt, updatedAt, status, children }: StatusTimelineProps) {
  return (
    <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">状态与时间线</h3>
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500 dark:text-gray-400">状态：</span>
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            {status || '未知'}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
          <span>创建：{new Date(createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
          <span>更新：{new Date(updatedAt).toLocaleDateString()}</span>
        </div>
        {children}
      </div>
    </section>
  );
}
