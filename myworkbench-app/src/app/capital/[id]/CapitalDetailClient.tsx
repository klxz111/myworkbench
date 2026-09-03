'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface CapitalDetail {
  id: string;
  title: string;
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  content: string;
  period_start?: string;
  period_end?: string;
  entries?: Array<{
    category: string;
    amount?: number;
    description?: string;
    source?: string;
  }>;
  total_score?: number;
}

export function CapitalDetailClient({ id }: { id: string }) {
  const [capital, setCapital] = useState<CapitalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCapital() {
      try {
        const res = await fetch(`/api/entities/capital/${id}`);
        if (!res.ok) {
          throw new Error('Capital entry not found');
        }
        const data = await res.json();
        setCapital(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load capital');
      } finally {
        setLoading(false);
      }
    }
    fetchCapital();
  }, [id]);

  if (loading) {
    return <div className="text-gray-500">Loading capital...</div>;
  }

  if (error || !capital) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-200">{error || 'Capital entry not found'}</p>
        <Link href="/capital" className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline">
          ← Back to Capital
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
              {capital.title}
            </h2>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                capital.status === 'active'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {capital.status}
              </span>
              {capital.period_start && (
                <span>{capital.period_start} - {capital.period_end || 'Present'}</span>
              )}
              <span>Updated: {new Date(capital.updated_at).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/entities/capital/${id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Edit
            </Link>
            <Link
              href="/capital"
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              ← Back
            </Link>
          </div>
        </div>
      </div>

      {capital.entries && capital.entries.length > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Capital Entries
          </h3>
          <div className="space-y-4">
            {capital.entries.map((entry, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-medium capitalize">
                      {entry.category}
                    </span>
                    {entry.amount !== undefined && (
                      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                        {entry.amount}
                      </p>
                    )}
                    {entry.description && (
                      <p className="mt-2 text-gray-700 dark:text-gray-300">{entry.description}</p>
                    )}
                    {entry.source && (
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Source: {entry.source}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {capital.total_score !== undefined && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">Total Score</span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{capital.total_score}</span>
              </div>
            </div>
          )}
        </section>
      )}

      {capital.content && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Notes
          </h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{capital.content}</p>
        </section>
      )}
    </div>
  );
}
