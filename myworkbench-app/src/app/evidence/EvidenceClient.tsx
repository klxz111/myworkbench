'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Evidence {
  id: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
}

const SOURCE_COLORS: Record<string, string> = {
  paper: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  news: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  policy: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  company: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  experiment: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  conversation: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  market: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  observation: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

export function EvidenceClient() {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvidence() {
      try {
        const res = await fetch('/api/entities/evidence');
        const data = await res.json();
        setEvidence(data);
      } catch (error) {
        console.error('Error fetching evidence:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchEvidence();
  }, []);

  if (loading) {
    return <div className="text-gray-500">Loading evidence...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {evidence.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          No evidence yet. Add observations, papers, or experiments.
        </div>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {evidence.map((item) => (
            <li key={item.id}>
              <Link
                href={`/evidence/${item.id}`}
                className="block hover:bg-gray-50 dark:hover:bg-gray-700 p-6 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {item.title}
                    </h3>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {item.status}
                      </span>
                      <span>
                        Updated: {new Date(item.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                    {item.tags && item.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
