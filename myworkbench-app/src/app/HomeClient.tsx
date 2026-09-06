'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DataManagement } from '@/components/DataManagement';
import { entityHref } from '@/lib/entity-paths';

interface DashboardItem {
  id: string;
  type: string;
  title: string;
  status: string;
  tags: string[];
  updated_at: string;
}

interface DecisionGate {
  invalidate_if?: string;
  review_date?: string;
  pivot_signals?: string[];
}

interface DashboardResponse {
  recent_changes: DashboardItem[];
  active_decisions: DashboardItem[];
  active_research: DashboardItem[];
  active_projects: DashboardItem[];
  capital_summary: {
    count: number;
    latest_updated: string | null;
    items: DashboardItem[];
  };
  next_actions: DashboardItem[];
  pending_reviews: Array<DashboardItem & { gate_status: string; diff_days?: number; gate?: DecisionGate }>;
  recent_events: DashboardItem[];
  follow_ups: Array<DashboardItem & { diff_days: number }>;
  overdue_count: number;
  upcoming_count: number;
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  strategy: { label: '策略', color: 'text-gray-700 dark:text-gray-300', bg: 'bg-gray-100 dark:bg-gray-700', dot: 'bg-gray-500' },
  decision: { label: '决策', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-100 dark:bg-emerald-900/40', dot: 'bg-emerald-500' },
  research: { label: '研究', color: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-100 dark:bg-indigo-900/40', dot: 'bg-indigo-500' },
  evidence: { label: '证据', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-100 dark:bg-blue-900/40', dot: 'bg-blue-500' },
  project: { label: '项目', color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-100 dark:bg-orange-900/40', dot: 'bg-orange-500' },
  experiment: { label: '实验', color: 'text-pink-700 dark:text-pink-300', bg: 'bg-pink-100 dark:bg-pink-900/40', dot: 'bg-pink-500' },
  belief: { label: '信念', color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-100 dark:bg-purple-900/40', dot: 'bg-purple-500' },
  person: { label: '人员', color: 'text-yellow-700 dark:text-yellow-300', bg: 'bg-yellow-100 dark:bg-yellow-900/40', dot: 'bg-yellow-500' },
  opportunity: { label: '机会', color: 'text-teal-700 dark:text-teal-300', bg: 'bg-teal-100 dark:bg-teal-900/40', dot: 'bg-teal-500' },
  radar: { label: '雷达', color: 'text-red-700 dark:text-red-300', bg: 'bg-red-100 dark:bg-red-900/40', dot: 'bg-red-500' },
  capital: { label: '资本', color: 'text-green-700 dark:text-green-300', bg: 'bg-green-100 dark:bg-green-900/40', dot: 'bg-green-500' },
  profile: { label: '个人档案', color: 'text-cyan-700 dark:text-cyan-300', bg: 'bg-cyan-100 dark:bg-cyan-900/40', dot: 'bg-cyan-500' },
};

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  active: { label: '活跃', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-200 dark:border-emerald-800' },
  draft: { label: '草稿', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-800' },
  todo: { label: '待办', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800' },
  doing: { label: '进行中', color: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-50 dark:bg-indigo-900/30', border: 'border-indigo-200 dark:border-indigo-800' },
  done: { label: '已完成', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-200 dark:border-emerald-800' },
  archived: { label: '已归档', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-800', border: 'border-gray-200 dark:border-gray-700' },
};

const DEFAULT_STATUS = STATUS_STYLES.archived;

function getStatusStyle(status?: string) {
  if (!status) return DEFAULT_STATUS;
  return STATUS_STYLES[status] || DEFAULT_STATUS;
}

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] || { label: type, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-700', dot: 'bg-gray-400' };
}

function getTypeHref(type: string, id: string): string {
  return entityHref(type, id);
}

export function HomeClient() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard');
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500 dark:text-gray-400">加载仪表板中...</div>
      </div>
    );
  }

  const recentChanges = (data?.recent_changes || []).map((item) => ({
    ...item,
    href: getTypeHref(item.type, item.id),
  }));

  const activeDecisions = data?.active_decisions || [];
  const activeResearch = data?.active_research || [];
  const activeProjects = data?.active_projects || [];
  const capitalSummary = data?.capital_summary;
  const nextActions = data?.next_actions || [];
  const pendingReviews = data?.pending_reviews || [];
  const recentEvents = data?.recent_events || [];
  const followUps = data?.follow_ups || [];
  const overdueCount = data?.overdue_count || 0;
  const upcomingCount = data?.upcoming_count || 0;
  const strategies = (data?.recent_changes || []).filter((item) => item.type === 'strategy').slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Overdue Reminder Banner */}
      {overdueCount > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-5 py-4 flex items-center gap-4">
          <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-red-600 text-white text-xs font-bold">
            {overdueCount}
          </span>
          <span className="flex-1 text-sm text-red-800 dark:text-red-200">
            {overdueCount} 项事项已逾期，需要关注
          </span>
          <Link href="/decisions" className="text-sm font-medium text-red-700 dark:text-red-300 hover:underline whitespace-nowrap">
            查看待审核 →
          </Link>
        </div>
      )}
      {overdueCount === 0 && upcomingCount > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-5 py-4 flex items-center gap-4">
          <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-amber-500 text-white text-xs font-bold">
            {upcomingCount}
          </span>
          <span className="flex-1 text-sm text-amber-800 dark:text-amber-200">
            {upcomingCount} 项事项将在 7 天内到期
          </span>
          <Link href="/decisions" className="text-sm font-medium text-amber-700 dark:text-amber-300 hover:underline whitespace-nowrap">
            查看 →
          </Link>
        </div>
      )}

      {/* Strategy Status Cards */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">策略</h2>
          <Link href="/strategy" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            管理
          </Link>
        </div>
        {strategies.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">暂无策略。请定义您的长期方向。</p>
            <Link href="/entities/strategy/new" className="mt-3 inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline">
              创建策略 <span className="ml-1">→</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {strategies.map((strategy) => {
              const statusStyle = getStatusStyle(strategy.status);
              return (
                <Link
                  key={strategy.id}
                  href={`/strategy/${strategy.id}`}
                  className="group block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                      {strategy.title}
                    </h3>
                    <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${statusStyle.bg} ${statusStyle.color} ${statusStyle.border}`}>
                      {statusStyle.label}
                    </span>
                  </div>
                  {strategy.tags && strategy.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {strategy.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    Updated {new Date(strategy.updated_at).toLocaleDateString()}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Changes Timeline */}
        <section className="lg:col-span-7">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">最近变更</h2>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            {recentChanges.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">暂无最近活动。</p>
            ) : (
              <div className="relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
                <ul className="space-y-5">
                  {recentChanges.map((item) => {
                    const typeConf = getTypeConfig(item.type);
                    const statusStyle = getStatusStyle(item.status);
                    return (
                      <li key={`${item.type}-${item.id}`} className="relative flex gap-4">
                        <div className={`relative z-10 mt-1 h-[9px] w-[9px] shrink-0 rounded-full border-2 border-white dark:border-gray-800 ${typeConf.dot}`} aria-hidden="true" />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeConf.bg} ${typeConf.color}`}>
                              {typeConf.label}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${statusStyle.bg} ${statusStyle.color} ${statusStyle.border}`}>
                              {statusStyle.label}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
                              {new Date(item.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                          <Link
                            href={item.href}
                            className="block text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                          >
                            {item.title}
                          </Link>
                          {item.tags && item.tags.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {item.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Active Decisions + Quick Actions */}
        <div className="lg:col-span-5 space-y-8">
          {/* Active Decisions Priority List */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">活跃决策</h2>
              <Link href="/decisions" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                查看全部
              </Link>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
              {activeDecisions.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">暂无决策。</div>
              ) : (
                activeDecisions.slice(0, 6).map((decision) => {
                  const statusStyle = getStatusStyle(decision.status);
                  const priorityDot = decision.status === 'active' ? '●' : decision.status === 'draft' ? '◐' : '○';
                  const dotColor = decision.status === 'active' ? 'text-emerald-500' : decision.status === 'draft' ? 'text-amber-500' : 'text-gray-400';
                  return (
                    <Link
                      key={decision.id}
                      href={`/decisions/${decision.id}`}
                      className="flex items-start justify-between gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${dotColor}`} aria-hidden="true">{priorityDot}</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {decision.title}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 ml-5">
                          <span>Updated {new Date(decision.updated_at).toLocaleDateString()}</span>
                          {decision.tags && decision.tags.length > 0 && (
                            <span className="hidden sm:inline-flex items-center gap-1">
                              {decision.tags.slice(0, 2).map((tag) => (
                                <span key={tag} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                                  {tag}
                                </span>
                              ))}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${statusStyle.bg} ${statusStyle.color} ${statusStyle.border}`}>
                        {statusStyle.label}
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          </section>

          {/* Pending Reviews */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">待审核决策</h2>
              <Link href="/decisions" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                查看全部
              </Link>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
              {pendingReviews.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">暂无待审核决策。</div>
              ) : (
                pendingReviews.slice(0, 6).map((item) => {
                  const statusStyle = getStatusStyle(item.status);
                  const gateLabel = item.gate_status === 'overdue' ? '已逾期' : item.gate_status === 'upcoming' ? '即将审核' : '已安排';
                  const gateColor = item.gate_status === 'overdue' ? 'text-red-600 dark:text-red-400' : item.gate_status === 'upcoming' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400';
                  return (
                    <Link
                      key={item.id}
                      href={`/decisions/${item.id}`}
                      className="flex items-start justify-between gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {item.title}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span>审核：{item.gate?.review_date ? new Date(item.gate.review_date).toLocaleDateString() : '-'}</span>
                          <span className={gateColor}>{gateLabel}</span>
                        </div>
                      </div>
                      <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${statusStyle.bg} ${statusStyle.color} ${statusStyle.border}`}>
                        {statusStyle.label}
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          </section>

          {/* Follow-up Reminders */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">跟进提醒</h2>
              <Link href="/people" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                查看全部
              </Link>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
              {followUps.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">暂无跟进提醒。</div>
              ) : (
                followUps.slice(0, 6).map((item) => {
                  const statusStyle = getStatusStyle(item.status);
                  const diffDays = item.diff_days;
                  const isOverdue = diffDays !== undefined && diffDays < 0;
                  const isUpcoming = diffDays !== undefined && diffDays >= 0 && diffDays <= 7;
                  return (
                    <Link
                      key={item.id}
                      href={`/people/${item.id}`}
                      className="flex items-start justify-between gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {item.title}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span className={isOverdue ? 'text-red-600 dark:text-red-400' : isUpcoming ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                            {isOverdue ? `已逾期 ${Math.abs(diffDays)} 天` : isUpcoming ? `即将到期（${diffDays} 天后）` : diffDays !== undefined ? `已安排（${diffDays} 天后）` : '未设置日期'}
                          </span>
                        </div>
                      </div>
                      <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${statusStyle.bg} ${statusStyle.color} ${statusStyle.border}`}>
                        {statusStyle.label}
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          </section>

          {/* Quick Actions */}
          <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">快速操作</h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Link
                  href="/entities/decision/new"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm hover:shadow-md"
                >
                  <span aria-hidden="true">+</span>
                  <span>新建决策</span>
                </Link>
                <Link
                  href="/entities/evidence/new"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm hover:shadow-md"
                >
                  <span aria-hidden="true">+</span>
                  <span>新建证据</span>
                </Link>
                <Link
                  href="/workspace"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm hover:shadow-md"
                >
                  <span aria-hidden="true">+</span>
                  <span>工作台</span>
                </Link>
              </div>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">记录一个决策、添加支持证据或打开工作台。</p>
            </div>
          </section>

          {/* Data Management: export / import / trash */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">数据管理</h2>
            <DataManagement />
          </section>

          {/* Active Research */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">活跃研究</h2>
              <Link href="/research" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                查看全部
              </Link>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
              {activeResearch.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">暂无活跃研究。</div>
              ) : (
                activeResearch.slice(0, 5).map((item) => {
                  const typeConf = getTypeConfig(item.type);
                  return (
                    <Link
                      key={item.id}
                      href={getTypeHref(item.type, item.id)}
                      className="flex items-center justify-between gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.title}
                        </span>
                      </div>
                      <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${typeConf.bg} ${typeConf.color} border-gray-200 dark:border-gray-700`}>
                        {typeConf.label}
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          </section>

          {/* Current Projects */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">当前项目</h2>
              <Link href="/projects" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                查看全部
              </Link>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
              {activeProjects.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">暂无活跃项目。</div>
              ) : (
                activeProjects.slice(0, 5).map((item) => {
                  const typeConf = getTypeConfig(item.type);
                  return (
                    <Link
                      key={item.id}
                      href={getTypeHref(item.type, item.id)}
                      className="flex items-center justify-between gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.title}
                        </span>
                      </div>
                      <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${typeConf.bg} ${typeConf.color} border-gray-200 dark:border-gray-700`}>
                        {typeConf.label}
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          </section>

          {/* Capital Summary */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">资本</h2>
              <Link href="/capital" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                查看全部
              </Link>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              {!capitalSummary || capitalSummary.count === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">暂无资本条目。</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">总条目数</span>
                    <span className="font-medium text-gray-900 dark:text-white">{capitalSummary.count}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">最近更新</span>
                    <span className="font-medium text-gray-900 dark:text-white">{capitalSummary.latest_updated ? new Date(capitalSummary.latest_updated).toLocaleDateString() : '-'}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                    {capitalSummary.items.slice(0, 4).map((item) => (
                      <Link
                        key={item.id}
                        href={getTypeHref(item.type, item.id)}
                        className="flex items-center justify-between gap-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded transition-colors"
                      >
                        <span className="text-sm text-gray-900 dark:text-white truncate">{item.title}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(item.updated_at).toLocaleDateString()}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Recent Events */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">近期事件</h2>
              <Link href="/events" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                查看全部
              </Link>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
              {recentEvents.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">暂无事件。</div>
              ) : (
                recentEvents.slice(0, 5).map((item) => {
                  const typeConf = getTypeConfig(item.type);
                  return (
                    <Link
                      key={item.id}
                      href={`/events/${item.id}`}
                      className="flex items-center justify-between gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.title}
                        </span>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {typeConf.label} · Updated {new Date(item.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </section>

          {/* Next Actions */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">下一步行动</h2>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
              {nextActions.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">暂无下一步行动。</div>
              ) : (
                nextActions.map((item) => {
                  const typeConf = getTypeConfig(item.type);
                  return (
                    <Link
                      key={`${item.type}-${item.id}`}
                      href={getTypeHref(item.type, item.id)}
                      className="flex items-center justify-between gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.title}
                        </span>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {typeConf.label} · Updated {new Date(item.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
