import { NextResponse } from 'next/server';
import { listEntities, EntityType } from '@/lib/markdown';
import { entityHref } from '@/lib/entity-paths';
import { syncMarkdownToSqlite } from '@/lib/sync';

export const runtime = 'nodejs';

/** 参与知识树定位的实体类型（evidence=文献笔记，树节点能看到支撑文献） */
const POSITION_TYPES: EntityType[] = ['research', 'profile', 'opportunity', 'task', 'evidence'];

export interface KnowledgePosition {
  type: EntityType;
  id: string;
  title: string;
  href: string;
  /** 智源知识树节点名列表（frontmatter.knowledge_tree） */
  nodes: string[];
}

/** 读取所有带 knowledge_tree 定位的实体（Markdown 为权威源） */
export async function GET() {
  try {
    syncMarkdownToSqlite();

    const positions: KnowledgePosition[] = [];
    for (const type of POSITION_TYPES) {
      for (const entity of listEntities(type)) {
        const fm = entity.frontmatter as Record<string, unknown>;
        const nodes = Array.isArray(fm.knowledge_tree)
          ? fm.knowledge_tree.map((v) => String(v).trim()).filter(Boolean)
          : [];
        if (nodes.length === 0) continue;
        positions.push({
          type,
          id: entity.id,
          title: String(fm.title || entity.id),
          href: entityHref(type, entity.id),
          nodes,
        });
      }
    }

    return NextResponse.json({ positions });
  } catch (error) {
    console.error('Error loading knowledge positions:', error);
    return NextResponse.json({ error: 'Failed to load knowledge positions' }, { status: 500 });
  }
}
