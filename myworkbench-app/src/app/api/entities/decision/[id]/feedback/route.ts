import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { readEntity, writeEntity, listEntities, resolveEntityPath, isValidSlug, EntityType } from '@/lib/markdown';
import { createEntity, syncMarkdownToSqlite } from '@/lib/sync';

export const runtime = 'nodejs';

type Verdict = 'confirmed' | 'partially_confirmed' | 'invalidated' | 'inconclusive';

const VERDICT_LABELS: Record<Verdict, string> = {
  confirmed: '假设成立',
  partially_confirmed: '部分成立',
  invalidated: '假设被推翻',
  inconclusive: '尚无定论',
};

const VERDICT_CONFIDENCE: Record<Verdict, string | undefined> = {
  confirmed: 'high',
  partially_confirmed: 'medium',
  invalidated: 'low',
  inconclusive: undefined,
};

const VERDICT_EVIDENCE_STRENGTH: Record<Verdict, string> = {
  confirmed: 'strong',
  partially_confirmed: 'moderate',
  invalidated: 'strong',
  inconclusive: 'weak',
};

interface FeedbackBody {
  verdict?: Verdict;
  actual_result?: string;
  belief_update?: string;
  target_belief_ids?: string[];
  create_evidence?: boolean;
}

function nextEvidenceSlug(): string {
  let max = 0;
  for (const e of listEntities('evidence' as EntityType)) {
    const m = e.slug.match(/^evidence-(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  // 并发创建时 max+1 可能撞上已存在文件，跳到下一个空位
  let slug = `evidence-${String(max + 1).padStart(4, '0')}`;
  while (fs.existsSync(resolveEntityPath('evidence' as EntityType, slug))) {
    max++;
    slug = `evidence-${String(max + 1).padStart(4, '0')}`;
  }
  return slug;
}

function appendBeliefLog(content: string, entry: string): string {
  const section = '## 信念更新记录';
  const logLine = `- ${entry}`;
  if (content.includes(section)) {
    return `${content.replace(/\s*$/, '')}\n${logLine}\n`;
  }
  return `${content.replace(/\s*$/, '')}\n\n${section}\n\n${logLine}\n`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as FeedbackBody;

    const verdict = body.verdict as Verdict;
    // hasOwnProperty 而非 in：'constructor' 等原型链 key 会绕过白名单
    if (!verdict || !Object.prototype.hasOwnProperty.call(VERDICT_LABELS, verdict)) {
      return NextResponse.json({ error: '缺少或非法的 verdict' }, { status: 400 });
    }
    if (!body.actual_result || !body.actual_result.trim()) {
      return NextResponse.json({ error: '缺少 actual_result' }, { status: 400 });
    }

    const decision = readEntity('decision' as EntityType, id);
    if (!decision) {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 });
    }

    const beliefIds = (body.target_belief_ids || []).filter(Boolean);
    for (const beliefId of beliefIds) {
      const belief = readEntity('belief' as EntityType, beliefId);
      if (!belief) {
        return NextResponse.json({ error: `Belief not found: ${beliefId}` }, { status: 404 });
      }
    }

    const now = new Date().toISOString().slice(0, 10);
    const createdEvidenceIds: string[] = [];

    // 1. 新建结果证据实体（evidence → belief: informs，evidence → decision: result_of）
    if (body.create_evidence !== false && beliefIds.length > 0) {
      const slug = nextEvidenceSlug();
      const evidenceData = {
        id: slug,
        type: 'evidence',
        title: `决策结果：${decision.frontmatter.title}`,
        status: 'active',
        tags: ['decision-feedback', id],
        source_type: 'observation',
        date: now,
        summary: body.actual_result.trim().slice(0, 200),
        strength: VERDICT_EVIDENCE_STRENGTH[verdict],
        linked_beliefs: beliefIds,
        relations: beliefIds.length > 0 ? [{ to: id, type: 'result_of' }] : [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const evidenceContent = `由决策 [${decision.frontmatter.title}](/decisions/${id}) 的实际结果自动记录。\n\n判定：${VERDICT_LABELS[verdict]}\n\n${body.actual_result.trim()}`;
      const evidence = createEntity('evidence' as EntityType, slug, {
        ...evidenceData,
        content: evidenceContent,
      } as Parameters<typeof createEntity>[2]);
      createdEvidenceIds.push(evidence.id);
    }

    // 2. 更新决策本身：actual_result / belief_update / verdict / result_recorded_at
    const decisionFm = { ...decision.frontmatter };
    decisionFm.actual_result = body.actual_result.trim();
    if (body.belief_update && body.belief_update.trim()) {
      decisionFm.belief_update = body.belief_update.trim();
    }
    decisionFm.verdict = verdict;
    decisionFm.result_recorded_at = now;
    decisionFm.updated_at = new Date().toISOString();
    writeEntity('decision' as EntityType, id, decisionFm, decision.content);

    // 3. 反哺关联信念：调整 confidence + 追加更新记录 + 关联新证据
    const updatedBeliefs: string[] = [];
    for (const beliefId of beliefIds) {
      const belief = readEntity('belief' as EntityType, beliefId)!;
      const fm = { ...belief.frontmatter };
      const newConfidence = VERDICT_CONFIDENCE[verdict];
      if (newConfidence) {
        fm.confidence = newConfidence;
      }
      if (createdEvidenceIds.length > 0) {
        const linked = Array.isArray(fm.linked_evidence) ? [...(fm.linked_evidence as string[])] : [];
        for (const eid of createdEvidenceIds) {
          if (!linked.includes(eid)) linked.push(eid);
        }
        fm.linked_evidence = linked;
      }
      fm.updated_at = new Date().toISOString();

      const logParts = [
        `**${now}** 来自决策 [${decision.frontmatter.title}](/decisions/${id})（判定：${VERDICT_LABELS[verdict]}）`,
        `结果：${body.actual_result.trim()}`,
      ];
      if (body.belief_update && body.belief_update.trim()) {
        logParts.push(`信念更新：${body.belief_update.trim()}`);
      }
      if (createdEvidenceIds.length > 0) {
        logParts.push(`证据：[${createdEvidenceIds.join('、')}](/evidence/${createdEvidenceIds[0]})`);
      }

      writeEntity('belief' as EntityType, beliefId, fm, appendBeliefLog(belief.content, logParts.join(' — ')));
      updatedBeliefs.push(beliefId);
    }

    // 4. 重建 SQLite 缓存（实体行 + 关系）
    syncMarkdownToSqlite();

    return NextResponse.json({
      success: true,
      decision_id: id,
      verdict,
      verdict_label: VERDICT_LABELS[verdict],
      updated_beliefs: updatedBeliefs,
      created_evidence: createdEvidenceIds,
    });
  } catch (error) {
    console.error('Error recording decision feedback:', error);
    return NextResponse.json({ error: 'Failed to record feedback' }, { status: 500 });
  }
}
