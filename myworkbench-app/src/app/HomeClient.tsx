'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { DataManagement } from '@/components/DataManagement';
import { InsightsContent } from '@/components/InsightsCard';
import { LauncherWidget } from '@/components/LauncherWidget';
import { PinnedContent } from '@/components/PinnedCard';
import { ReadingQueueWidget } from '@/components/ReadingQueueWidget';
import { SectionCard, DatedItemList, completeDatedTask, DatedEntry, StatusBadge } from '@/components/ui';
import { entityHref } from '@/lib/entity-paths';
import { getHomeLayout, setHomeLayout, getIdentity, IdentityPrefs, HomeLayout } from '@/lib/prefs';

/**
 * 今日工作台（首页）：打开就知道现在该做什么，且每张卡片可个人化。
 * Widget 注册表驱动：左列 = 已逾期 / 今日到期 / 待审核门控；
 * 右列 = 快速捕获 / 置顶 / 最近变更 / 策略 / 数据管理；全宽 = 我的投入。
 * 「编辑布局」模式下可隐藏卡片、列内上下移（按钮式，不用拖拽）；
 * 顺序与隐藏状态存 localStorage（mwbench_home_layout，见 lib/prefs.ts）。
 */

interface DashboardItem {
  id: string;
  type: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
}

interface DashboardResponse {
  recent_changes: DashboardItem[];
  pending_reviews: Array<DashboardItem & { gate_status: string; review_date?: string }>;
  overdue_count: number;
  upcoming_count: number;
}

interface TodayResponse {
  date: string;
  overdue: DatedEntry[];
  today: DatedEntry[];
  upcoming: DatedEntry[];
}

