/**
 * 文献笔记（论文）构造器：RSS「存为文献」/独立建文献共用。
 * 语义：evidence 实体 + source_type=paper + tags=['paper']；
 * status=draft 表示待读，读完 PUT status=active 归档进证据链。
 */

export interface PaperNoteInput {
  title: string;
  url?: string;
  summary?: string;
  /** YYYY-MM-DD */
  date?: string;
}

export interface PaperNoteDraft {
  data: Record<string, unknown>;
  content: string;
}

export const PAPER_TAG = 'paper';

export function buildPaperNote(input: PaperNoteInput): PaperNoteDraft {
  const data: Record<string, unknown> = {
    status: 'draft',
    tags: [PAPER_TAG],
    source_type: 'paper',
  };
  if (input.url) data.source_url = input.url;
  if (input.date) data.date = input.date;
  if (input.summary) data.summary = input.summary.slice(0, 800);

  const content = [
    '## TL;DR',
    '',
    '',
    '## 方法',
    '',
    '',
    '## 实验设置',
    '',
    '',
    '## 可借鉴点',
    '',
    '',
    '## 与我方向的关联',
    '',
    '',
    '## 疑问',
    '',
  ].join('\n');

  return { data, content };
}
