'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Strategy {
  id: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
}

export function StrategyClient() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStrategies() {
      try {
        const res = await fetch('/api/entities/strategy');
        const data = await res.json();
        setStrategies(data);
      } catch (error) {
        console.error('Error fetching strategies:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStrategies();
  }, []);

  if (loading) {
    return <div className="text-gray-500">Loading strategy...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {strategies.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No strategies yet. Define your long-term direction.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {strategies.map((strategy) => (
              <li key={strategy.id}>
                <Link
                  href={`/strategy/${strategy.id}`}
                  className="block hover:bg-gray-50 dark:hover:bg-gray-700 p-6 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {strategy.title}
                      </h3>
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          strategy.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {strategy.status}
                        </span>
                        <span>
                          Updated: {new Date(strategy.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                      {strategy.tags && strategy.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {strategy.tags.map((tag) => (
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
    </div>
  );
}
