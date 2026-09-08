'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DetailShell } from '@/components/DetailShell';

interface Organization {
  id: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
  created_at: string;
  content: string;
  industry?: string;
  location?: string;
  website?: string;
  linked_people?: string[];
  linked_opportunities?: string[];
}

interface OrganizationDetailProps {
  id: string;
}

export function OrganizationDetailClient({ id }: OrganizationDetailProps) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchOrganization() {
      try {
        const res = await fetch(`/api/entities/organization/${id}`);
        if (!res.ok) throw new Error('Organization not found');
        const data = await res.json();
        setOrganization(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载组织失败');
      } finally {
        setLoading(false);
      }
    }
    fetchOrganization();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('确定要删除此组织吗？')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/entities/organization/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      window.location.href = '/organizations';
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除组织失败');
      setDeleting(false);
    }
  };

  if (loading) return <div className="text-gray-500">加载组织中...</div>;
  if (error || !organization) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-200">{error || '未找到组织'}</p>
        <Link href="/organizations" className="mt-4 inline-block text-accent-600 dark:text-accent-400 hover:underline">
          ← 返回组织列表
        </Link>
      </div>
    );
  }

  return (
    <DetailShell entityType="organization" id={id} title={organization.title} status={organization.status}
      tags={organization.tags || []} created_at={organization.created_at || ''} updated_at={organization.updated_at}
      listPath="/organizations" editHref={`/organizations/${id}/edit`} onDelete={handleDelete} deleting={deleting}
      frontmatter={organization as unknown as Record<string, unknown>}>
      {(organization.linked_people && organization.linked_people.length > 0) && (
        <section className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">关联人员</h3>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {organization.linked_people.map((personId) => (
              <li key={personId}>
                <Link href={`/people/${personId}`} className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="font-medium text-accent-600 dark:text-accent-400">{personId}</div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(organization.linked_opportunities && organization.linked_opportunities.length > 0) && (
        <section className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">关联机会</h3>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {organization.linked_opportunities.map((oppId) => (
              <li key={oppId}>
                <Link href={`/opportunity/${oppId}`} className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="font-medium text-accent-600 dark:text-accent-400">{oppId}</div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </DetailShell>
  );
}
