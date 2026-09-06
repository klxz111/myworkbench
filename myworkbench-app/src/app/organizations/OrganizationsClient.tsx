'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui';
import { useListControls, ListToolbar } from '@/components/ListControls';

interface Entity {
  id: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
}

interface OrganizationDetail {
  id: string;
  title: string;
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  content: string;
  industry?: string;
  location?: string;
  website?: string;
  linked_people?: string[];
  linked_opportunities?: string[];
}

export function OrganizationsClient() {
  const [organizations, setOrganizations] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/entities/organization');
        if (res.ok) {
          const data = await res.json();
          setOrganizations(data);
        }
      } catch (error) {
        console.error('Error fetching organizations:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filtered = filter === 'all' ? organizations : organizations.filter((o) => o.status === filter);
  const controls = useListControls(filtered);
  const activeCount = organizations.filter((o) => o.status === 'active').length;
  const draftCount = organizations.filter((o) => o.status === 'draft').length;

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此组织吗？')) return;
    try {
      const res = await fetch(`/api/entities/organization/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      setOrganizations(organizations.filter((o) => o.id !== id));
    } catch (error) {
      console.error('Error deleting organization:', error);
      alert('删除组织失败');
    }
  };

  if (loading) {
    return <div className="text-gray-500">加载组织中...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="组织"
        description="目标院校、实验室与机构档案"
        actions={<Link href="/organizations/new" className="btn-primary">新建组织</Link>}
      />
      <div className="flex items-center gap-2 card p-1 self-start">
          {[
            { key: 'all', label: `全部 (${organizations.length})` },
            { key: 'active', label: `活跃 (${activeCount})` },
            { key: 'draft', label: `草稿 (${draftCount})` },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                filter === item.key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {item.label}
            </button>
          ))}
      </div>

      {organizations.length > 0 && (
        <ListToolbar {...controls.toolbar} statuses={[]} placeholder="搜索组织名称 / 标签..." />
      )}

      <div className="card">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            暂无组织条目。
          </div>
        ) : controls.items.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            没有匹配当前搜索条件的组织条目。
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {controls.items.map((org) => (
              <li key={org.id}>
                <div className="flex items-center justify-between p-6">
                  <Link
                    href={`/organizations/${org.id}`}
                    className="flex-1 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {org.title}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              org.status === 'active'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {org.status}
                          </span>
                          <span>更新：{new Date(org.updated_at).toLocaleDateString()}</span>
                        </div>
                        {org.tags && org.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {org.tags.map((tag) => (
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
                  </Link>
                  <div className="flex gap-2 ml-4">
                    <Link
                      href={`/entities/organization/${org.id}/edit`}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      编辑
                    </Link>
                    <button
                      onClick={() => handleDelete(org.id)}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
