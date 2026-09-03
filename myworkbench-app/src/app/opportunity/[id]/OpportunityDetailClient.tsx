'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface OpportunityDetail {
  id: string;
  title: string;
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  content: string;
  category?: string;
  strategic_fit?: number;
  research_fit?: number;
  capital_gain?: string[];
  option_value?: string;
  cost?: string;
  risk?: string;
  timing?: string;
  required_preparation?: string[];
  deadline?: string;
}

export function OpportunityDetailClient({ id }: { id: string }) {
  const [opportunity, setOpportunity] = useState<OpportunityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOpportunity() {
      try {
        const res = await fetch(`/api/entities/opportunity/${id}`);
        if (!res.ok) {
          throw new Error('Opportunity not found');
        }
        const data = await res.json();
        setOpportunity(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load opportunity');
      } finally {
        setLoading(false);
      }
    }
    fetchOpportunity();
  }, [id]);

  if (loading) {
    return <div className="text-gray-500">Loading opportunity...</div>;
  }

  if (error || !opportunity) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-200">{error || 'Opportunity not found'}</p>
        <Link href="/opportunity" className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline">
          ← Back to Opportunities
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
              {opportunity.title}
            </h2>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                opportunity.status === 'active'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {opportunity.status}
              </span>
              {opportunity.category && (
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                  {opportunity.category}
                </span>
              )}
              <span>Created: {new Date(opportunity.created_at).toLocaleDateString()}</span>
              <span>Updated: {new Date(opportunity.updated_at).toLocaleDateString()}</span>
            </div>
            {opportunity.tags && opportunity.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {opportunity.tags.map((tag) => (
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
              href={`/entities/opportunity/${id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Edit
            </Link>
            <Link
              href="/opportunity"
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              ← Back
            </Link>
          </div>
        </div>
      </div>

      {opportunity.content && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Description
          </h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {opportunity.content}
          </p>
        </section>
      )}

      {(opportunity.strategic_fit !== undefined || opportunity.research_fit !== undefined) && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Assessment
          </h3>
          <div className="grid grid-cols-2 gap-6">
            {opportunity.strategic_fit !== undefined && (
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Strategic Fit</span>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(opportunity.strategic_fit / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {opportunity.strategic_fit}/10
                  </span>
                </div>
              </div>
            )}
            {opportunity.research_fit !== undefined && (
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Research Fit</span>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${(opportunity.research_fit / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {opportunity.research_fit}/10
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {opportunity.option_value && (
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Option Value
            </h3>
            <p className="text-gray-700 dark:text-gray-300">{opportunity.option_value}</p>
          </section>
        )}
        {opportunity.risk && (
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Risk
            </h3>
            <p className="text-gray-700 dark:text-gray-300">{opportunity.risk}</p>
          </section>
        )}
        {opportunity.cost && (
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Cost
            </h3>
            <p className="text-gray-700 dark:text-gray-300">{opportunity.cost}</p>
          </section>
        )}
        {opportunity.timing && (
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Timing
            </h3>
            <p className="text-gray-700 dark:text-gray-300">{opportunity.timing}</p>
          </section>
        )}
      </div>

      {opportunity.capital_gain && opportunity.capital_gain.length > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Capital Gain
          </h3>
          <div className="flex flex-wrap gap-2">
            {opportunity.capital_gain.map((gain) => (
              <span
                key={gain}
                className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm"
              >
                {gain}
              </span>
            ))}
          </div>
        </section>
      )}

      {opportunity.required_preparation && opportunity.required_preparation.length > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Required Preparation
          </h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
            {opportunity.required_preparation.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {opportunity.deadline && (
        <section className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
            Deadline
          </h3>
          <p className="text-yellow-800 dark:text-yellow-300">{opportunity.deadline}</p>
        </section>
      )}

      <div className="flex gap-4">
        <Link
          href="/opportunity"
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          ← Back to Opportunities
        </Link>
      </div>
    </div>
  );
}
