'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * 快速启动：一键拉起本机开发环境（WSL 终端 / VSCode Remote-WSL）。
 * 按钮来自服务端 .myworkbench/launcher.json（首次访问自动探测生成，可手工编辑）。
 */

interface LauncherButton {
  id: string;
  label: string;
  command: string;
  args: string[];
}

export function LauncherWidget() {
  const [buttons, setButtons] = useState<LauncherButton[] | null>(null);
  const [configPath, setConfigPath] = useState('');
  const [launching, setLaunching] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/launcher');
        if (res.ok) {
          const data = await res.json();
          setButtons(data.buttons || []);
          setConfigPath(data.configPath || '');
        }
      } catch {
        setButtons([]);
      }
    })();
  }, []);

  const run = useCallback(async (id: string, label: string) => {
    setLaunching(id);
    try {
      const res = await fetch('/api/launcher/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setNotice(res.ok ? `已启动：${label}` : '启动失败');
      window.setTimeout(() => setNotice(''), 2500);
    } finally {
      setLaunching(null);
    }
  }, []);

  return (
    <div>
      {buttons === null ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-1">检测本机环境...</p>
      ) : buttons.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-1">没有可用的启动项。</p>
      ) : (
        <div className="space-y-2">
          {buttons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => run(btn.id, btn.label)}
              disabled={launching === btn.id}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors text-left disabled:opacity-60"
            >
              <span className="text-sm font-medium text-gray-900 dark:text-white">{btn.label}</span>
              <span className="shrink-0 text-xs text-blue-600 dark:text-blue-400">
                {launching === btn.id ? '启动中...' : '启动 →'}
              </span>
            </button>
          ))}
        </div>
      )}
      {notice && <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">{notice}</p>}
      <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500 break-all" title={configPath}>
        启动命令来自 <code>{configPath.split(process.env.HOME || 'myworkbench-app').pop() || '.myworkbench/launcher.json'}</code>
        ，可手工编辑添加自定义命令。
      </p>
    </div>
  );
}
