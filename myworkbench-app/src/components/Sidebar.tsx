'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CommandPalette } from '@/components/CommandPalette';
import { NotificationBell } from '@/components/NotificationBell';
import { ThemeToggle } from '@/components/ThemeToggle';
import { getStartPage } from '@/lib/prefs';

/**
 * 全站页面框架：桌面左侧分组侧边栏（可折叠二级下拉）+ 移动端顶栏/抽屉。
 * 分组顺序即日常工作流：执行 → 思考 → 资产 → 记录 → 回顾。
 * 折叠状态持久化在 localStorage（mwbench_nav_groups）；路由变化时自动展开当前组。
 */
const NAV_GROUPS: { label: string; items: { href: string; label: string }[] }[] = [
  {
    label: '执行',
    items: [
      { href: '/today', label: '今日' },
      { href: '/tasks', label: '任务' },
      { href: '/calendar', label: '日历' },
      { href: '/board', label: '看板' },
    ],
  },
  {
    label: '思考',
    items: [
      { href: '/decisions', label: '决策' },
      { href: '/evidence', label: '证据' },
      { href: '/belief', label: '信念' },
      { href: '/ideas', label: '想法看板' },
      { href: '/research', label: '研究' },
      { href: '/experiment', label: '实验' },
      { href: '/knowledge', label: '知识树' },
    ],
  },
  {
    label: '资产',
    items: [
      { href: '/strategy', label: '策略' },
      { href: '/opportunity', label: '机会' },
      { href: '/people', label: '人脉' },
      { href: '/organizations', label: '组织' },
      { href: '/capital', label: '资本' },
      { href: '/radar', label: '雷达' },
      { href: '/profile', label: '个人档案' },
    ],
  },
  {
    label: '记录',
    items: [
      { href: '/daily', label: '每日笔记' },
      { href: '/workspace', label: '工作台' },
      { href: '/rss', label: 'RSS 订阅' },
    ],
  },
  {
    label: '回顾',
    items: [
      { href: '/review', label: '每周回顾' },
      { href: '/stats', label: '统计' },
      { href: '/graph', label: '图谱' },
    ],
  },
];

const GROUPS_STORAGE_KEY = 'mwbench_nav_groups';

function openPalette() {
  window.dispatchEvent(new CustomEvent('mwbench:open-palette'));
}

function isActive(pathname: string | null, href: string): boolean {
  return href === '/' ? pathname === '/' : Boolean(pathname && (pathname === href || pathname.startsWith(href + '/')));
}

