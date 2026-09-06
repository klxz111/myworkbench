'use client';

import Link from 'next/link';
import { completeTaskPayload } from '@/lib/recurring';

/**
 * 全站统一页壳组件。新页面一律用这些原语，不再手写
 * bg-white dark:bg-gray-800 rounded-lg shadow 组合与各自的页头/空状态。
 */

/* ---------- 页头 ---------- */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-sub">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ---------- 卡片与空状态 ---------- */

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}

export function EmptyState({ text, children }: { text: string; children?: React.ReactNode }) {
  return (
    <div className="p-6 text-center">
      <p className="text-sm text-gray-500 dark:text-gray-400">{text}</p>
      {children}
    </div>
  );
}

export function SectionCard({
  title,
  count,
  actions,
  children,
}: {
  title: string;
  count?: number;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="section-title">
          {title}
          {count !== undefined && count > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300">
              {count}
            </span>
          )}
        </h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

/* ---------- 徽章 ---------- */

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  active: { label: '活跃', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  draft: { label: '草稿', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  archived: { label: '已归档', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
  todo: { label: '待办', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  doing: { label: '进行中', cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' },
  done: { label: '已完成', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
};

export function StatusBadge({ status }: { status: string }) {
  const conf = STATUS_BADGE[status] || STATUS_BADGE.archived;
  return <span className={`badge ${conf.cls}`}>{conf.label}</span>;
}

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  strategy: { label: '策略', cls: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  decision: { label: '决策', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  research: { label: '研究', cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' },
  evidence: { label: '证据', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  project: { label: '项目', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  experiment: { label: '实验', cls: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300' },
  belief: { label: '信念', cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  person: { label: '人脉', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
  opportunity: { label: '机会', cls: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' },
  radar: { label: '雷达', cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  capital: { label: '资本', cls: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  profile: { label: '档案', cls: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300' },
  task: { label: '任务', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  event: { label: '事件', cls: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  organization: { label: '组织', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
};

export function TypeBadge({ type }: { type: string }) {
  const conf = TYPE_BADGE[type] || { label: type, cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' };
  return <span className={`badge ${conf.cls}`}>{conf.label}</span>;
}

/* ---------- 到期条目列表（今日页 / 首页共用） ---------- */

export interface DatedEntry {
  id: string;
  type: string;
  title: string;
  kind: string;
  kind_label?: string;
  date: string;
  diff_days?: number;
  href: string;
  task_status?: string;
  notes?: string;
  recurrence?: string;
  recurrence_until?: string;
  occurrence?: string;
}

const KIND_COLORS: Record<string, string> = {
  task: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  gate: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  followup: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  deadline: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  event: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

/** kind → 编辑路由前缀（与详情路由不同：person/opportunity/task 的编辑都在 /entities 下） */
const KIND_EDIT_PREFIX: Record<string, string> = {
  task: '/entities/task',
  gate: '/decisions',
  followup: '/entities/person',
  deadline: '/entities/opportunity',
  event: '/events',
};

export function DatedItemList({
  items,
  showDue = true,
  emptyText = '没有条目。',
  onComplete,
}: {
  items: DatedEntry[];
  showDue?: boolean;
  emptyText?: string;
  /** 传入后任务条目显示 ✓ 完成按钮（循环任务自动推进到下一周期） */
  onComplete?: (item: DatedEntry) => void | Promise<void>;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-400 dark:text-gray-500 py-1">{emptyText}</p>;
  }
  return (
    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
      {items.map((item) => (
        <li key={`${item.kind}-${item.id}-${item.occurrence || ''}`} className="flex items-center gap-2 px-1 py-2.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50">
          <Link href={item.href} className="flex items-center gap-3 flex-1 min-w-0">
            <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${KIND_COLORS[item.kind] || KIND_COLORS.event}`}>
              {item.kind_label || item.kind}
            </span>
            <span
              className="flex-1 min-w-0 truncate text-sm text-gray-900 dark:text-gray-200"
              title={item.notes ? `备注：${item.notes}` : item.title}
            >
              {item.title}
            </span>
            {showDue && item.diff_days !== undefined && (
              <span className={`shrink-0 text-xs ${item.diff_days < 0 ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-400'}`}>
                {item.diff_days < 0 ? `逾期 ${Math.abs(item.diff_days)} 天` : item.diff_days === 0 ? '今天' : `${item.diff_days} 天后`}
              </span>
            )}
          </Link>
          {item.kind === 'task' && onComplete && (
            <button
              onClick={() => onComplete(item)}
              title={item.recurrence ? '完成并推进到下一周期' : '标记为完成'}
              className="shrink-0 px-2 py-1 rounded text-xs bg-emerald-600 text-white hover:bg-emerald-700"
            >
              ✓
            </button>
          )}
          <Link
            href={`${KIND_EDIT_PREFIX[item.kind] || '/entities'}/${item.id}/edit`}
            title="打开编辑页"
            className="shrink-0 px-2 py-1 rounded text-xs btn-ghost"
          >
            编辑
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** 完成一个到期任务条目（循环推进语义），供今日页/首页共用 */
export async function completeDatedTask(item: DatedEntry): Promise<boolean> {
  try {
    const payload = completeTaskPayload(item, item.occurrence || item.date);
    const res = await fetch(`/api/entities/task/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (error) {
    console.error('Error completing task:', error);
    return false;
  }
}
