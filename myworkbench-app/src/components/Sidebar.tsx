'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CommandPalette } from '@/components/CommandPalette';
import { NotificationBell } from '@/components/NotificationBell';
import { ThemeToggle } from '@/components/ThemeToggle';

/**
 * 全站页面框架：桌面左侧分组侧边栏 + 移动端顶栏/抽屉。
 * 分组顺序即日常工作流：执行 → 思考 → 资产 → 记录 → 回顾。
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

function openPalette() {
  window.dispatchEvent(new CustomEvent('mwbench:open-palette'));
}

function isActive(pathname: string | null, href: string): boolean {
  return href === '/' ? pathname === '/' : Boolean(pathname && (pathname === href || pathname.startsWith(href + '/')));
}

function NavGroups({ pathname, onNavigate }: { pathname: string | null; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={`block px-2 py-1.5 rounded-md text-sm transition-colors ${
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
        </div>
      ))}
    </nav>
  );
}

function SidebarTools({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <button
        onClick={openPalette}
        className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-600 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
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
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/60 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        回收站
      </Link>
      <div className="flex items-center gap-1 px-1">
        <NotificationBell />
        <ThemeToggle />
      </div>
    </>
  );
}

export function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <>
      <CommandPalette />
      <div className="min-h-screen flex">
        {/* 桌面侧边栏 */}
        <aside className="hidden md:flex md:flex-col w-60 shrink-0 sticky top-0 h-screen border-r border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40">
          <Link href="/" className="flex items-center px-4 h-16 text-lg font-bold text-gray-900 dark:text-white shrink-0">
            myworkbench
          </Link>
          <div className="px-3 pb-2 shrink-0">
            <SidebarTools />
          </div>
          <NavGroups pathname={pathname} />
        </aside>

        {/* 移动端：顶栏 + 抽屉 */}
        <div className="flex-1 min-w-0 flex flex-col min-h-screen">
          <header className="md:hidden sticky top-0 z-40 flex items-center justify-between h-14 px-4 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur">
            <Link href="/" className="text-lg font-bold text-gray-900 dark:text-white">
              myworkbench
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
                <div className="flex items-center px-4 h-14 border-b border-gray-200 dark:border-gray-800">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">myworkbench</span>
                </div>
                <div className="px-3 py-3 space-y-2 shrink-0">
                  <SidebarTools onNavigate={() => setDrawerOpen(false)} />
                </div>
                <NavGroups pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
              </div>
            </div>
          )}

          <main className="flex-1 w-full max-w-7xl mx-auto px-5 sm:px-8 py-8">{children}</main>
        </div>
      </div>
    </>
  );
}
