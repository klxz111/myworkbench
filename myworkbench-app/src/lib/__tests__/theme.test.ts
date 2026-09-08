import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getStoredTheme, systemPrefersDark, effectiveTheme, applyTheme, setTheme } from '../theme';

function mockWindow(overrides: { matchMedia?: Record<string, boolean> } = {}): void {
  const storage: Record<string, string> = {};
  const api = {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, value: string) => { storage[key] = value; },
    removeItem: (key: string) => { delete storage[key]; },
  };
  const win = {
    localStorage: api,
    matchMedia: (query: string) => ({
      matches: overrides.matchMedia?.[query] ?? false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  };
  vi.stubGlobal('window', win);
  vi.stubGlobal('localStorage', api);
}

function mockDocument(): void {
  const classes = new Set<string>();
  const doc = {
    documentElement: {
      classList: {
        add: (c: string) => classes.add(c),
        remove: (c: string) => classes.delete(c),
        contains: (c: string) => classes.has(c),
        toggle: (c: string, force?: boolean) => force ? classes.add(c) : classes.delete(c),
      },
    },
  };
  vi.stubGlobal('document', doc);
}

describe('getStoredTheme', () => {
  beforeEach(() => {
    mockWindow();
  });

  it('未设置返回 system', () => {
    expect(getStoredTheme()).toBe('system');
  });

  it('合法值返回对应模式', () => {
    localStorage.setItem('mwbench_theme', 'dark');
    expect(getStoredTheme()).toBe('dark');
  });

  it('非法值返回 system', () => {
    localStorage.setItem('mwbench_theme', 'funky');
    expect(getStoredTheme()).toBe('system');
  });
});

describe('systemPrefersDark', () => {
  beforeEach(() => {
    mockWindow({ matchMedia: { '(prefers-color-scheme: dark)': true } });
  });

  it('暗色系统返回 true', () => {
    expect(systemPrefersDark()).toBe(true);
  });
});

describe('effectiveTheme', () => {
  beforeEach(() => {
    mockWindow();
  });

  it('light/dark 直接透传', () => {
    expect(effectiveTheme('light')).toBe('light');
    expect(effectiveTheme('dark')).toBe('dark');
  });

  it('system 跟随 matchMedia', () => {
    mockWindow({ matchMedia: { '(prefers-color-scheme: dark)': true } });
    expect(effectiveTheme('system')).toBe('dark');
    mockWindow({ matchMedia: { '(prefers-color-scheme: dark)': false } });
    expect(effectiveTheme('system')).toBe('light');
  });
});

describe('applyTheme', () => {
  beforeEach(() => {
    mockDocument();
    document.documentElement.classList.remove('dark');
  });

  it('dark 模式添加 class', () => {
    applyTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('light 模式移除 class', () => {
    document.documentElement.classList.add('dark');
    applyTheme('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});

describe('setTheme', () => {
  beforeEach(() => {
    mockDocument();
    mockWindow();
    document.documentElement.classList.remove('dark');
  });

  it('写入 localStorage 并应用 class', () => {
    setTheme('dark');
    expect(localStorage.getItem('mwbench_theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
