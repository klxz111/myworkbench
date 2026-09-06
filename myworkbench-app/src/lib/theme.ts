'use client';

import { useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

const KEY = 'mwbench_theme';

export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  const v = localStorage.getItem(KEY);
  return v === 'light' || v === 'dark' ? v : 'system';
}

export function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function effectiveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return mode;
}

export function applyTheme(mode: ThemeMode): void {
  const dark = effectiveTheme(mode) === 'dark';
  document.documentElement.classList.toggle('dark', dark);
}

export function setTheme(mode: ThemeMode): void {
  localStorage.setItem(KEY, mode);
  applyTheme(mode);
}

/** 订阅 <html> 的 .dark class，供组件渲染明暗相关 UI（SSR 时返回 false，避免 hydration 不一致） */
export function useIsDarkTheme(): boolean {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const sync = () => setIsDark(document.documentElement.classList.contains('dark'));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

/** 明暗直接切换，返回切换后的模式 */
export function toggleTheme(): 'light' | 'dark' {
  const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
  localStorage.setItem(KEY, next);
  applyTheme(next);
  return next;
}
