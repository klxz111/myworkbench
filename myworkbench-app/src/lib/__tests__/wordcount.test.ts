import { describe, it, expect } from 'vitest';
import { countWords } from '../wordcount';

describe('countWords', () => {
  it('CJK 按字计、拉丁按词计', () => {
    const r = countWords('中文测试 hello world');
    expect(r.words).toBe(6);
    expect(r.chars).toBe(14);
  });
  it('剥离代码块', () => {
    const r = countWords('```js\nconst x = 1;\n```\n总结');
    expect(r.words).toBe(2);
  });
  it('剥离行内代码', () => {
    const r = countWords('这是 `inline code` 文本');
    expect(r.words).toBe(4);
  });
  it('剥离链接语法保留文字', () => {
    const r = countWords('[标题](https://example.com) 正文');
    expect(r.words).toBe(4);
  });
  it('剥离图片语法', () => {
    const r = countWords('![描述](/api/asset?path=x.png) 说明');
    expect(r.words).toBe(2);
  });
  it('chars 不含空白符', () => {
    const r = countWords('a b c');
    expect(r.chars).toBe(3);
  });
});