import { listEntities, EntityType, EntityFile } from './markdown';

export type ProfileVersionKey = 'academic' | 'mlsys' | 'industry' | 'bold';

export interface ProfileVersionSpec {
  key: ProfileVersionKey;
  label: string;
  title: string;
  description: string;
  audience: string;
}

export const PROFILE_VERSIONS: ProfileVersionSpec[] = [
  {
    key: 'academic',
    label: 'Academic',
    title: '学术档案',
    description: '面向学术共同体：研究议程、实验证据与理论贡献。',
    audience: '学术招聘委员会、博士导师、合作研究者',
  },
  {
    key: 'mlsys',
    label: 'MLSys',
    title: 'ML Systems 档案',
    description: '面向系统方向：训练基础设施、性能工程与系统实践。',
    audience: 'ML Infra / 训练系统团队',
  },
  {
    key: 'industry',
    label: 'Industry',
    title: '工业界档案',
    description: '面向行业：项目落地、工程能力与协作网络。',
    audience: '科技公司、工程与产品团队',
  },
  {
    key: 'bold',
    label: 'BOLD',
    title: 'BOLD 档案',
    description: '面向长期押注：机会布局、前沿信号与关键决策记录。',
    audience: '创始人、Program Manager、基金与孵化器',
  },
];

export interface ProfileHighlight {
  text: string;
  refs: { id: string; type: string; title: string }[];
}

export interface CompiledProfileVersion {
  key: ProfileVersionKey;
  label: string;
  title: string;
  description: string;
  target_audience: string;
  summary: string;
  highlights: ProfileHighlight[];
  stats: { label: string; value: number }[];
  compiled_from: string[];
  compiled_at: string;
}

type Fn = EntityFile & { frontmatter: Record<string, unknown> };

