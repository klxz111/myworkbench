'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { RelationsSection } from '@/components/RelationsSection';
import { BacklinksSection } from '@/components/BacklinksSection';
import { StatusTimeline } from '@/components/StatusTimeline';
import { ResultFeedbackPanel } from './ResultFeedbackPanel';
import { parseDateOnly } from '@/lib/date-utils';

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
  verdict?: string;
  result_recorded_at?: string;
}

interface DecisionDetailProps {
  id: string;
}

type GateStatus = 'no_review_date' | 'overdue' | 'upcoming' | 'scheduled';

function getGateStatus(gate?: { review_date?: string } | null): { status: GateStatus; label: string; color: string; diffDays?: number } {
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

export function DecisionDetailClient({ id }: DecisionDetailProps) {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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
        setError(err instanceof Error ? err.message : '加载决策失败');
      } finally {
        setLoading(false);
      }
    }
    fetchDecision();
  }, [id, refreshKey]);

  const handleDelete = async () => {
    if (!confirm('确定要删除此决策吗？')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/entities/decision/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      window.location.href = '/decisions';
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除决策失败');
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">加载决策中...</div>;
  }

  if (error || !decision) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-200">{error || '未找到决策'}</p>
        <Link href="/decisions" className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline">
          ← 返回决策列表
        </Link>
      </div>
    );
  }

  const gateStatus = getGateStatus(decision.gate);

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
              <span>创建：{new Date(decision.created_at).toLocaleDateString()}</span>
              <span>更新：{new Date(decision.updated_at).toLocaleDateString()}</span>
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
          <div className="flex gap-3">
            <Link
              href={`/decisions/${id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              编辑
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            >
              {deleting ? '删除中...' : '删除'}
            </button>
          </div>
        </div>
      </div>

      {decision.gate && (
        <section className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 ${
          gateStatus.status === 'overdue' ? 'border-red-500' :
          gateStatus.status === 'upcoming' ? 'border-amber-500' :
          'border-emerald-500'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              门控状态
            </h3>
            <span className={`text-sm font-medium ${gateStatus.color}`}>
              {gateStatus.label}
            </span>
          </div>
          <div className="space-y-2 text-sm">
            {decision.gate.invalidate_if && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">失效条件：</span>
                <p className="text-gray-600 dark:text-gray-400">{decision.gate.invalidate_if}</p>
              </div>
            )}
            {decision.gate.review_date && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">审核日期：</span>
                <p className="text-gray-600 dark:text-gray-400">{new Date(decision.gate.review_date).toLocaleDateString()}</p>
              </div>
            )}
            {decision.gate.pivot_signals && decision.gate.pivot_signals.length > 0 && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">转向信号：</span>
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

      {decision.context && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            背景
          </h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {decision.context}
          </p>
        </section>
      )}

      {decision.question && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            问题
          </h3>
          <p className="text-gray-700 dark:text-gray-300">{decision.question}</p>
        </section>
      )}

      {decision.options && decision.options.length > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            选项
          </h3>
          <div className="space-y-4">
            {decision.options.map((option, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white">{option.label}</h4>
                <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                  <div>
                     <span className="text-green-600 dark:text-green-400 font-medium">优点：</span>
                    <ul className="mt-1 list-disc list-inside text-gray-700 dark:text-gray-300">
                      {option.pros.map((pro, i) => (
                        <li key={i}>{pro}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                     <span className="text-red-600 dark:text-red-400 font-medium">缺点：</span>
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
            当前信念
          </h3>
          <p className="text-gray-700 dark:text-gray-300">{decision.current_belief}</p>
        </section>
      )}

      {decision.decision && (
        <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-3">
            决策
          </h3>
          <p className="text-blue-800 dark:text-blue-300">{decision.decision}</p>
        </section>
      )}

      {decision.actual_result && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            实际结果
          </h3>
          <p className="text-gray-700 dark:text-gray-300">{decision.actual_result}</p>
        </section>
      )}

      {decision.belief_update && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            信念更新
          </h3>
          <p className="text-gray-700 dark:text-gray-300">{decision.belief_update}</p>
        </section>
      )}

      <ResultFeedbackPanel
        decisionId={id}
        decisionTitle={decision.title}
        actualResult={decision.actual_result}
        beliefUpdate={decision.belief_update}
        verdict={decision.verdict}
        onRecorded={() => setRefreshKey((k) => k + 1)}
      />

      <StatusTimeline createdAt={decision.created_at} updatedAt={decision.updated_at} status={decision.status} />

      <RelationsSection entityId={id} entityType="decision" />
      <BacklinksSection entityType="decision" entityId={id} />

      <MarkdownViewer entityType="decision" id={id} />

      <div className="flex gap-4">
        <Link
          href="/decisions"
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          ← 返回决策列表
        </Link>
      </div>
    </div>
  );
}
