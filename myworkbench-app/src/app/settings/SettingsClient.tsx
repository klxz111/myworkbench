'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui';
import {
  getStartPage,
  setStartPage,
  getEditorMode,
  setEditorMode,
  getIdentity,
  setIdentity,
  resetHomeLayout,
  setPins,
  EDITOR_MODE_KEY,
  NOTIFY_ENABLED_KEY,
  IdentityPrefs,
  EditorModePref,
} from '@/lib/prefs';
import { getStoredTheme, setTheme, ThemeMode } from '@/lib/theme';

/**
 * 设置中心：把散落各处的浏览器本地偏好收拢到一页。
 * 全部偏好只写 localStorage（mwbench_* 键），不写入 Markdown 数据。
 */

const START_PAGE_OPTIONS: { value: string; label: string }[] = [
  { value: '/', label: '首页（今日工作台）' },
  { value: '/today', label: '今日' },
  { value: '/tasks', label: '任务' },
  { value: '/calendar', label: '日历' },
  { value: '/board', label: '看板' },
  { value: '/decisions', label: '决策' },
  { value: '/stats', label: '统计' },
];

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
  { value: 'system', label: '跟随系统' },
];

const EDITOR_OPTIONS: { value: EditorModePref; label: string }[] = [
  { value: 'edit', label: '编辑' },
  { value: 'split', label: '分屏（左编辑右预览）' },
  { value: 'preview', label: '预览' },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="section-title mb-4">{title}</h2>
      {children}
    </section>
  );
}

export function SettingsClient() {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [startPage, setStartPageState] = useState('/');
  const [editorMode, setEditorModeState] = useState<EditorModePref>('split');
  const [identity, setIdentityForm] = useState<IdentityPrefs>({ name: '', focus: '', deadline_label: '', deadline_date: '' });
  const [pushEnabled, setPushEnabled] = useState(false);
  const [permission, setPermission] = useState<string>('default');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setThemeState(getStoredTheme());
    setStartPageState(getStartPage());
    setEditorModeState(getEditorMode());
    setIdentityForm(getIdentity());
    try {
      setPushEnabled(localStorage.getItem(NOTIFY_ENABLED_KEY) === '1');
    } catch {
      /* 忽略 */
    }
    if (typeof Notification !== 'undefined') setPermission(Notification.permission);
  }, []);

  const flash = (text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(''), 2500);
  };

  const applyThemeMode = (mode: ThemeMode) => {
    setTheme(mode);
    setThemeState(mode);
  };

  const saveIdentity = () => {
    setIdentity(identity);
    flash('个人印记已保存 ✓');
  };

  const togglePush = async () => {
    if (pushEnabled) {
      try {
        localStorage.setItem(NOTIFY_ENABLED_KEY, '0');
      } catch {
        /* 忽略 */
      }
      setPushEnabled(false);
      return;
    }
    if (typeof Notification === 'undefined') {
      alert('当前浏览器不支持桌面通知');
      return;
    }
    let perm = Notification.permission;
    if (perm === 'default') perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm === 'granted') {
      try {
        localStorage.setItem(NOTIFY_ENABLED_KEY, '1');
      } catch {
        /* 忽略 */
      }
      setPushEnabled(true);
    } else {
      alert('浏览器通知权限被拒绝，将只显示应用内角标提醒。');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="设置" description="偏好只保存在当前浏览器（localStorage），不会写入 Markdown 数据" />

      {notice && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          {notice}
        </div>
      )}

      <Section title="外观">
        <div className="flex flex-wrap gap-2">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => applyThemeMode(opt.value)}
              className={theme === opt.value ? 'btn-primary' : 'btn-secondary'}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="起始页">
        <div className="max-w-xs">
          <select
            className="field"
            value={startPage}
            onChange={(e) => {
              setStartPage(e.target.value);
              setStartPageState(e.target.value);
              flash('起始页已更新 ✓');
            }}
          >
            {START_PAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">点击左上角 Logo / M 标记时打开起始页。</p>
      </Section>

      <Section title="编辑器默认模式">
        <div className="max-w-xs">
          <select
            className="field"
            value={editorMode}
            onChange={(e) => {
              const mode = e.target.value as EditorModePref;
              setEditorMode(mode);
              setEditorModeState(mode);
            }}
          >
            {EDITOR_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
          所有 Markdown 内容编辑框（键 {EDITOR_MODE_KEY}）打开时的默认视图。
        </p>
      </Section>

      <Section title="通知">
        <div className="flex items-center gap-3">
          <button onClick={togglePush} className={pushEnabled ? 'btn-primary' : 'btn-secondary'}>
            {pushEnabled ? '推送已开启' : '开启桌面推送'}
          </button>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {permission === 'denied'
              ? '通知权限被拒绝，仅显示应用内角标提醒'
              : pushEnabled
              ? '到期事项会通过浏览器通知推送（每 5 分钟检查一次）'
              : '开启后到期事项会推送浏览器通知'}
          </span>
        </div>
      </Section>

      <Section title="个人印记">
        <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">名字（用于首页问候）</span>
            <input
              className="input"
              value={identity.name}
              onChange={(e) => setIdentityForm({ ...identity, name: e.target.value })}
              placeholder="例如：小张"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">本周焦点（一句话）</span>
            <input
              className="input"
              value={identity.focus}
              onChange={(e) => setIdentityForm({ ...identity, focus: e.target.value })}
              placeholder="例如：搞定RL论文的开头两节"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">关键 DDL 名称</span>
            <input
              className="input"
              value={identity.deadline_label}
              onChange={(e) => setIdentityForm({ ...identity, deadline_label: e.target.value })}
              placeholder="例如：申请截止"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">DDL 日期</span>
            <input
              type="date"
              className="input"
              value={identity.deadline_date}
              onChange={(e) => setIdentityForm({ ...identity, deadline_date: e.target.value })}
            />
          </label>
        </div>
        <button onClick={saveIdentity} className="mt-4 btn-primary">
          保存个人印记
        </button>
      </Section>

      <Section title="首页布局">
        <div className="flex flex-wrap gap-2">
          <Link href="/?edit=1" className="btn-secondary">
            进入编辑模式
          </Link>
          <button
            onClick={() => {
              resetHomeLayout();
              flash('已恢复默认布局，刷新首页生效 ✓');
            }}
            className="btn-ghost"
          >
            恢复默认布局
          </button>
          <button
            onClick={() => {
              setPins([]);
              flash('已清空全部置顶 ✓');
            }}
            className="btn-ghost"
          >
            清空置顶
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
          编辑模式下可以隐藏卡片、调整列内顺序；置顶实体在首页「置顶」卡片里管理。
        </p>
      </Section>

      <Section title="数据">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          导出 / 导入工作台数据（含附件）的入口在{' '}
          <Link href="/trash" className="text-accent-600 dark:text-accent-400 hover:underline">
            回收站
          </Link>{' '}
          页顶部；所有 Markdown 原文件始终是唯一数据源。
        </p>
      </Section>
    </div>
  );
}
