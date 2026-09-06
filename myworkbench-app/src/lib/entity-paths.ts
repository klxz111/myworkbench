/** 实体类型 → 前端详情路由前缀（type 为单数实体类型名） */
export const ENTITY_HREFS: Record<string, string> = {
  strategy: '/strategy',
  decision: '/decisions',
  research: '/research',
  evidence: '/evidence',
  project: '/projects',
  experiment: '/experiment',
  belief: '/belief',
  person: '/people',
  opportunity: '/opportunity',
  radar: '/radar',
  capital: '/capital',
  profile: '/profile',
  event: '/events',
  organization: '/organizations',
  task: '/entities/task',
};

/** 实体类型 → 中文名 */
export const ENTITY_LABELS: Record<string, string> = {
  strategy: '策略',
  decision: '决策',
  research: '研究',
  evidence: '证据',
  project: '项目',
  experiment: '实验',
  belief: '信念',
  person: '人员',
  opportunity: '机会',
  radar: '雷达',
  capital: '资本',
  profile: '个人档案',
  event: '事件',
  organization: '组织',
  task: '任务',
};

/** 实体类型 → 列表页路由（大多数类型与详情前缀相同；task 的列表页是 /tasks） */
export const ENTITY_LIST_HREFS: Record<string, string> = {
  ...ENTITY_HREFS,
  task: '/tasks',
};

export function entityHref(type: string, id: string): string {
  return `${ENTITY_HREFS[type] || '/entities'}/${id}`;
}
