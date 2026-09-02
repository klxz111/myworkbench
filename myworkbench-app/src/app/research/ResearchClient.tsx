'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Entity {
  id: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
}

export function ResearchClient() {
  const [research, setResearch] = useState<Entity[]>([]);
  const [evidence, setEvidence] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [researchRes, evidenceRes] = await Promise.all([
          fetch('/api/entities/research').then((r) => r.json()),
          fetch('/api/entities/evidence').then((r) => r.json()),
        ]);
        setResearch(researchRes);
        setEvidence(evidenceRes);
      } catch (error) {
        console.error('Error fetching research data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="text-gray-500">Loading research...</div>;
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Research Topics
          </h2>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {research.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No research topics yet.
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {research.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/research/${item.id}`}
                    className="block hover:bg-gray-50 dark:hover:bg-gray-700 p-6 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {item.title}
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {item.status}
                      </span>
                      <span>Updated: {new Date(item.updated_at).toLocaleDateString()}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Evidence
          </h2>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {evidence.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No evidence entries yet.
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {evidence.map((item) => (
                <li key={item.id}>
                  <div className="p-6">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {item.title}
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {item.status}
                      </span>
                      <span>Updated: {new Date(item.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
