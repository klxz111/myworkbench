'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DetailShell } from '@/components/DetailShell';
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

  // 门控行内编辑：review_date 驱动日历/今日/通知，此前只能手改 md 文件
  const [gateEditing, setGateEditing] = useState(false);
  const [gateForm, setGateForm] = useState({ review_date: '', invalidate_if: '', pivot_signals: '' });
  const [gateSaving, setGateSaving] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);

  const startGateEdit = () => {
    setGateForm({
      review_date: decision?.gate?.review_date ?? '',
      invalidate_if: decision?.gate?.invalidate_if ?? '',
      pivot_signals: (decision?.gate?.pivot_signals || []).join(', '),
    });
    setGateError(null);
    setGateEditing(true);
  };

  const saveGate = async () => {
    if (!decision) return;
    setGateSaving(true);
    setGateError(null);
    try {
      const invalidate = gateForm.invalidate_if.trim();
      const signals = gateForm.pivot_signals.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
      // 三项全空视为移除门控；否则在原 gate 基础上合并，保留手工维护的其他子字段
      const hasContent = Boolean(gateForm.review_date || invalidate || signals.length > 0);
      const gate = hasContent
        ? {
            ...(decision.gate || {}),
            review_date: gateForm.review_date || undefined,
            invalidate_if: invalidate || undefined,
            pivot_signals: signals.length > 0 ? signals : undefined,
          }
        : null;
      const res = await fetch(`/api/entities/decision/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { gate } }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || '保存失败');
      }
      setGateEditing(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setGateError(err instanceof Error ? err.message : '保存门控失败');
    } finally {
      setGateSaving(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">加载决策中...</div>;
  }

  if (error || !decision) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-200">{error || '未找到决策'}</p>
        <Link href="/decisions" className="mt-4 inline-block text-accent-600 dark:text-accent-400 hover:underline">
          ← 返回决策列表
        </Link>
      </div>
    );
  }

  const gateStatus = getGateStatus(decision.gate);

  return (
    <DetailShell
      entityType="decision"
      id={id}
      title={decision.title}
      status={decision.status}
      tags={decision.tags || []}
      created_at={decision.created_at}
      updated_at={decision.updated_at}
      listPath="/decisions"
      editHref={`/decisions/${id}/edit`}
      onDelete={handleDelete}
      deleting={deleting}
      frontmatter={decision as unknown as Record<string, unknown>}
    >
      {/* 门控区块恒渲染：无门控时提供「设置门控」入口（review_date 驱动日历/今日/通知） */}
      <section className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 ${
        !decision.gate ? 'border-gray-300 dark:border-gray-600' :
        gateStatus.status === 'overdue' ? 'border-red-500' :
        gateStatus.status === 'upcoming' ? 'border-amber-500' :
        'border-emerald-500'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            门控状态
          </h3>
          <div className="flex items-center gap-3">
            {!gateEditing && (
              <span className={`text-sm font-medium ${gateStatus.color}`}>
                {gateStatus.label}
              </span>
            )}
            {!gateEditing && (
              <button
                onClick={startGateEdit}
                className="px-2.5 py-1 rounded-lg border border-gray-300 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {decision.gate ? '编辑门控' : '设置门控'}
              </button>
            )}
          </div>
        </div>

        {gateEditing ? (
          <form onSubmit={(e) => { e.preventDefault(); saveGate(); }} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">审核日期（驱动日历「门控审核」与到期提醒）</label>
              <input
                type="date"
                value={gateForm.review_date}
                onChange={(e) => setGateForm({ ...gateForm, review_date: e.target.value })}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">失效条件</label>
              <textarea
                rows={2}
                value={gateForm.invalidate_if}
                onChange={(e) => setGateForm({ ...gateForm, invalidate_if: e.target.value })}
                placeholder="出现什么情况即判定此决策失效"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">转向信号</label>
              <input
                type="text"
                value={gateForm.pivot_signals}
                onChange={(e) => setGateForm({ ...gateForm, pivot_signals: e.target.value })}
                placeholder="逗号分隔，如：竞品发布同类功能, 关键指标连续下滑"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            {gateError && <p className="text-xs text-red-600 dark:text-red-400">{gateError}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={gateSaving}
                className="px-4 py-1.5 bg-accent-600 text-white rounded-lg hover:bg-accent-700 disabled:opacity-50 text-sm"
              >
                {gateSaving ? '保存中...' : '保存门控'}
              </button>
              <button
                type="button"
                onClick={() => setGateEditing(false)}
                className="px-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                取消
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-2 text-sm">
            {decision.gate?.invalidate_if && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">失效条件：</span>
                <p className="text-gray-600 dark:text-gray-400">{decision.gate.invalidate_if}</p>
              </div>
            )}
            {decision.gate?.review_date && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">审核日期：</span>
                <p className="text-gray-600 dark:text-gray-400">{new Date(decision.gate.review_date).toLocaleDateString()}</p>
              </div>
            )}
            {decision.gate?.pivot_signals && decision.gate.pivot_signals.length > 0 && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">转向信号：</span>
                <ul className="mt-1 list-disc list-inside text-gray-600 dark:text-gray-400">
                  {decision.gate.pivot_signals.map((signal, i) => (
                    <li key={i}>{signal}</li>
                  ))}
                </ul>
              </div>
            )}
            {!decision.gate?.review_date && !decision.gate?.invalidate_if && !(decision.gate?.pivot_signals && decision.gate.pivot_signals.length > 0) && (
              <p className="text-xs text-gray-400">尚未设置门控。点击右上角「设置门控」添加审核日期与失效条件。</p>
            )}
          </div>
        )}
      </section>

      {decision.options && decision.options.length > 0 && (
        <section className="card p-6">
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

      <ResultFeedbackPanel
        decisionId={id}
        decisionTitle={decision.title}
        actualResult={decision.actual_result}
        beliefUpdate={decision.belief_update}
        verdict={decision.verdict}
        onRecorded={() => setRefreshKey((k) => k + 1)}
      />

      <StatusTimeline createdAt={decision.created_at} updatedAt={decision.updated_at} status={decision.status} />
    </DetailShell>
  );
}