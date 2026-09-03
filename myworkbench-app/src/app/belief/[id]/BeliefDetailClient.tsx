'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface BeliefDetail {
  id: string;
  title: string;
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  content: string;
  description?: string;
  linked_evidence?: string[];
  linked_decisions?: string[];
  confidence?: string;
}

const CONFIDENCE_COLORS: Record<string, string> = {
  high: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  low: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export function BeliefDetailClient({ id }: { id: string }) {
  const [belief, setBelief] = useState<BeliefDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBelief() {
      try {
        const res = await fetch(`/api/entities/belief/${id}`);
        if (!res.ok) {
          throw new Error('Belief not found');
        }
        const data = await res.json();
        setBelief(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load belief');
      } finally {
        setLoading(false);
      }
    }
    fetchBelief();
  }, [id]);

  if (loading) {
    return <div className="text-gray-500">Loading belief...</div>;
  }

  if (error || !belief) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-200">{error || 'Belief not found'}</p>
        <Link href="/belief" className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline">
          ← Back to Beliefs
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
              {belief.title}
            </h2>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                belief.status === 'active'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {belief.status}
              </span>
              {belief.confidence && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${CONFIDENCE_COLORS[belief.confidence] || 'bg-gray-100 text-gray-800'}`}>
                  {belief.confidence} confidence
                </span>
              )}
              <span>Created: {new Date(belief.created_at).toLocaleDateString()}</span>
              <span>Updated: {new Date(belief.updated_at).toLocaleDateString()}</span>
            </div>
            {belief.tags && belief.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {belief.tags.map((tag) => (
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

      {belief.description && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Description
          </h3>
          <p className="text-gray-700 dark:text-gray-300">{belief.description}</p>
        </section>
      )}

      <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Content
        </h3>
        <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {belief.content}
        </div>
      </section>

      {belief.linked_evidence && belief.linked_evidence.length > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Linked Evidence
          </h3>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
            {belief.linked_evidence.map((evidenceId, index) => (
              <li key={index}>
                <Link
                  href={`/evidence/${evidenceId}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {evidenceId}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {belief.linked_decisions && belief.linked_decisions.length > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Linked Decisions
          </h3>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
            {belief.linked_decisions.map((decisionId, index) => (
              <li key={index}>
                <Link
                  href={`/decisions/${decisionId}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {decisionId}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex gap-4">
        <Link
          href="/belief"
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          ← Back to Beliefs
        </Link>
      </div>
    </div>
  );
}
