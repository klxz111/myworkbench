'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { entityHref } from '@/lib/entity-paths';

interface Entity {
  id: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
}

interface Relation {
  from_id: string;
  to_id: string;
  relation: string;
  title: string;
  type: string;
  slug: string;
}

export function NetworkOverview() {
  const [people, setPeople] = useState<Entity[]>([]);
  const [organizations, setOrganizations] = useState<Entity[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [peopleRes, orgRes, relationsRes] = await Promise.all([
          fetch('/api/entities/person'),
          fetch('/api/entities/organization'),
          fetch('/api/relations'),
        ]);

        if (peopleRes.ok) {
          const data = await peopleRes.json();
          setPeople(data);
        }
        if (orgRes.ok) {
          const data = await orgRes.json();
          setOrganizations(data);
        }
        if (relationsRes.ok) {
          const data = await relationsRes.json();
          setRelations(data.relations || []);
        }
      } catch (error) {
        console.error('Error fetching network data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="text-gray-500">加载网络概览...</div>;
  }

  const recentRelations = relations.slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">人员</h2>
            <Link href="/people" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              查看全部 →
            </Link>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {people.length}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            活跃 {people.filter((p) => p.status === 'active').length} · 草稿 {people.filter((p) => p.status === 'draft').length}
          </p>
          {people.length > 0 && (
            <div className="mt-4 space-y-2">
              {people.slice(0, 5).map((person) => (
                <Link
                  key={person.id}
                  href={`/people/${person.id}`}
                  className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                >
                  <span className="truncate">{person.title}</span>
                  <span className="text-xs text-gray-400">{person.status}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">组织</h2>
            <Link href="/organizations" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              查看全部 →
            </Link>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {organizations.length}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            活跃 {organizations.filter((o) => o.status === 'active').length} · 草稿 {organizations.filter((o) => o.status === 'draft').length}
          </p>
          {organizations.length > 0 && (
            <div className="mt-4 space-y-2">
              {organizations.slice(0, 5).map((org) => (
                <Link
                  key={org.id}
                  href={`/organizations/${org.id}`}
                  className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                >
                  <span className="truncate">{org.title}</span>
                  <span className="text-xs text-gray-400">{org.status}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">最近关系</h2>
        {recentRelations.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            暂无关系。在实体详情页中添加关系。
          </p>
        ) : (
          <div className="space-y-3">
            {recentRelations.map((rel, index) => (
              <div
                key={`${rel.from_id}-${rel.to_id}-${rel.relation}-${index}`}
                className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {rel.title}
                </span>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase">
                  {rel.relation}
                </span>
                <span className="text-xs text-gray-400">→</span>
                <Link
                  href={entityHref(rel.type, rel.slug || rel.to_id)}
                  className="text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {rel.type}/{rel.slug || rel.to_id}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