function GateReviewList({ items }: { items: DashboardResponse['pending_reviews'] }) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-400 dark:text-gray-500 py-1">没有待审核的门控。</p>;
  }
  return (
    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
      {items.map((item) => {
        const overdue = item.gate_status === 'overdue';
        const upcoming = item.gate_status === 'upcoming';
        return (
          <li key={item.id}>
            <Link href={`/decisions/${item.id}`} className="flex items-center gap-3 px-1 py-2.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                overdue
                  ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                  : upcoming
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
              }`}>
                门控审核
              </span>
              <span className="flex-1 min-w-0 truncate text-sm text-gray-900 dark:text-gray-200">{item.title}</span>
              <span className={`shrink-0 text-xs ${
                overdue ? 'text-red-600 dark:text-red-400 font-medium' : upcoming ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'
              }`}>
                {item.review_date ? new Date(item.review_date).toLocaleDateString('zh-CN') : '未设置'}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

type WidgetKey =
  | 'overdue'
  | 'today'
  | 'gates'
  | 'readingQueue'
  | 'quickCapture'
  | 'pinned'
  | 'launcher'
  | 'recent'
  | 'strategies'
  | 'dataMgmt'
  | 'insights';

const WIDGET_META: Record<WidgetKey, { title: string; column: 'left' | 'right' | 'full' }> = {
  overdue: { title: '已逾期', column: 'left' },
  today: { title: '今日到期', column: 'left' },
  gates: { title: '待审核门控', column: 'left' },
  readingQueue: { title: '待读文献', column: 'left' },
  quickCapture: { title: '快速捕获', column: 'right' },
  pinned: { title: '置顶', column: 'right' },
  launcher: { title: '快速启动', column: 'right' },
  recent: { title: '最近变更', column: 'right' },
  strategies: { title: '策略', column: 'right' },
  dataMgmt: { title: '数据管理', column: 'right' },
  insights: { title: '我的投入', column: 'full' },
};

/** 默认展示顺序（含各列），从未定制过的浏览器按此渲染 */
const DEFAULT_ORDER: WidgetKey[] = [
  'overdue',
  'today',
  'gates',
  'readingQueue',
  'quickCapture',
  'pinned',
  'launcher',
  'recent',
  'strategies',
  'dataMgmt',
  'insights',
];

const WIDGET_ACTIONS: Partial<Record<WidgetKey, React.ReactNode>> = {
  gates: (
    <Link href="/decisions" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
      全部决策 →
    </Link>
  ),
  recent: (
    <Link href="/stats" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
      统计 →
    </Link>
  ),
  strategies: (
    <Link href="/strategy" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
      管理 →
    </Link>
  ),
};

export function HomeClient() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [today, setToday] = useState<TodayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [quickTitle, setQuickTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);

  // 个人化状态（挂载后才读 localStorage，避免 SSR hydration 错位）
  const [layout, setLayoutState] = useState<HomeLayout>({ hidden: [], order: [] });
  const [editing, setEditing] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [identity, setIdentityState] = useState<IdentityPrefs | null>(null);

  const load = useCallback(async () => {
    try {
      const [todayRes, dashboardRes] = await Promise.all([
        fetch('/api/today').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/dashboard').then((r) => (r.ok ? r.json() : null)),
      ]);
      setToday(todayRes);
      setDashboard(dashboardRes);
    } catch (error) {
      console.error('Error loading workbench:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setLayoutState(getHomeLayout());
    setIdentityState(getIdentity());
    setNow(new Date());
    // 设置页「进入编辑模式」通过 /?edit=1 直达
    if (new URLSearchParams(window.location.search).get('edit') === '1') setEditing(true);
  }, []);

  const updateLayout = (next: HomeLayout) => {
    setLayoutState(next);
    setHomeLayout(next);
  };

  /** 完整期望顺序 = 已存顺序（过滤掉未知键）+ 新增 widget 追加到默认位置 */
  const orderAll = useMemo<WidgetKey[]>(() => {
    const known = new Set<string>(DEFAULT_ORDER);
    return [
      ...layout.order.filter((k) => known.has(k)),
      ...DEFAULT_ORDER.filter((k) => !layout.order.includes(k)),
    ] as WidgetKey[];
  }, [layout.order]);

  const orderedVisible = useMemo(() => orderAll.filter((k) => !layout.hidden.includes(k)), [orderAll, layout.hidden]);

  const moveWidget = (key: WidgetKey, dir: -1 | 1) => {
    const colKeys = orderedVisible.filter((k) => WIDGET_META[k].column === WIDGET_META[key].column);
    const other = colKeys[colKeys.indexOf(key) + dir];
    if (!other) return;
    const next = [...orderAll];
    const a = next.indexOf(key);
    const b = next.indexOf(other);
    next[a] = other;
    next[b] = key;
    updateLayout({ hidden: layout.hidden, order: next });
  };

  const hideWidget = (key: WidgetKey) => updateLayout({ hidden: [...layout.hidden, key], order: orderAll });
  const showWidget = (key: WidgetKey) =>
    updateLayout({ hidden: layout.hidden.filter((k) => k !== key), order: orderAll });

  const handleComplete = async (item: DatedEntry) => {
    setCompleting(item.id);
    if (await completeDatedTask(item)) {
      await load();
    }
    setCompleting(null);
  };

  const quickAdd = async () => {
    const title = quickTitle.trim();
    if (!title || !today) return;
    setAdding(true);
    setAddError(null);
    try {
      const slug = `task-${Date.now().toString(36)}`;
      const res = await fetch('/api/entities/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          data: { id: slug, type: 'task', title, status: 'todo', tags: ['quick-capture'], due_date: today.date },
          content: '',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || '创建失败');
      }
      setQuickTitle('');
      await load();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : '快速添加失败');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">加载工作台中...</div>;
  }

  const overdue = today?.overdue || [];
  const dueToday = today?.today || [];
  const pendingReviews = dashboard?.pending_reviews || [];
  const strategies = (dashboard?.recent_changes || []).filter((item) => item.type === 'strategy').slice(0, 3);
  const recentChanges = (dashboard?.recent_changes || []).slice(0, 8);
  const overdueCount = dashboard?.overdue_count || 0;
  const upcomingCount = dashboard?.upcoming_count || 0;

  /* ---------- 问候条（个人印记） ---------- */
  const identityConfigured = Boolean(identity && (identity.name || identity.focus || identity.deadline_date));
  const hello = now
    ? now.getHours() < 5
      ? '凌晨好'
      : now.getHours() < 11
      ? '早上好'
      : now.getHours() < 13
      ? '中午好'
      : now.getHours() < 18
      ? '下午好'
      : '晚上好'
    : null;
  const greetingTitle = hello ? `${hello}${identity?.name ? `，${identity.name}` : ''}` : '今日工作台';
  const dateLine = now
    ? `${now.getMonth() + 1} 月 ${now.getDate()} 日 · 周${['日', '一', '二', '三', '四', '五', '六'][now.getDay()]}`
    : '';

  let ddl: { text: string; cls: string } | null = null;
  if (now && identity?.deadline_date) {
    const target = new Date(`${identity.deadline_date}T00:00:00`);
    if (!Number.isNaN(target.getTime())) {
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const diff = Math.round((target.getTime() - todayStart.getTime()) / 86400000);
      const label = identity.deadline_label || 'DDL';
      if (diff === 0) {
        ddl = { text: `${label}就是今天`, cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' };
      } else if (diff > 0) {
        ddl = { text: `距 ${label} 还有 ${diff} 天`, cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' };
      } else {
        ddl = { text: `${label}已过 ${-diff} 天`, cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' };
      }
    }
  }

  /* ---------- Widget 渲染 ---------- */
  const editControls = (key: WidgetKey) => {
    const colKeys = orderedVisible.filter((k) => WIDGET_META[k].column === WIDGET_META[key].column);
    const idx = colKeys.indexOf(key);
    const btnCls = 'px-2 py-1 rounded text-xs btn-ghost disabled:opacity-40 disabled:cursor-not-allowed';
    return (
      <div className="flex items-center gap-1">
        <button onClick={() => moveWidget(key, -1)} disabled={idx <= 0} title="上移" className={btnCls}>
          ↑
        </button>
        <button onClick={() => moveWidget(key, 1)} disabled={idx >= colKeys.length - 1} title="下移" className={btnCls}>
          ↓
        </button>
        <button onClick={() => hideWidget(key)} title="隐藏该卡片" className={btnCls}>
          隐藏
        </button>
      </div>
    );
  };

  const renderWidget = (key: WidgetKey) => {
    switch (key) {
      case 'overdue':
        return <DatedItemList items={overdue} emptyText="没有逾期事项，保持得很好。" onComplete={handleComplete} />;
      case 'today':
        return <DatedItemList items={dueToday} emptyText="今天没有到期事项。" onComplete={handleComplete} />;
      case 'gates':
        return <GateReviewList items={pendingReviews} />;
      case 'readingQueue':
        return <ReadingQueueWidget />;
      case 'quickCapture':
        return (
          <div>
            <div className="flex gap-2">
              <input
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !adding && quickAdd()}
                placeholder="记一件事，回车确认..."
                className="input flex-1 min-w-0"
              />
              <button onClick={quickAdd} disabled={adding || !quickTitle.trim()} className="btn-primary shrink-0">
                {adding ? '添加中...' : '添加'}
              </button>
            </div>
            {addError && <p className="mt-2 text-xs text-red-600">{addError}</p>}
          </div>
        );
      case 'pinned':
        return <PinnedContent />;
      case 'launcher':
        return <LauncherWidget />;
      case 'recent':
        return recentChanges.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 py-1">暂无最近活动。</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {recentChanges.map((item) => (
              <li key={`${item.type}-${item.id}`}>
                <Link href={entityHref(item.type, item.id)} className="flex items-center gap-2 px-1 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <span className="flex-1 min-w-0 truncate text-sm text-gray-900 dark:text-gray-200">{item.title}</span>
                  <span className="shrink-0 text-xs text-gray-400">{new Date(item.updated_at).toLocaleDateString('zh-CN')}</span>
                </Link>
              </li>
            ))}
          </ul>
        );
      case 'strategies':
        return strategies.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 py-1">
            暂无策略。<Link href="/entities/strategy/new" className="text-blue-600 dark:text-blue-400 hover:underline">创建第一个 →</Link>
          </p>
        ) : (
          <ul className="space-y-2">
            {strategies.map((strategy) => (
              <li key={strategy.id}>
                <Link href={`/strategy/${strategy.id}`} className="flex items-center justify-between gap-2 px-2 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                  <span className="flex-1 min-w-0 truncate text-sm text-gray-900 dark:text-white">{strategy.title}</span>
                  <StatusBadge status={strategy.status} />
                </Link>
              </li>
            ))}
          </ul>
        );
      case 'dataMgmt':
        return (
          <details className="text-sm">
            <summary className="cursor-pointer select-none text-gray-600 dark:text-gray-300">展开导出 / 导入</summary>
            <div className="mt-3">
              <DataManagement />
            </div>
          </details>
        );
      case 'insights':
        return <InsightsContent />;
    }
  };

  const widgetCount = (key: WidgetKey): number | undefined => {
    if (key === 'overdue') return overdue.length;
    if (key === 'today') return dueToday.length;
    if (key === 'gates') return pendingReviews.length;
    return undefined;
  };

  const widgetCard = (key: WidgetKey) => (
    <SectionCard
      key={key}
      title={WIDGET_META[key].title}
      count={widgetCount(key)}
      actions={editing ? editControls(key) : WIDGET_ACTIONS[key]}
    >
      {renderWidget(key)}
    </SectionCard>
  );

  const leftKeys = orderedVisible.filter((k) => WIDGET_META[k].column === 'left');
  const rightKeys = orderedVisible.filter((k) => WIDGET_META[k].column === 'right');
  const fullKeys = orderedVisible.filter((k) => WIDGET_META[k].column === 'full');

  return (
    <div className="space-y-6">
      {/* 问候条：时段问候 + 本周焦点 + DDL 倒计时 + 布局编辑入口
          （移动端文字独占一行，徽章/按钮换行到下一行，避免文字被挤成一字一行） */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="w-full min-w-0 sm:w-auto sm:flex-1">
          <h1 className="page-title">{greetingTitle}</h1>
          <p className="page-sub">
            {dateLine}
            {identity?.focus ? ` · 本周焦点：${identity.focus}` : ''}
            {!identityConfigured && (
              <>
                {dateLine ? ' · ' : ''}
                <Link href="/settings" className="text-blue-600 dark:text-blue-400 hover:underline">
                  设置名字和本周焦点 →
                </Link>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {ddl && <span className={`badge ${ddl.cls}`}>{ddl.text}</span>}
          <button onClick={() => setEditing(!editing)} className={editing ? 'btn-primary' : 'btn-secondary'}>
            {editing ? '完成' : '编辑布局'}
          </button>
        </div>
      </div>

      {/* 逾期 / 临期提醒横幅 */}
      {overdueCount > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-5 py-3.5 flex items-center gap-4">
          <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-red-600 text-white text-xs font-bold">
            {overdueCount}
          </span>
          <span className="flex-1 text-sm text-red-800 dark:text-red-200">
            {overdueCount} 项事项已逾期，需要关注
          </span>
          <Link href="/today" className="text-sm font-medium text-red-700 dark:text-red-300 hover:underline whitespace-nowrap">
            去处理 →
          </Link>
        </div>
      )}
      {overdueCount === 0 && upcomingCount > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-5 py-3.5 flex items-center gap-4">
          <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-amber-500 text-white text-xs font-bold">
            {upcomingCount}
          </span>
          <span className="flex-1 text-sm text-amber-800 dark:text-amber-200">
            {upcomingCount} 项事项将在 7 天内到期
          </span>
          <Link href="/today" className="text-sm font-medium text-amber-700 dark:text-amber-300 hover:underline whitespace-nowrap">
            查看 →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* 左列：现在该做的事 */}
        <div className="lg:col-span-3 space-y-6">{leftKeys.map(widgetCard)}</div>
        {/* 右列：捕获 / 置顶 / 变更 / 策略 / 数据 */}
        <div className="lg:col-span-2 space-y-6">{rightKeys.map(widgetCard)}</div>
      </div>

      {/* 全宽：数据画像 */}
      {fullKeys.map(widgetCard)}

      {/* 编辑模式：已隐藏卡片托盘 */}
      {editing &&
        layout.hidden.filter((k) => k in WIDGET_META).length > 0 && (
          <div className="flex flex-wrap items-center gap-2 card p-4">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">已隐藏：</span>
            {layout.hidden
              .filter((k) => k in WIDGET_META)
              .map((k) => (
                <span
                  key={k}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1 text-xs text-gray-600 dark:text-gray-300"
                >
                  {WIDGET_META[k as WidgetKey].title}
                  <button onClick={() => showWidget(k as WidgetKey)} className="text-blue-600 dark:text-blue-400 hover:underline">
                    显示
                  </button>
                </span>
              ))}
          </div>
        )}

      {/* 长尾概览入口：数据在各自专属页可见，不再铺满首页 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-sm text-gray-500 dark:text-gray-400">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-400">更多概览</span>
        <Link href="/opportunity" className="hover:text-blue-600 dark:hover:text-blue-400">机会</Link>
        <Link href="/people" className="hover:text-blue-600 dark:hover:text-blue-400">人脉跟进</Link>
        <Link href="/capital" className="hover:text-blue-600 dark:hover:text-blue-400">资本</Link>
        <Link href="/events" className="hover:text-blue-600 dark:hover:text-blue-400">事件</Link>
        <Link href="/research" className="hover:text-blue-600 dark:hover:text-blue-400">研究</Link>
        <Link href="/projects" className="hover:text-blue-600 dark:hover:text-blue-400">项目</Link>
      </div>
    </div>
  );
}
