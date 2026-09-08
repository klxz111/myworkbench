import { describe, it, expect } from 'vitest';
import { stableHash } from '../sync';

describe('stableHash', () => {
  it('确定性（相同输入相同输出）', () => {
    const h1 = stableHash({ title: 'x', tags: ['a', 'b'] }, 'content');
    const h2 = stableHash({ title: 'x', tags: ['a', 'b'] }, 'content');
    expect(h1).toBe(h2);
  });
  it('顶层 key 顺序无关', () => {
    const h1 = stableHash({ title: 'x', status: 'active' }, 'c');
    const h2 = stableHash({ status: 'active', title: 'x' }, 'c');
    expect(h1).toBe(h2);
  });
  it('嵌套对象 key 顺序无关（gate 等递归排序）', () => {
    const h1 = stableHash({ title: 'x', gate: { a: 1, b: 2 } }, 'c');
    const h2 = stableHash({ gate: { b: 2, a: 1 }, title: 'x' }, 'c');
    expect(h1).toBe(h2);
  });
  it('content 不同则 hash 不同', () => {
    const h1 = stableHash({ title: 'x' }, 'content-a');
    const h2 = stableHash({ title: 'x' }, 'content-b');
    expect(h1).not.toBe(h2);
  });
  it('frontmatter 字段变化则 hash 不同', () => {
    const h1 = stableHash({ title: 'x' }, 'c');
    const h2 = stableHash({ title: 'y' }, 'c');
    expect(h1).not.toBe(h2);
  });
});