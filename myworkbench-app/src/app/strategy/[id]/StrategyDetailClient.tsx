'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface StrategyDetail {
  id: string;
  title: string;
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  content: string;
  horizon?: string;
  objectives?: string[];
  constraints?: string[];
  key_results?: string[];
}

export function StrategyDetailClient({ id }: { id: string }) {
  const [strategy, setStrategy] = useState<StrategyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStrategy() {
      try {
        const res = await fetch(`/api/entities/strategy/${id}`);
        if (!res.ok) {
          throw new Error('Strategy not found');
        }
        const data = await res.json();
        setStrategy(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load strategy');
      } finally {
        setLoading(false);
      }
    }
    fetchStrategy();
  }, [id]);

  if (loading) {
    return <div className="text-gray-500">Loading strategy...</div>;
  }

  if (error || !strategy) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-200">{error || 'Strategy not found'}</p>
        <Link href="/strategy" className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline">
          ← Back to Strategy
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {strategy.title}
            </h2>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                strategy.status === 'active'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {strategy.status}
              </span>
              {strategy.horizon && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {strategy.horizon}
                </span>
              )}
              <span>Created: {new Date(strategy.created_at).toLocaleDateString()}</span>
              <span>Updated: {new Date(strategy.updated_at).toLocaleDateString()}</span>
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
      </div>

      {strategy.objectives && strategy.objectives.length > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Objectives
          </h3>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
            {strategy.objectives.map((obj, i) => (
              <li key={i}>{obj}</li>
            ))}
          </ul>
        </section>
      )}

      {strategy.constraints && strategy.constraints.length > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Constraints
          </h3>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
            {strategy.constraints.map((constraint, i) => (
              <li key={i}>{constraint}</li>
            ))}
          </ul>
        </section>
      )}

      {strategy.key_results && strategy.key_results.length > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Key Results
          </h3>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
            {strategy.key_results.map((result, i) => (
              <li key={i}>{result}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Content
        </h3>
        <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {strategy.content}
        </div>
      </section>

      <div className="flex gap-4">
        <Link
          href="/strategy"
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          ← Back to Strategy
        </Link>
      </div>
    </div>
  );
}
