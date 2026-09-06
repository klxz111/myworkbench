'use client';

import { useEffect, useState } from 'react';
import { getStoredTheme, toggleTheme, useIsDarkTheme, type ThemeMode } from '@/lib/theme';

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>('system');

  useEffect(() => {
    setMode(getStoredTheme());
  }, []);

  const handleToggle = () => {
    const next = toggleTheme();
    setMode(next);
  };

  const isDark = useIsDarkTheme();

  return (
    <button
      onClick={handleToggle}
      // isDark 挂载后才同步 DOM 状态，SSR 与首次渲染一致，避免 hydration 不匹配
      title={`当前：${isDark ? '暗色' : '浅色'}（存储偏好：${mode}）`}
      className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
      aria-label="切换明暗主题"
    >
      {isDark ? (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.36 6.36l-.7-.7M6.34 6.34l-.7-.7m12.72 0l-.7.7M6.34 17.66l-.7.7M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
}
