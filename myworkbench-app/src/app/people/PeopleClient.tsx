'use client';

import { useEffect, useState } from 'react';

interface Entity {
  id: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
}

export function PeopleClient() {
  const [people, setPeople] = useState<Entity[]>([]);
  const [organizations, setOrganizations] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [peopleRes, orgRes] = await Promise.all([
          fetch('/api/entities/person').then((r) => r.json()),
          fetch('/api/entities/organization').then((r) => r.json()),
        ]);
        setPeople(peopleRes);
        setOrganizations(orgRes);
      } catch (error) {
        console.error('Error fetching people:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="text-gray-500">Loading people...</div>;
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            People
          </h2>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {people.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No people entries yet.
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {people.map((person) => (
                <li key={person.id} className="p-6">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {person.title}
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        person.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {person.status}
                    </span>
                    <span>Updated: {new Date(person.updated_at).toLocaleDateString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Organizations
          </h2>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {organizations.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No organizations yet.
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {organizations.map((org) => (
                <li key={org.id} className="p-6">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {org.title}
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        org.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {org.status}
                    </span>
                    <span>Updated: {new Date(org.updated_at).toLocaleDateString()}</span>
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
