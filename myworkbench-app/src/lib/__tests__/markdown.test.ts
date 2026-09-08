import { describe, it, expect } from 'vitest';
import { isValidSlug, isKnownEntityType } from '../markdown';

describe('isValidSlug', () => {
  it('合法 slug', () => {
    expect(isValidSlug('strategy-0001')).toBe(true);
    expect(isValidSlug('a')).toBe(true);
    expect(isValidSlug('decision_001-x')).toBe(true);
  });
  it('路径穿越拒绝', () => {
    expect(isValidSlug('../etc')).toBe(false);
    expect(isValidSlug('a/b')).toBe(false);
    expect(isValidSlug('a\\b')).toBe(false);
    expect(isValidSlug('..')).toBe(false);
  });
  it('非法字符拒绝', () => {
    expect(isValidSlug('a<b')).toBe(false);
    expect(isValidSlug('a>b')).toBe(false);
    expect(isValidSlug('a:b')).toBe(false);
    expect(isValidSlug('a"b')).toBe(false);
    expect(isValidSlug('a|b')).toBe(false);
    expect(isValidSlug('a?b')).toBe(false);
    expect(isValidSlug('a*b')).toBe(false);
  });
  it('空/点/非字符串拒绝', () => {
    expect(isValidSlug('')).toBe(false);
    expect(isValidSlug('.')).toBe(false);
    expect(isValidSlug(null)).toBe(false);
    expect(isValidSlug(123)).toBe(false);
  });
});

describe('isKnownEntityType', () => {
  it('已知类型', () => {
    expect(isKnownEntityType('strategy')).toBe(true);
    expect(isKnownEntityType('task')).toBe(true);
    expect(isKnownEntityType('idea')).toBe(true);
  });
  it('未知类型', () => {
    expect(isKnownEntityType('notatype')).toBe(false);
  });
  it('原型链安全（hasOwnProperty）', () => {
    expect(isKnownEntityType('toString')).toBe(false);
    expect(isKnownEntityType('constructor')).toBe(false);
    expect(isKnownEntityType('hasOwnProperty')).toBe(false);
  });
});