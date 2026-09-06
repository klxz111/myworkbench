/**
 * 中英混排字数统计（写作向）：CJK 按字计、拉丁按词计。
 * 统计前粗剥离代码块/行内代码/链接语法，避免符号干扰。
 */
export function countWords(text: string): { words: number; chars: number } {
  const clean = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`\n]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_~|]+/g, ' ');
  const cjk = (clean.match(/[\u3400-\u9fff\uf900-\ufaff]/g) || []).length;
  const latinWords = (clean.match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g) || []).length;
  return { words: cjk + latinWords, chars: text.replace(/\s/g, '').length };
}
