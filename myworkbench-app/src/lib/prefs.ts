/**
 * 浏览器本地偏好（localStorage）：个人化所需的轻量 UI 状态。
 * 数据本身永远以 Markdown 文件为唯一来源；这里只存偏好，不参与导出/同步。
 * 键名与安全读写统一在此封装，组件不要直接 localStorage.getItem。
 */

export interface HomeLayout {
  /** 被隐藏的 widget key */
  hidden: string[];
  /** 全部 widget key 的期望顺序（列归属由注册表决定，这里只管列内先后，含被隐藏的） */
  order: string[];
}

export interface PinnedItem {
  type: string;
  /** 实体 slug */
  id: string;
  title: string;
}

export interface IdentityPrefs {
  name: string;
  focus: string;
  deadline_label: string;
  /** YYYY-MM-DD */
  deadline_date: string;
}

export type EditorModePref = 'edit' | 'split' | 'preview';

const START_PAGE_KEY = 'mwbench_start_page';
const HOME_LAYOUT_KEY = 'mwbench_home_layout';
const PINS_KEY = 'mwbench_pinned';
const IDENTITY_KEY = 'mwbench_identity';

/** 与 ContentEditor / NotificationBell 内部读写的是同一个键 */
export const EDITOR_MODE_KEY = 'mwbench_content_editor_mode';
export const NOTIFY_ENABLED_KEY = 'mwbench_notify_enabled';

export const PIN_LIMIT = 8;

const START_PAGE_OPTIONS = ['/', '/today', '/tasks', '/calendar', '/board', '/decisions', '/stats'];

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 隐私模式等存储不可用时忽略 */
  }
}

/* ---------- 起始页 ---------- */

export function getStartPage(): string {
  if (typeof window === 'undefined') return '/';
  const v = localStorage.getItem(START_PAGE_KEY);
  return v && START_PAGE_OPTIONS.includes(v) ? v : '/';
}

export function setStartPage(href: string): void {
  try {
    localStorage.setItem(START_PAGE_KEY, href);
  } catch {
    /* 忽略 */
  }
}

/* ---------- 首页布局 ---------- */

export function getHomeLayout(): HomeLayout {
  const saved = readJson<Partial<HomeLayout>>(HOME_LAYOUT_KEY, {});
  return {
    hidden: Array.isArray(saved.hidden) ? saved.hidden.filter((k) => typeof k === 'string') : [],
    order: Array.isArray(saved.order) ? saved.order.filter((k) => typeof k === 'string') : [],
  };
}

export function setHomeLayout(layout: HomeLayout): void {
  writeJson(HOME_LAYOUT_KEY, layout);
}

export function resetHomeLayout(): void {
  try {
    localStorage.removeItem(HOME_LAYOUT_KEY);
  } catch {
    /* 忽略 */
  }
}

/* ---------- 置顶 ---------- */

export function getPins(): PinnedItem[] {
  const list = readJson<PinnedItem[]>(PINS_KEY, []);
  if (!Array.isArray(list)) return [];
  return list.filter((p) => p && typeof p.type === 'string' && typeof p.id === 'string' && typeof p.title === 'string');
}

export function setPins(pins: PinnedItem[]): void {
  writeJson(PINS_KEY, pins.slice(0, PIN_LIMIT));
}

/* ---------- 个人印记 ---------- */

export function getIdentity(): IdentityPrefs {
  const saved = readJson<Partial<IdentityPrefs>>(IDENTITY_KEY, {});
  return {
    name: typeof saved.name === 'string' ? saved.name : '',
    focus: typeof saved.focus === 'string' ? saved.focus : '',
    deadline_label: typeof saved.deadline_label === 'string' ? saved.deadline_label : '',
    deadline_date: typeof saved.deadline_date === 'string' ? saved.deadline_date : '',
  };
}

export function setIdentity(identity: IdentityPrefs): void {
  writeJson(IDENTITY_KEY, identity);
}

/* ---------- 编辑器默认模式 ---------- */

export function getEditorMode(): EditorModePref {
  if (typeof window === 'undefined') return 'split';
  const v = localStorage.getItem(EDITOR_MODE_KEY);
  return v === 'edit' || v === 'split' || v === 'preview' ? v : 'split';
}

export function setEditorMode(mode: EditorModePref): void {
  try {
    localStorage.setItem(EDITOR_MODE_KEY, mode);
  } catch {
    /* 忽略 */
  }
}