function groupOfPath(pathname: string | null): string | null {
  for (const group of NAV_GROUPS) {
    if (group.items.some((item) => isActive(pathname, item.href))) return group.label;
  }
  return null;
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

interface NavGroupsProps {
  pathname: string | null;
  expanded: Record<string, boolean>;
  onToggle: (label: string) => void;
  onNavigate?: () => void;
}

function NavGroups({ pathname, expanded, onToggle, onNavigate }: NavGroupsProps) {
  return (
    <nav className="flex-1 overflow-y-auto scroll-thin px-3 py-3 space-y-3">
      {NAV_GROUPS.map((group) => {
        const isOpen = Boolean(expanded[group.label]);
        const hasActive = group.items.some((item) => isActive(pathname, item.href));
        return (
          <div key={group.label}>
            <button
              onClick={() => onToggle(group.label)}
              className={`flex w-full items-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                hasActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
              aria-expanded={isOpen}
            >
              <span className="flex-1 text-left">{group.label}</span>
              <Chevron open={isOpen} />
            </button>
            {isOpen && (
              <ul className="mt-0.5 space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href} className="relative">
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-1 rounded-full bg-blue-500" aria-hidden="true" />
                      )}
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        className={`block px-3 py-1.5 rounded-md text-sm transition-colors ${
                          active
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function SidebarTools({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <button
        onClick={openPalette}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-600 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="flex-1 text-left">搜索 / 命令</span>
        <kbd className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Ctrl K</kbd>
      </button>
      <Link
        href="/trash"
        onClick={onNavigate}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/60 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        回收站
      </Link>
      <div className="flex items-center gap-1 px-1">
        <NotificationBell placement="left" />
        <ThemeToggle />
        <Link
          href="/settings"
          onClick={onNavigate}
          title="设置"
          aria-label="设置"
          className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Link>
      </div>
    </>
  );
}

function Brand() {
  // 品牌点击落到「起始页」偏好（默认 /，可在 /settings 修改）。
  // 点击时实时读取而非仅在挂载时读取：设置页修改后无需刷新即生效（Sidebar 在 SPA 导航中不会重挂载）。
  const router = useRouter();
  return (
    <Link
      href="/"
      onClick={(e) => {
        const start = getStartPage();
        if (start !== '/') {
          e.preventDefault();
          router.push(start);
        }
      }}
      className="flex items-center gap-2.5 px-4 h-16 shrink-0 group"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-bold shadow-sm group-hover:shadow transition-shadow">
        M
      </span>
      <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">myworkbench</span>
    </Link>
  );
}

export function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // 初始：读取持久化的折叠状态；默认全部收拢
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(GROUPS_STORAGE_KEY) || '{}');
      setExpanded(typeof saved === 'object' && saved ? saved : {});
    } catch {
      setExpanded({});
    }
  }, []);

  // 路由变化：自动展开当前所在的组
  useEffect(() => {
    const current = groupOfPath(pathname);
    if (current) {
      setExpanded((prev) => (prev[current] ? prev : { ...prev, [current]: true }));
    }
  }, [pathname]);

  const toggle = (label: string) => {
    setExpanded((prev) => {
      const next = { ...prev, [label]: !prev[label] };
      try {
        localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* 存储不可用时忽略 */
      }
      return next;
    });
  };

  return (
    <>
      <CommandPalette />
      <div className="min-h-screen flex">
        {/* 桌面侧边栏 */}
        <aside className="hidden md:flex md:flex-col w-60 shrink-0 sticky top-0 h-screen border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <Brand />
          <div className="px-3 pb-3 space-y-2 shrink-0">
            <SidebarTools />
          </div>
          <NavGroups pathname={pathname} expanded={expanded} onToggle={toggle} />
          <div className="px-4 py-3 text-[11px] text-gray-400 dark:text-gray-600 shrink-0 border-t border-gray-200 dark:border-gray-800">
            Personal Strategy Workbench
          </div>
        </aside>

        {/* 移动端：顶栏 + 抽屉 */}
        <div className="flex-1 min-w-0 flex flex-col min-h-screen">
          <header className="md:hidden sticky top-0 z-40 flex items-center justify-between h-14 px-4 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white text-xs font-bold">M</span>
              <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">myworkbench</span>
            </Link>
            <div className="flex items-center gap-1">
              <button
                onClick={openPalette}
                aria-label="打开命令面板"
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <NotificationBell />
              <ThemeToggle />
              <button
                onClick={() => setDrawerOpen(!drawerOpen)}
                aria-label="打开菜单"
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                {drawerOpen ? (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </header>

          {drawerOpen && (
            <div className="md:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
              <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
              <div className="relative w-64 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
                <div className="flex items-center px-2 h-14 border-b border-gray-200 dark:border-gray-800">
                  <Brand />
                </div>
                <div className="px-3 py-3 space-y-2 shrink-0">
                  <SidebarTools onNavigate={() => setDrawerOpen(false)} />
                </div>
                <NavGroups pathname={pathname} expanded={expanded} onToggle={toggle} onNavigate={() => setDrawerOpen(false)} />
              </div>
            </div>
          )}

          <main className="flex-1 w-full max-w-7xl mx-auto px-5 sm:px-8 py-8">{children}</main>
        </div>
      </div>
    </>
  );
}
