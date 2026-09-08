'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { GraphClient } from './GraphClient';
import { KnowledgeClient } from '../knowledge/KnowledgeClient';
import { NetworkClient } from '../network/NetworkClient';

const TABS = [
  { key: 'chain', label: '证据链' },
  { key: 'knowledge', label: '知识树' },
  { key: 'talent', label: '人脉网' },
] as const;

type ViewKey = (typeof TABS)[number]['key'];

function isViewKey(v: string | null): v is ViewKey {
  return TABS.some((t) => t.key === v);
}

export function GraphHub() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const view: ViewKey = isViewKey(searchParams.get('view')) ? (searchParams.get('view') as ViewKey) : 'chain';

  const setView = (key: ViewKey) => {
    router.push(`/graph?view=${key}`, { scroll: false });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              view === tab.key
                ? 'border-accent-600 text-accent-600 dark:text-accent-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>
        {view === 'chain' && <GraphClient />}
        {view === 'knowledge' && <KnowledgeClient />}
        {view === 'talent' && <NetworkClient />}
      </div>
    </div>
  );
}