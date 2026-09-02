'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Decision {
  id: string;
  title: string;
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  content: string;
  context?: string;
  question?: string;
  options?: Array<{ label: string; pros: string[]; cons: string[] }>;
  evidence?: string[];
  current_belief?: string;
  decision?: string;
  expected_outcome?: string;
  gate?: {
    invalidate_if?: string;
    review_date?: string;
    pivot_signals?: string[];
  };
  actual_result?: string;
  belief_update?: string;
}

interface DecisionDetailProps {
  id: string;
}

export function DecisionDetailClient({ id }: DecisionDetailProps) {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDecision() {
      try {
        const res = await fetch(`/api/entities/decision/${id}`);
        if (!res.ok) {
          throw new Error('Decision not found');
        }
        const data = await res.json();
        setDecision(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load decision');
      } finally {
        setLoading(false);
      }
    }
    fetchDecision();
  }, [id]);

  if (loading) {
    return <div className="text-gray-500">Loading decision...</div>;
  }

  if (error || !decision) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-200">{error || 'Decision not found'}</p>
        <Link href="/decisions" className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline">
          ← Back to Decisions
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
              {decision.title}
            </h2>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                decision.status === 'active'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {decision.status}
              </span>
              <span>Created: {new Date(decision.created_at).toLocaleDateString()}</span>
              <span>Updated: {new Date(decision.updated_at).toLocaleDateString()}</span>
            </div>
            {decision.tags && decision.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {decision.tags.map((tag) => (
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

      {decision.context && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Context
          </h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {decision.context}
          </p>
        </section>
      )}

      {decision.question && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Question
          </h3>
          <p className="text-gray-700 dark:text-gray-300">{decision.question}</p>
        </section>
      )}

      {decision.options && decision.options.length > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Options
          </h3>
          <div className="space-y-4">
            {decision.options.map((option, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white">{option.label}</h4>
                <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-green-600 dark:text-green-400 font-medium">Pros:</span>
                    <ul className="mt-1 list-disc list-inside text-gray-700 dark:text-gray-300">
                      {option.pros.map((pro, i) => (
                        <li key={i}>{pro}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="text-red-600 dark:text-red-400 font-medium">Cons:</span>
                    <ul className="mt-1 list-disc list-inside text-gray-700 dark:text-gray-300">
                      {option.cons.map((con, i) => (
                        <li key={i}>{con}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {decision.current_belief && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Current Belief
          </h3>
          <p className="text-gray-700 dark:text-gray-300">{decision.current_belief}</p>
        </section>
      )}

      {decision.decision && (
        <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-3">
            Decision
          </h3>
          <p className="text-blue-800 dark:text-blue-300">{decision.decision}</p>
        </section>
      )}

      {decision.gate && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Gate
          </h3>
          <div className="space-y-2 text-sm">
            {decision.gate.invalidate_if && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Invalidate if:</span>
                <p className="text-gray-600 dark:text-gray-400">{decision.gate.invalidate_if}</p>
              </div>
            )}
            {decision.gate.review_date && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Review Date:</span>
                <p className="text-gray-600 dark:text-gray-400">{decision.gate.review_date}</p>
              </div>
            )}
            {decision.gate.pivot_signals && decision.gate.pivot_signals.length > 0 && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Pivot Signals:</span>
                <ul className="mt-1 list-disc list-inside text-gray-600 dark:text-gray-400">
                  {decision.gate.pivot_signals.map((signal, i) => (
                    <li key={i}>{signal}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {decision.actual_result && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Actual Result
          </h3>
          <p className="text-gray-700 dark:text-gray-300">{decision.actual_result}</p>
        </section>
      )}

      {decision.belief_update && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Belief Update
          </h3>
          <p className="text-gray-700 dark:text-gray-300">{decision.belief_update}</p>
        </section>
      )}

      <div className="flex gap-4">
        <Link
          href="/decisions"
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          ← Back to Decisions
        </Link>
      </div>
    </div>
  );
}
