import { describe, it, expect } from 'vitest';
import { extractWikiRefs, extractWikiIds, resolveWikiLinks } from '../wiki-links';

describe('extractWikiRefs', () => {
  it('提取 [[id]]', () => {
    expect(extractWikiRefs('参见 [[strategy-0001]]')).toEqual([
      { id: 'strategy-0001', alias: undefined },
    ]);
  });
  it('提取 [[id|别名]]', () => {
    expect(extractWikiRefs('参见 [[strategy-0001|长期策略]]')).toEqual([
      { id: 'strategy-0001', alias: '长期策略' },
    ]);
  });
  it('多个引用', () => {
    expect(extractWikiRefs('[[a]] 和 [[b|c]]')).toEqual([
      { id: 'a', alias: undefined },
      { id: 'b', alias: 'c' },
    ]);
  });
});

describe('extractWikiIds', () => {
  it('去重', () => {
    expect(extractWikiIds('[[a]] 和 [[a]] 和 [[b]]')).toEqual(['a', 'b']);
  });
});

describe('resolveWikiLinks', () => {
  it('解析成功 → markdown 链接', () => {
    const out = resolveWikiLinks('[[strategy-0001]]', () => ({
      type: 'strategy',
      title: '长期策略',
    }));
    expect(out).toBe('[长期策略](/strategy/strategy-0001)');
  });
  it('别名优先于 title', () => {
    const out = resolveWikiLinks('[[strategy-0001|别名]]', () => ({
      type: 'strategy',
      title: '长期策略',
    }));
    expect(out).toBe('[别名](/strategy/strategy-0001)');
  });
  it('未解析 → 占位斜体', () => {
    const out = resolveWikiLinks('[[unknown-id]]', () => null);
    expect(out).toBe('*⟨未链接：unknown-id⟩*');
  });
});