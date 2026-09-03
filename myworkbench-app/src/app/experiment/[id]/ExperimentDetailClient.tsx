'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ExperimentDetail {
  id: string;
  title: string;
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  content: string;
  hypothesis?: string;
  setup?: string;
  configuration?: Record<string, unknown>;
  dataset?: string;
  hardware?: string[];
  result?: string;
  failure_mode?: string;
  interpretation?: string;
  follow_up?: string[];
}

export function ExperimentDetailClient({ id }: { id: string }) {
  const [experiment, setExperiment] = useState<ExperimentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchExperiment() {
      try {
        const res = await fetch(`/api/entities/experiment/${id}`);
        if (!res.ok) {
          throw new Error('Experiment not found');
        }
        const data = await res.json();
        setExperiment(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load experiment');
      } finally {
        setLoading(false);
      }
    }
    fetchExperiment();
  }, [id]);

  if (loading) {
    return <div className="text-gray-500">Loading experiment...</div>;
  }

  if (error || !experiment) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-200">{error || 'Experiment not found'}</p>
        <Link href="/experiment" className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline">
          ← Back to Experiments
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
              {experiment.title}
            </h2>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                experiment.status === 'active'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {experiment.status}
              </span>
              <span>Created: {new Date(experiment.created_at).toLocaleDateString()}</span>
              <span>Updated: {new Date(experiment.updated_at).toLocaleDateString()}</span>
            </div>
            {experiment.tags && experiment.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {experiment.tags.map((tag) => (
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
          <div className="flex gap-3">
            <Link
              href={`/entities/experiment/${id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Edit
            </Link>
            <Link
              href="/experiment"
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              ← Back
            </Link>
          </div>
        </div>
      </div>

      {experiment.hypothesis && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Hypothesis
          </h3>
          <p className="text-gray-700 dark:text-gray-300">{experiment.hypothesis}</p>
        </section>
      )}

      {experiment.setup && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Setup
          </h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{experiment.setup}</p>
        </section>
      )}

      {experiment.configuration && Object.keys(experiment.configuration).length > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Configuration
          </h3>
          <pre className="bg-gray-50 dark:bg-gray-900 rounded p-4 text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
            {JSON.stringify(experiment.configuration, null, 2)}
          </pre>
        </section>
      )}

      {experiment.hardware && experiment.hardware.length > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Hardware
          </h3>
          <div className="flex flex-wrap gap-2">
            {experiment.hardware.map((hw) => (
              <span
                key={hw}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
              >
                {hw}
              </span>
            ))}
          </div>
        </section>
      )}

      {experiment.result && (
        <section className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-200 mb-3">
            Result
          </h3>
          <p className="text-green-800 dark:text-green-300 whitespace-pre-wrap">{experiment.result}</p>
        </section>
      )}

      {experiment.failure_mode && (
        <section className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-3">
            Failure Mode
          </h3>
          <p className="text-red-800 dark:text-red-300">{experiment.failure_mode}</p>
        </section>
      )}

      {experiment.interpretation && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Interpretation
          </h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{experiment.interpretation}</p>
        </section>
      )}

      {experiment.follow_up && experiment.follow_up.length > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Follow-up
          </h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
            {experiment.follow_up.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {experiment.content && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Notes
          </h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{experiment.content}</p>
        </section>
      )}
    </div>
  );
}
