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

export function OpportunityClient() {
  const [opportunities, setOpportunities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOpportunities() {
      try {
        const res = await fetch('/api/entities/opportunity');
        if (res.ok) {
          const data = await res.json();
          setOpportunities(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error fetching opportunities:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchOpportunities();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此机会吗？')) return;
    try {
      const res = await fetch(`/api/entities/opportunity/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      setOpportunities((prev) => prev.filter((o) => o.id !== id));
    } catch (error) {
      console.error('Error deleting opportunity:', error);
      alert('删除机会失败');
    }
  };

  if (loading) {
    return <div className="text-gray-500">加载机会中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">机会</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            潜在的研究、项目或投资机会
          </p>
        </div>
        <Link
          href="/entities/opportunity/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          新建机会
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {opportunities.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            暂无机会条目。点击上方按钮创建。
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {opportunities.map((opportunity) => (
              <li key={opportunity.id}>
                <div className="flex items-center justify-between p-6">
                  <Link
                    href={`/opportunity/${opportunity.id}`}
                    className="flex-1 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {opportunity.title}
                      </h3>
                      <div className="mt-1 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            opportunity.status === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : opportunity.status === 'draft'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {opportunity.status}
                        </span>
                        <span>更新：{new Date(opportunity.updated_at).toLocaleDateString()}</span>
                      </div>
                      {opportunity.tags && opportunity.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
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
                  </Link>
                  <div className="flex gap-2 ml-4">
                    <Link
                      href={`/entities/opportunity/${opportunity.id}/edit`}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      编辑
                    </Link>
                    <button
                      onClick={() => handleDelete(opportunity.id)}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
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
