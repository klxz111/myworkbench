'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface BeliefOption {
  id: string;
  title: string;
  linked: boolean;
  confidence?: string;
}

const VERDICT_OPTIONS = [
  { value: 'confirmed', label: '假设成立（confirmed）' },
  { value: 'partially_confirmed', label: '部分成立（partially_confirmed）' },
  { value: 'invalidated', label: '假设被推翻（invalidated）' },
  { value: 'inconclusive', label: '尚无定论（inconclusive）' },
];

const VERDICT_BADGE: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  partially_confirmed: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  invalidated: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  inconclusive: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

interface ResultFeedbackPanelProps {
  decisionId: string;
  decisionTitle: string;
  actualResult?: string;
  beliefUpdate?: string;
  verdict?: string;
  /** 提交成功后由父组件重新拉取决策（router.refresh 不会触发 client useEffect） */
  onRecorded?: () => void;
}

export function ResultFeedbackPanel({
  decisionId,
  decisionTitle,
  actualResult,
  beliefUpdate,
  verdict,
  onRecorded,
}: ResultFeedbackPanelProps) {
  const router = useRouter();
  const [open, setOpen] = useState(!actualResult);
  const [beliefs, setBeliefs] = useState<BeliefOption[] | null>(null);
  const [form, setForm] = useState({
    verdict: verdict || 'confirmed',
    actual_result: actualResult || '',
    belief_update: beliefUpdate || '',
    create_evidence: true,
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        // 已关联信念（belief --drives--> decision）
        const linkedIds = new Set<string>();
        try {
          const relRes = await fetch(`/api/relations?to=${decisionId}`);
          if (relRes.ok) {
            const relData = await relRes.json();
            for (const r of relData.relations || []) {
              if (r.type === 'belief' && r.relation === 'drives') {
                linkedIds.add(r.from_id);
              }
            }
          }
        } catch {
          // 关系接口失败不阻塞，退化为全量列表
        }

        const res = await fetch('/api/entities/belief');
        if (res.ok) {
          const all: Array<{ id: string; title: string; status?: string }> = await res.json();
          const options = all
            .filter((b) => b.status !== 'archived')
            .map((b) => ({
              id: b.id,
              title: b.title,
              linked: linkedIds.has(b.id),
            }));
          setBeliefs(options);
          setSelected(new Set(options.filter((o) => o.linked).map((o) => o.id)));
        } else {
          setBeliefs([]);
        }
      } catch {
        setBeliefs([]);
      }
    }
    load();
  }, [decisionId]);

  const toggleBelief = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!form.actual_result.trim()) {
      setError('请填写实际结果');
      return;
    }
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/entities/decision/${decisionId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          target_belief_ids: Array.from(selected),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '记录失败');
      const parts: string[] = ['结果已记录'];
      if (data.updated_beliefs?.length > 0) {
        parts.push(`已反哺 ${data.updated_beliefs.length} 条信念`);
      }
      if (data.created_evidence?.length > 0) {
        parts.push(`已创建证据 ${data.created_evidence.join('、')}`);
      }
      setMessage(parts.join('，'));
      setOpen(false);
      onRecorded?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '记录反馈失败');
    } finally {
      setSubmitting(false);
    }
  };

  const recorded = !!verdict;

  return (
    <section className="card p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          结果反哺闭环
        </h3>
        {recorded && !open && (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${VERDICT_BADGE[verdict!] || VERDICT_BADGE.inconclusive}`}>
            判定：{VERDICT_OPTIONS.find((v) => v.value === verdict)?.label.split('（')[0] || verdict}
          </span>
        )}
        <button
          onClick={() => setOpen(!open)}
          className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          {open ? '收起' : recorded ? '更新结果' : '记录结果'}
        </button>
      </div>

      {!open && !recorded && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          尚未记录实际结果。决策到期后记录结果，可自动反哺关联信念（调整置信度、追加更新记录）并生成结果证据。
        </p>
      )}

      {message && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-green-800 dark:text-green-200">
          {message}
        </div>
      )}

      {open && (
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-800 dark:text-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              判定结论
            </label>
            <select
              value={form.verdict}
              onChange={(e) => setForm({ ...form, verdict: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-500 dark:bg-gray-800 dark:text-white text-sm"
            >
              {VERDICT_OPTIONS.map((v) => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              实际结果
            </label>
            <textarea
              rows={3}
              value={form.actual_result}
              onChange={(e) => setForm({ ...form, actual_result: e.target.value })}
              placeholder="决策执行后的实际结果是什么？与预期结果（expected_outcome）对比如何？"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-500 dark:bg-gray-800 dark:text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              信念更新（可选）
            </label>
            <textarea
              rows={2}
              value={form.belief_update}
              onChange={(e) => setForm({ ...form, belief_update: e.target.value })}
              placeholder="基于该结果，对相关信念应作何修正？"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-500 dark:bg-gray-800 dark:text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              反哺目标信念（勾选；已关联决策的信念默认选中）
            </label>
            {beliefs === null ? (
              <p className="text-sm text-gray-500">加载信念列表中...</p>
            ) : beliefs.length === 0 ? (
              <p className="text-sm text-gray-500">暂无信念实体，可先在「信念」页创建。</p>
            ) : (
              <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-700">
                {beliefs.map((b) => (
                  <label
                    key={b.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(b.id)}
                      onChange={() => toggleBelief(b.id)}
                      className="h-4 w-4 text-accent-600"
                    />
                    <span className="text-sm text-gray-900 dark:text-gray-200">{b.title}</span>
                    {b.linked && (
                      <span className="ml-auto text-xs text-accent-600 dark:text-accent-400">已关联</span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={form.create_evidence}
              onChange={(e) => setForm({ ...form, create_evidence: e.target.checked })}
              className="h-4 w-4 text-accent-600"
            />
            同时创建「结果证据」实体（关联所选信念与本决策）
          </label>

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary"
            >
              {submitting ? '提交中...' : recorded ? '更新并反哺' : '记录并反哺'}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="btn-secondary"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
