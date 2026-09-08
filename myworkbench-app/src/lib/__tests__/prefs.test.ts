import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getStarredEntities,
  isStarred,
  toggleStar,
  getPins,
  setPins,
  getIdentity,
  setIdentity,
  getHomeLayout,
  setHomeLayout,
  resetHomeLayout,
} from '../prefs';

function mockWindowAndStorage(): Record<string, string> {
  const storage: Record<string, string> = {};
  const api = {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, value: string) => { storage[key] = value; },
    removeItem: (key: string) => { delete storage[key]; },
    clear: () => { Object.keys(storage).forEach((k) => delete storage[k]); },
  };
  vi.stubGlobal('window', { localStorage: api });
  vi.stubGlobal('localStorage', api);
  return storage;
}

describe('prefs', () => {
  beforeEach(() => {
    mockWindowAndStorage();
  });

  describe('getStarredEntities / isStarred / toggleStar', () => {
    it('空列表返回 []', () => {
      expect(getStarredEntities()).toEqual([]);
    });

    it('toggleStar 添加星标', () => {
      toggleStar('strategy', 'strategy-0001');
      expect(getStarredEntities()).toEqual([{ type: 'strategy', id: 'strategy-0001' }]);
      expect(isStarred('strategy', 'strategy-0001')).toBe(true);
      expect(isStarred('belief', 'belief-0001')).toBe(false);
    });

    it('toggleStar 取消星标', () => {
      toggleStar('strategy', 'strategy-0001');
      toggleStar('strategy', 'strategy-0001');
      expect(getStarredEntities()).toEqual([]);
      expect(isStarred('strategy', 'strategy-0001')).toBe(false);
    });

    it('非法存储值降级为空', () => {
      localStorage.setItem('mwbench_starred_entities', 'not-json');
      expect(getStarredEntities()).toEqual([]);
    });

    it('非法条目被过滤', () => {
      localStorage.setItem('mwbench_starred_entities', JSON.stringify([{ type: 1, id: null }]));
      expect(getStarredEntities()).toEqual([]);
    });
  });

  describe('getPins / setPins', () => {
    it('空列表返回 []', () => {
      expect(getPins()).toEqual([]);
    });

    it('setPins 截断到上限', () => {
      const items = Array.from({ length: 20 }, (_, i) => ({ type: 'strategy', id: `s-${i}`, title: `S${i}` }));
      setPins(items as any);
      expect(getPins()).toHaveLength(8);
    });

    it('非法条目被过滤', () => {
      localStorage.setItem('mwbench_pinned', JSON.stringify([{ type: 1 }]));
      expect(getPins()).toEqual([]);
    });
  });

  describe('getIdentity / setIdentity', () => {
    it('默认返回空字符串', () => {
      expect(getIdentity()).toEqual({ name: '', focus: '', deadline_label: '', deadline_date: '' });
    });

    it('setIdentity 读写一致', () => {
      setIdentity({ name: 'Alice', focus: 'ML', deadline_label: '论文', deadline_date: '2026-12-01' });
      expect(getIdentity()).toEqual({ name: 'Alice', focus: 'ML', deadline_label: '论文', deadline_date: '2026-12-01' });
    });

    it('非法值回退默认', () => {
      localStorage.setItem('mwbench_identity', JSON.stringify({ name: 123, focus: null }));
      expect(getIdentity()).toEqual({ name: '', focus: '', deadline_label: '', deadline_date: '' });
    });
  });

  describe('getHomeLayout / setHomeLayout / resetHomeLayout', () => {
    it('默认返回空 hidden/order', () => {
      expect(getHomeLayout()).toEqual({ hidden: [], order: [] });
    });

    it('setHomeLayout 读写一致', () => {
      setHomeLayout({ hidden: ['insights'], order: ['today', 'overdue'] });
      expect(getHomeLayout()).toEqual({ hidden: ['insights'], order: ['today', 'overdue'] });
    });

    it('resetHomeLayout 清空', () => {
      setHomeLayout({ hidden: ['insights'], order: ['today'] });
      resetHomeLayout();
      expect(getHomeLayout()).toEqual({ hidden: [], order: [] });
    });

    it('非法数组字段被过滤', () => {
      localStorage.setItem('mwbench_home_layout', JSON.stringify({ hidden: 'bad', order: 123 }));
      expect(getHomeLayout()).toEqual({ hidden: [], order: [] });
    });
  });
});
