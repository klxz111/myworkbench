'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useListControls, ListToolbar } from '@/components/ListControls';
import { parseDateOnly } from '@/lib/date-utils';

interface Entity {
  id: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
  gate?: {
    review_date?: string;
    invalidate_if?: string;
    pivot_signals?: string[];
  } | null;
}

type GateStatus = 'no_review_date' | 'overdue' | 'upcoming' | 'scheduled';

function getGateStatus(gate?: { review_date?: string } | null): { status: GateStatus; label: string; color: string } {
  if (!gate?.review_date) {
    return { status: 'no_review_date', label: '未设置审核日期', color: 'text-gray-500' };
  }
  const reviewDate = parseDateOnly(gate.review_date);
  if (!reviewDate) {
    return { status: 'no_review_date', label: '未设置审核日期', color: 'text-gray-500' };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  reviewDate.setHours(0, 0, 0, 0);
  const diffDays = Math.round((reviewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return { status: 'overdue', label: `已逾期 ${Math.abs(diffDays)} 天`, color: 'text-red-600 dark:text-red-400' };
  }
  if (diffDays <= 7) {
    return { status: 'upcoming', label: `即将审核（${diffDays} 天后）`, color: 'text-amber-600 dark:text-amber-400' };
  }
  return { status: 'scheduled', label: `已安排（${diffDays} 天后）`, color: 'text-emerald-600 dark:text-emerald-400' };
}

export function DecisionsClient() {
  const [decisions, setDecisions] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDecisions() {
      try {
        const res = await fetch('/api/entities/decision');
        const data = await res.json();
        setDecisions(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching decisions:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchDecisions();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此决策吗？')) return;
    try {
      const res = await fetch(`/api/entities/decision/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      setDecisions(decisions.filter((d) => d.id !== id));
    } catch (error) {
      console.error('Error deleting decision:', error);
      alert('删除决策失败');
    }
  };

  const controls = useListControls(decisions);

  if (loading) {
    return <div className="text-gray-500">加载决策中...</div>;
  }

  return (
    <div>
      {decisions.length > 0 && (
        <ListToolbar {...controls.toolbar} placeholder="搜索决策标题 / 标签..." />
      )}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {decisions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
           暂无决策。创建您的第一个决策以开始。
         </div>
      ) : controls.items.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          没有匹配当前筛选条件的决策。
        </div>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {controls.items.map((decision) => {
            const gateStatus = getGateStatus(decision.gate);
            return (
            <li key={decision.id}>
              <div className="flex items-center justify-between p-6">
                <Link
                  href={`/decisions/${decision.id}`}
                  className="flex-1 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {decision.title}
                      </h3>
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          decision.status === 'active' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {decision.status}
                        </span>
                        <span>
                          更新：{new Date(decision.updated_at).toLocaleDateString()}
                        </span>
                        <span className={gateStatus.color}>
                          {gateStatus.label}
                        </span>
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
                </Link>
                <div className="flex gap-2 ml-4">
                  <Link
                    href={`/decisions/${decision.id}/edit`}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    编辑
                  </Link>
                  <button
                    onClick={() => handleDelete(decision.id)}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  >
                    删除
                  </button>
                </div>
              </div>
            </li>
          );
        })}
        </ul>
      )}
      </div>
    </div>
  );
}

