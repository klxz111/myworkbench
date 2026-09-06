/**
 * Wiki 链接：正文中的 [[entity-id]] 或 [[entity-id|别名]]
 * 由服务端解析为真实路由链接；无法解析的保留占位文本。
 */

import { entityHref } from './entity-paths';

export const WIKI_LINK_RE = /\[\[([a-zA-Z0-9_\-]+)(?:\|([^\]\n]+))?\]\]/g;

export interface WikiRef {
  id: string;
  alias?: string;
}

export function extractWikiRefs(content: string): WikiRef[] {
  const refs: WikiRef[] = [];
  for (const match of content.matchAll(WIKI_LINK_RE)) {
    refs.push({ id: match[1], alias: match[2] });
  }
  return refs;
}

export function extractWikiIds(content: string): string[] {
  return Array.from(new Set(extractWikiRefs(content).map((r) => r.id)));
}

export interface WikiTarget {
  type: string;
  title: string;
}

/** 把正文里的 wiki 链接替换为 markdown 链接；未解析的 id 渲染为占位斜体 */
export function resolveWikiLinks(
  content: string,
  resolver: (id: string) => WikiTarget | null
): string {
  return content.replace(WIKI_LINK_RE, (_match, id: string, alias?: string) => {
    const target = resolver(id);
    if (!target) {
      return `*⟨未链接：${id}⟩*`;
    }
    const label = alias || target.title || id;
    return `[${label}](${entityHref(target.type, id)})`;
  });
}
