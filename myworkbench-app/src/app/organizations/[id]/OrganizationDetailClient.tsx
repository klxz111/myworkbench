'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { BacklinksSection } from '@/components/BacklinksSection';

interface Organization {
  id: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
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
        <Link href="/organizations" className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline">
          ← 返回组织列表
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{organization.title}</h2>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                organization.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {organization.status}
              </span>
              {organization.industry && <span>行业：{organization.industry}</span>}
              {organization.location && <span>地点：{organization.location}</span>}
              {organization.website && <a href={organization.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">网站</a>}
              <span>更新：{new Date(organization.updated_at).toLocaleDateString()}</span>
            </div>
            {organization.tags && organization.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {organization.tags.map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Link href={`/organizations/${id}/edit`} className="btn-primary">
              编辑
            </Link>
            <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50">
              {deleting ? '删除中...' : '删除'}
            </button>
          </div>
        </div>
      </div>

      {(organization.linked_people && organization.linked_people.length > 0) && (
        <section className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">关联人员</h3>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {organization.linked_people.map((personId) => (
              <li key={personId}>
                <Link href={`/people/${personId}`} className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="font-medium text-blue-600 dark:text-blue-400">{personId}</div>
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
                  <div className="font-medium text-blue-600 dark:text-blue-400">{oppId}</div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <MarkdownViewer entityType="organization" id={id} />
      <BacklinksSection entityType="organization" entityId={id} />

      <div className="flex gap-4">
        <Link href="/organizations" className="btn-secondary">
          ← 返回组织列表
        </Link>
      </div>
    </div>
  );
}
