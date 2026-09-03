'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface EvidenceDetail {
  id: string;
  title: string;
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  content: string;
  source_type?: string;
  source_url?: string;
  date?: string;
  summary?: string;
  strength?: string;
  linked_beliefs?: string[];
}

const STRENGTH_COLORS: Record<string, string> = {
  strong: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  moderate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  weak: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export function EvidenceDetailClient({ id }: { id: string }) {
  const [evidence, setEvidence] = useState<EvidenceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvidence() {
      try {
        const res = await fetch(`/api/entities/evidence/${id}`);
        if (!res.ok) {
          throw new Error('Evidence not found');
        }
        const data = await res.json();
        setEvidence(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load evidence');
      } finally {
        setLoading(false);
      }
    }
    fetchEvidence();
  }, [id]);

  if (loading) {
    return <div className="text-gray-500">Loading evidence...</div>;
  }

  if (error || !evidence) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-200">{error || 'Evidence not found'}</p>
        <Link href="/evidence" className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline">
          ← Back to Evidence
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
              {evidence.title}
            </h2>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                evidence.status === 'active'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {evidence.status}
              </span>
              {evidence.source_type && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                  {evidence.source_type}
                </span>
              )}
              {evidence.strength && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${STRENGTH_COLORS[evidence.strength] || 'bg-gray-100 text-gray-800'}`}>
                  {evidence.strength}
                </span>
              )}
              <span>Created: {new Date(evidence.created_at).toLocaleDateString()}</span>
              <span>Updated: {new Date(evidence.updated_at).toLocaleDateString()}</span>
            </div>
            {evidence.tags && evidence.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {evidence.tags.map((tag) => (
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

      {evidence.summary && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Summary
          </h3>
          <p className="text-gray-700 dark:text-gray-300">{evidence.summary}</p>
        </section>
      )}

      {evidence.date && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Date
          </h3>
          <p className="text-gray-700 dark:text-gray-300">{evidence.date}</p>
        </section>
      )}

      {evidence.source_url && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Source URL
          </h3>
          <a
            href={evidence.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline break-all"
          >
            {evidence.source_url}
          </a>
        </section>
      )}

      <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Content
        </h3>
        <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {evidence.content}
        </div>
      </section>

      {evidence.linked_beliefs && evidence.linked_beliefs.length > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Linked Beliefs
          </h3>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
            {evidence.linked_beliefs.map((beliefId, index) => (
              <li key={index}>
                <Link
                  href={`/belief/${beliefId}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {beliefId}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex gap-4">
        <Link
          href="/evidence"
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          ← Back to Evidence
        </Link>
      </div>
    </div>
  );
}
