'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CommandPalette } from '@/components/CommandPalette';
import { NotificationBell } from '@/components/NotificationBell';
import { ThemeToggle } from '@/components/ThemeToggle';

const PRIMARY_ITEMS = [
  { href: '/', label: 'HOME' },
  { href: '/today', label: 'TODAY' },
  { href: '/tasks', label: 'TASKS' },
  { href: '/strategy', label: 'STRATEGY' },
  { href: '/decisions', label: 'DECISIONS' },
  { href: '/profile', label: 'PROFILE' },
];

const SECONDARY_ITEMS = [
  { href: '/research', label: 'RESEARCH' },
  { href: '/radar', label: 'RADAR' },
  { href: '/network', label: 'NETWORK' },
  { href: '/knowledge', label: '知识树' },
  { href: '/calendar', label: '日历' },
  { href: '/daily', label: '每日笔记' },
  { href: '/review', label: '每周回顾' },
];

export function Navigation() {
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 路由变化时收起移动端菜单
  useEffect(() => {
    setMobileOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  const moreActive = SECONDARY_ITEMS.some(
    (item) => item.href !== '/' && pathname?.startsWith(item.href)
  );

  const linkClass = (href: string) => {
    const active = href === '/' ? pathname === '/' : pathname?.startsWith(href);
    return `text-sm font-medium transition-colors ${
      active
        ? 'text-blue-600 dark:text-blue-400'
        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
    }`;
  };

  const mobileLinkClass = (href: string) => {
    const active = href === '/' ? pathname === '/' : pathname?.startsWith(href);
    return `block px-4 py-2.5 text-sm font-medium rounded-lg ${
      active
        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
    }`;
  };

  return (
    <>
      <CommandPalette />

      <nav className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
                myworkbench
              </Link>
              <div className="hidden md:flex items-center space-x-6">
                {PRIMARY_ITEMS.map((item) => (
                  <Link key={item.href} href={item.href} className={linkClass(item.href)}>
                    {item.label}
                  </Link>
                ))}
                <div ref={moreRef} className="relative">
                  <button
                    onClick={() => setMoreOpen(!moreOpen)}
                    className={`text-sm font-medium flex items-center gap-1 transition-colors ${
                      moreActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    更多
                    <svg className={`h-3 w-3 transition-transform ${moreOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {moreOpen && (
                    <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                      {SECONDARY_ITEMS.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMoreOpen(false)}
                          className={`block px-4 py-2 text-sm ${
                            moreActive && pathname?.startsWith(item.href)
                              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPaletteOpen(true)}
                title="搜索 / 命令面板 (Ctrl+K)"
                aria-label="打开命令面板"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-600 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="hidden lg:inline">搜索 / 命令</span>
                <kbd className="hidden lg:inline text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Ctrl K</kbd>
              </button>
              <NotificationBell />
              <ThemeToggle />
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="打开菜单"
                className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                {mobileOpen ? (
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
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-800 px-4 py-3 space-y-1 max-h-[70vh] overflow-y-auto">
            {PRIMARY_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className={mobileLinkClass(item.href)}>
                {item.label}
              </Link>
            ))}
            <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-gray-400 uppercase">更多</p>
            {SECONDARY_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className={mobileLinkClass(item.href)}>
                {item.label}
              </Link>
            ))}
            <button
              onClick={() => {
                setMobileOpen(false);
                setPaletteOpen(true);
              }}
              className="w-full text-left px-4 py-2.5 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              搜索 / 命令面板
            </button>
          </div>
        )}
      </nav>
    </>
  );
}
