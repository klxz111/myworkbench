'use client';

import { useEffect, useState } from 'react';
import { NetworkOverview } from './_components/NetworkOverview';
import { NetworkGraph } from './_components/NetworkGraph';

type ViewMode = 'overview' | 'graph';

const VIEW_KEY = 'mwbench_network_view';

export function NetworkClient() {
  const [view, setView] = useState<ViewMode>('overview');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(VIEW_KEY);
    if (stored === 'graph' || stored === 'overview') setView(stored);
    setMounted(true);
  }, []);

  const switchView = (v: ViewMode) => {
    setView(v);
    localStorage.setItem(VIEW_KEY, v);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {(
          [
            { key: 'overview', label: '概览列表' },
            { key: 'graph', label: '点状网' },
          ] as { key: ViewMode; label: string }[]
        ).map((item) => (
          <button
            key={item.key}
            onClick={() => switchView(item.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              view === item.key
                ? 'bg-accent-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {mounted && (view === 'graph' ? <NetworkGraph /> : <NetworkOverview />)}
    </div>
  );
}