function fm(entity: EntityFile): Record<string, unknown> {
  return entity.frontmatter as unknown as Record<string, unknown>;
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function num(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

function loadAll(): {
  research: Fn[];
  projects: Fn[];
  experiments: Fn[];
  capitals: Fn[];
  opportunities: Fn[];
  radar: Fn[];
  decisions: Fn[];
  people: Fn[];
} {
  return {
    research: listEntities('research' as EntityType) as Fn[],
    projects: listEntities('project' as EntityType) as Fn[],
    experiments: listEntities('experiment' as EntityType) as Fn[],
    capitals: listEntities('capital' as EntityType) as Fn[],
    opportunities: listEntities('opportunity' as EntityType) as Fn[],
    radar: listEntities('radar' as EntityType) as Fn[],
    decisions: listEntities('decision' as EntityType) as Fn[],
    people: listEntities('person' as EntityType) as Fn[],
  };
}

function ref(e: EntityFile) {
  return { id: e.id, type: e.type, title: e.frontmatter.title };
}

function activeOnly(items: Fn[]): Fn[] {
  return items.filter((e) => (str(fm(e).status) || 'active') !== 'archived');
}

function scoreFor(capitals: Fn[], key: string): number | null {
  let total = 0;
  let count = 0;
  for (const c of capitals) {
    const v = num(fm(c)[key]);
    if (v !== null) {
      total += v;
      count++;
    }
  }
  return count > 0 ? total / count : null;
}

function compileAcademic(d: ReturnType<typeof loadAll>): CompiledProfileVersion {
  const spec = PROFILE_VERSIONS[0];
  const highlights: ProfileHighlight[] = [];
  const compiledFrom: string[] = [];

  for (const r of activeOnly(d.research)) {
    const q = str(fm(r).core_questions).split('\n')[0];
    highlights.push({ text: q ? `${r.frontmatter.title} —— ${q}` : String(r.frontmatter.title), refs: [ref(r)] });
    compiledFrom.push(r.id);
  }
  for (const e of activeOnly(d.experiments).slice(0, 6)) {
    const interp = str(fm(e).interpretation) || str(fm(e).hypothesis);
    highlights.push({ text: interp ? `${e.frontmatter.title}（${interp.slice(0, 80)}）` : String(e.frontmatter.title), refs: [ref(e)] });
    compiledFrom.push(e.id);
  }
  const beliefs = activeOnly(listEntities('belief' as EntityType) as Fn[]).filter((b) => str(fm(b).confidence) === 'high');
  for (const b of beliefs.slice(0, 3)) {
    highlights.push({ text: `核心信念：${b.frontmatter.title}`, refs: [ref(b)] });
    compiledFrom.push(b.id);
  }

  const academicScore = scoreFor(d.capitals, 'academic');
  const stats = [
    { label: '研究议程', value: d.research.length },
    { label: '实验', value: d.experiments.length },
    { label: '高置信信念', value: beliefs.length },
  ];
  if (academicScore !== null) stats.push({ label: '学术资本均分', value: Math.round(academicScore * 10) / 10 });

  return {
    ...spec,
    target_audience: spec.audience,
    summary: `推进 ${d.research.length} 项研究议程，完成 ${d.experiments.length} 个实验，沉淀 ${beliefs.length} 条高置信信念。` +
      (academicScore !== null ? ` 学术资本自评 ${academicScore.toFixed(1)}/10。` : ''),
    highlights: highlights.slice(0, 10),
    stats,
    compiled_from: Array.from(new Set(compiledFrom)),
    compiled_at: new Date().toISOString(),
  };
}

function compileMlSys(d: ReturnType<typeof loadAll>): CompiledProfileVersion {
  const spec = PROFILE_VERSIONS[1];
  const highlights: ProfileHighlight[] = [];
  const compiledFrom: string[] = [];

  const mlsysRadar = d.radar.filter((r) => ['ml_systems', 'ai_research', 'hardware'].includes(str(fm(r).category)));
  for (const p of activeOnly(d.projects)) {
    const hyp = str(fm(p).hypothesis);
    highlights.push({ text: hyp ? `${p.frontmatter.title} —— ${hyp.slice(0, 80)}` : String(p.frontmatter.title), refs: [ref(p)] });
    compiledFrom.push(p.id);
  }
  for (const e of activeOnly(d.experiments).slice(0, 5)) {
    const setup = str(fm(e).setup) || str(fm(e).result);
    highlights.push({ text: setup ? `${e.frontmatter.title}（${setup.slice(0, 80)}）` : String(e.frontmatter.title), refs: [ref(e)] });
    compiledFrom.push(e.id);
  }
  for (const r of mlsysRadar.slice(0, 4)) {
    highlights.push({ text: `追踪信号：${r.frontmatter.title}`, refs: [ref(r)] });
    compiledFrom.push(r.id);
  }

  const technicalScore = scoreFor(d.capitals, 'technical');
  const researchScore = scoreFor(d.capitals, 'research');
  const stats = [
    { label: '项目', value: d.projects.length },
    { label: '实验', value: d.experiments.length },
    { label: 'MLSys 相关信号', value: mlsysRadar.length },
  ];
  if (technicalScore !== null) stats.push({ label: '技术资本均分', value: Math.round(technicalScore * 10) / 10 });
  if (researchScore !== null) stats.push({ label: '研究资本均分', value: Math.round(researchScore * 10) / 10 });

  return {
    ...spec,
    target_audience: spec.audience,
    summary: `交付 ${d.projects.length} 个项目、${d.experiments.length} 个实验，追踪 ${mlsysRadar.length} 条 MLSys 前沿信号。` +
      (technicalScore !== null ? ` 技术资本自评 ${technicalScore.toFixed(1)}/10。` : ''),
    highlights: highlights.slice(0, 10),
    stats,
    compiled_from: Array.from(new Set(compiledFrom)),
    compiled_at: new Date().toISOString(),
  };
}

function compileIndustry(d: ReturnType<typeof loadAll>): CompiledProfileVersion {
  const spec = PROFILE_VERSIONS[2];
  const highlights: ProfileHighlight[] = [];
  const compiledFrom: string[] = [];

  const industryOpps = d.opportunities.filter((o) =>
    ['company', 'internship', 'startup', 'oss'].includes(str(fm(o).category))
  );
  for (const p of activeOnly(d.projects).slice(0, 5)) {
    highlights.push({ text: String(p.frontmatter.title), refs: [ref(p)] });
    compiledFrom.push(p.id);
  }
  for (const o of industryOpps.slice(0, 4)) {
    highlights.push({ text: `行业机会：${o.frontmatter.title}`, refs: [ref(o)] });
    compiledFrom.push(o.id);
  }
  const strongPeople = d.people.filter((p) => str(fm(p).relationship_strength) === 'strong');
  for (const p of strongPeople.slice(0, 4)) {
    const org = str(fm(p).organization);
    highlights.push({ text: org ? `${p.frontmatter.title}（${org}）` : String(p.frontmatter.title), refs: [ref(p)] });
    compiledFrom.push(p.id);
  }

  const industryScore = scoreFor(d.capitals, 'industry');
  const networkScore = scoreFor(d.capitals, 'network');
  const stats = [
    { label: '项目', value: d.projects.length },
    { label: '行业机会', value: industryOpps.length },
    { label: '强关系人脉', value: strongPeople.length },
  ];
  if (industryScore !== null) stats.push({ label: '产业资本均分', value: Math.round(industryScore * 10) / 10 });
  if (networkScore !== null) stats.push({ label: '人脉资本均分', value: Math.round(networkScore * 10) / 10 });

  return {
    ...spec,
    target_audience: spec.audience,
    summary: `累计 ${d.projects.length} 个项目实践、${industryOpps.length} 个行业机会与 ${strongPeople.length} 条强关系人脉。` +
      (networkScore !== null ? ` 人脉资本自评 ${networkScore.toFixed(1)}/10。` : ''),
    highlights: highlights.slice(0, 10),
    stats,
    compiled_from: Array.from(new Set(compiledFrom)),
    compiled_at: new Date().toISOString(),
  };
}

function compileBold(d: ReturnType<typeof loadAll>): CompiledProfileVersion {
  const spec = PROFILE_VERSIONS[3];
  const highlights: ProfileHighlight[] = [];
  const compiledFrom: string[] = [];

  const rankedOpps = [...d.opportunities]
    .sort((a, b) => (num(fm(b).strategic_fit) ?? -1) - (num(fm(a).strategic_fit) ?? -1));
  for (const o of rankedOpps.slice(0, 5)) {
    const fit = num(fm(o).strategic_fit);
    highlights.push({
      text: fit !== null ? `${o.frontmatter.title}（战略契合 ${fit}/10）` : String(o.frontmatter.title),
      refs: [ref(o)],
    });
    compiledFrom.push(o.id);
  }
  const highSignals = d.radar.filter((r) => str(fm(r).signal_strength) === 'high');
  for (const r of highSignals.slice(0, 4)) {
    highlights.push({ text: `高强度信号：${r.frontmatter.title}`, refs: [ref(r)] });
    compiledFrom.push(r.id);
  }
  const settled = d.decisions.filter((x) => !!str(fm(x).verdict));
  for (const dec of settled.slice(0, 4)) {
    const verdictMap: Record<string, string> = {
      confirmed: '成立',
      partially_confirmed: '部分成立',
      invalidated: '被推翻',
      inconclusive: '待定',
    };
    const v = verdictMap[str(fm(dec).verdict)] || str(fm(dec).verdict);
    highlights.push({ text: `关键决策：${dec.frontmatter.title}（判定：${v}）`, refs: [ref(dec)] });
    compiledFrom.push(dec.id);
  }

  const stats = [
    { label: '机会布局', value: d.opportunities.length },
    { label: '高强度信号', value: highSignals.length },
    { label: '已判定决策', value: settled.length },
  ];

  return {
    ...spec,
    target_audience: spec.audience,
    summary: `布局 ${d.opportunities.length} 个机会（Top 契合 ${rankedOpps.length > 0 ? num(fm(rankedOpps[0]).strategic_fit) ?? '—' : '—'}/10），追踪 ${highSignals.length} 条高强度信号，沉淀 ${settled.length} 个已判定决策。`,
    highlights: highlights.slice(0, 10),
    stats,
    compiled_from: Array.from(new Set(compiledFrom)),
    compiled_at: new Date().toISOString(),
  };
}

const COMPILERS: Record<ProfileVersionKey, (d: ReturnType<typeof loadAll>) => CompiledProfileVersion> = {
  academic: compileAcademic,
  mlsys: compileMlSys,
  industry: compileIndustry,
  bold: compileBold,
};

export function compileProfileVersion(key: ProfileVersionKey): CompiledProfileVersion {
  return COMPILERS[key](loadAll());
}

export function compileAllProfileVersions(): Record<ProfileVersionKey, CompiledProfileVersion> {
  const data = loadAll();
  const out = {} as Record<ProfileVersionKey, CompiledProfileVersion>;
  for (const key of Object.keys(COMPILERS) as ProfileVersionKey[]) {
    out[key] = COMPILERS[key](data);
  }
  return out;
}
