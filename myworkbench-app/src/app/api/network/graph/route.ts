import { NextResponse } from 'next/server';
import { initDb } from '@/lib/db';
import { listEntities, EntityType } from '@/lib/markdown';
import { buildRelations } from '@/lib/sync';
import { entityHref } from '@/lib/entity-paths';

export const runtime = 'nodejs';

export interface GraphNode {
  id: string;
  type: 'person' | 'organization';
  title: string;
  status: string;
  degree: number;
  // person 字段
  role?: string;
  organization?: string;
  relationship_strength?: string;
  // organization 字段
  industry?: string;
  location?: string;
  href: string;
  opportunities: {
    id: string;
    title: string;
    category: string;
    deadline: string;
    strategic_fit: string;
    href: string;
  }[];
}

export interface GraphEdge {
  from: string;
  to: string;
  relation: string;
}

function normalizeDeadline(v: unknown): string {
  if (typeof v === 'string') return v.slice(0, 10);
  if (v instanceof Date) {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${v.getFullYear()}-${p(v.getMonth() + 1)}-${p(v.getDate())}`;
  }
  return '';
}

/** 人员-组织点状网数据：节点、边、每节点关联的申请机会 */
export async function GET() {
  try {
    const db = initDb();

    // frontmatter 是权威源：取数前按最新 markdown 重建关系表（规模小，毫秒级）
    buildRelations();

    const people = listEntities('person' as EntityType);
    const orgs = listEntities('organization' as EntityType);
    const opportunities = listEntities('opportunity' as EntityType);
    const oppById = new Map(opportunities.map((o) => [o.id, o]));

    const relRows = db.prepare(`SELECT from_id, to_id, relation FROM relations`).all() as {
      from_id: string;
      to_id: string;
      relation: string;
    }[];

    const nodeIds = new Set([...people, ...orgs].map((e) => e.id));

    // 与人员/组织相连的机会（任意方向的边）
    const oppsByNode = new Map<string, GraphNode['opportunities']>();
    let opportunityLinks = 0;
    for (const rel of relRows) {
      let nodeId: string | null = null;
      let oppId: string | null = null;
      if (nodeIds.has(rel.from_id) && oppById.has(rel.to_id)) {
        nodeId = rel.from_id;
        oppId = rel.to_id;
      } else if (nodeIds.has(rel.to_id) && oppById.has(rel.from_id)) {
        nodeId = rel.to_id;
        oppId = rel.from_id;
      }
      if (!nodeId || !oppId) continue;
      opportunityLinks++;
      const o = oppById.get(oppId)!;
      const fm = o.frontmatter as Record<string, unknown>;
      const list = oppsByNode.get(nodeId) || [];
      list.push({
        id: o.id,
        title: o.frontmatter.title,
        category: String(fm.category || 'other'),
        deadline: normalizeDeadline(fm.deadline),
        strategic_fit: String(fm.strategic_fit ?? ''),
        href: entityHref('opportunity', o.id),
      });
      oppsByNode.set(nodeId, list);
    }

    const nodes: GraphNode[] = [...people, ...orgs].map((e) => {
      const fm = e.frontmatter as Record<string, unknown>;
      return {
        id: e.id,
        type: e.type as 'person' | 'organization',
        title: e.frontmatter.title,
        status: String(fm.status || 'active'),
        degree: 0,
        role: typeof fm.role === 'string' ? fm.role : undefined,
        organization: typeof fm.organization === 'string' ? fm.organization : undefined,
        relationship_strength:
          typeof fm.relationship_strength === 'string' ? fm.relationship_strength : undefined,
        industry: typeof fm.industry === 'string' ? fm.industry : undefined,
        location: typeof fm.location === 'string' ? fm.location : undefined,
        href: entityHref(e.type, e.id),
        opportunities: (oppsByNode.get(e.id) || []).sort((a, b) =>
          a.deadline.localeCompare(b.deadline)
        ),
      };
    });

    const edges: GraphEdge[] = relRows
      .filter((r) => nodeIds.has(r.from_id) && nodeIds.has(r.to_id) && r.from_id !== r.to_id)
      .map((r) => ({ from: r.from_id, to: r.to_id, relation: r.relation }));

    const degreeMap = new Map<string, number>();
    for (const e of edges) {
      degreeMap.set(e.from, (degreeMap.get(e.from) || 0) + 1);
      degreeMap.set(e.to, (degreeMap.get(e.to) || 0) + 1);
    }
    for (const n of nodes) n.degree = degreeMap.get(n.id) || 0;

    return NextResponse.json({
      nodes,
      edges,
      counts: {
        person: people.length,
        organization: orgs.length,
        edge: edges.length,
        opportunity_links: opportunityLinks,
      },
    });
  } catch (error) {
    console.error('Error building network graph:', error);
    return NextResponse.json({ error: 'Failed to build network graph' }, { status: 500 });
  }
}
