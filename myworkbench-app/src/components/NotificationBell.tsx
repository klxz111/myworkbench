'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { NOTIFY_ENABLED_KEY } from '@/lib/prefs';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  kind: string;
  kind_label?: string;
  due_date: string;
  diff_days: number;
  href: string;
}

interface NotificationsResponse {
  overdue_count: number;
  upcoming_count: number;
  items: NotificationItem[];
}

const POLL_INTERVAL_MS = 5 * 60 * 1000;
const NOTIFIED_IDS_KEY = 'mwbench_notified_ids';

function loadNotifiedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(NOTIFIED_IDS_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveNotifiedIds(ids: Set<string>) {
  try {
    const arr = Array.from(ids).slice(-200);
    localStorage.setItem(NOTIFIED_IDS_KEY, JSON.stringify(arr));
  } catch {
    // localStorage 不可用时静默降级为仅角标提醒
  }
}

/**
 * 到期提醒铃铛。
 * placement：弹层锚定方向——'right'（默认，弹层右对齐按钮，适合顶栏右侧）；
 * 'left'（弹层左对齐按钮向右展开，适合侧边栏/抽屉等靠左位置，避免伸出屏幕被截断）。
 */
export function NotificationBell({ placement = 'right' }: { placement?: 'right' | 'left' }) {
  const [data, setData] = useState<NotificationsResponse | null>(null);
  const [open, setOpen] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [permission, setPermission] = useState<string>('default');
  const containerRef = useRef<HTMLDivElement>(null);

  const pushNewItems = useCallback((items: NotificationItem[]) => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const notified = loadNotifiedIds();
    for (const item of items) {
      if (notified.has(item.id)) continue;
      const due = item.diff_days < 0 ? `已逾期 ${Math.abs(item.diff_days)} 天` : `${item.diff_days} 天后到期`;
      try {
        new Notification(`myworkbench：${item.kind_label || '到期提醒'}`, {
          body: `${item.title}（${due}）`,
          tag: item.id,
        });
        notified.add(item.id);
      } catch {
        break;
      }
    }
    saveNotifiedIds(notified);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const json: NotificationsResponse = await res.json();
      setData(json);
      if (pushEnabled) {
        pushNewItems(json.items);
      }
    } catch {
      // 网络失败时保留上次数据
    }
  }, [pushEnabled, pushNewItems]);

  useEffect(() => {
    const enabled = localStorage.getItem(NOTIFY_ENABLED_KEY) === '1';
    setPushEnabled(enabled);
    if (typeof Notification !== 'undefined') {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchData]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTogglePush = async () => {
    if (pushEnabled) {
      localStorage.setItem(NOTIFY_ENABLED_KEY, '0');
      setPushEnabled(false);
      return;
    }
    if (typeof Notification === 'undefined') {
      alert('当前浏览器不支持桌面通知');
      return;
    }
    let perm = Notification.permission;
    if (perm === 'default') {
      perm = await Notification.requestPermission();
    }
    setPermission(perm);
    if (perm === 'granted') {
      localStorage.setItem(NOTIFY_ENABLED_KEY, '1');
      setPushEnabled(true);
      if (data) pushNewItems(data.items);
    } else {
      alert('浏览器通知权限被拒绝，将只显示应用内角标提醒。');
    }
  };

  const overdue = data?.overdue_count ?? 0;
  const upcoming = data?.upcoming_count ?? 0;
  const total = overdue + upcoming;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        title="到期提醒"
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {overdue > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {overdue}
          </span>
        )}
        {overdue === 0 && upcoming > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
            {upcoming}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute mt-2 w-80 card shadow-lg z-50 max-h-96 overflow-y-auto scroll-thin ${placement === 'left' ? 'left-0' : 'right-0'}`}>
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              到期提醒（{total}）
            </span>
            <button
              onClick={handleTogglePush}
              className={`text-xs px-2 py-1 rounded ${
                pushEnabled
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {pushEnabled ? '推送已开启' : '开启推送'}
            </button>
          </div>
          {!data || data.items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              暂无到期事项
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {data.items.map((item) => (
                <li key={`${item.kind}-${item.id}`}>
                  <a
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          item.diff_days < 0
                            ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                        }`}
                      >
                        {item.kind_label || item.kind}
                      </span>
                      <span className="text-xs text-gray-400">
                        {item.diff_days < 0
                          ? `逾期 ${Math.abs(item.diff_days)} 天`
                          : `${item.diff_days} 天后`}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-200">{item.title}</p>
                    <p className="text-xs text-gray-400">到期：{item.due_date}</p>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
