import { describe, it, expect } from 'vitest';
import { safeJoin } from '../workspace-path';

describe('safeJoin', () => {
  it('正常相对路径解析', () => {
    expect(safeJoin('/root/ws', 'a/b.md')).toBe('/root/ws/a/b.md');
  });
  it('单层文件', () => {
    expect(safeJoin('/root/ws', 'x.md')).toBe('/root/ws/x.md');
  });
  it('.. 穿越抛错', () => {
    expect(() => safeJoin('/root/ws', '../evil.md')).toThrow();
  });
  it('兄弟目录前缀逃逸抛错（workspace-evil）', () => {
    expect(() => safeJoin('/root/ws', '../ws-evil/x.md')).toThrow();
  });
  it('空路径抛错', () => {
    expect(() => safeJoin('/root/ws', '')).toThrow();
  });
  it('绝对路径抛错', () => {
    expect(() => safeJoin('/root/ws', '/etc/passwd')).toThrow();
  });
});