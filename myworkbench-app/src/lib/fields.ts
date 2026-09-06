export interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'markdown' | 'select' | 'tags' | 'date' | 'number' | 'list';
  options?: string[];
  /** select 选项的中文显示名（value 仍是 options 里的原始值） */
  option_labels?: Record<string, string>;
  hint?: string;
}

/** 循环频率选项（task/event 共用；value 与 date-utils 的 RecurrenceFreq 对应） */
export const RECURRENCE_OPTIONS = ['daily', 'weekly', 'biweekly', 'monthly', 'yearly'];
export const RECURRENCE_LABELS: Record<string, string> = {
  daily: '每天',
  weekly: '每周',
  biweekly: '每两周',
  monthly: '每月',
  yearly: '每年',
};

export const COMMON_FIELDS: FieldDef[] = [
  { key: 'title', label: '标题', type: 'text' },
  { key: 'status', label: '状态', type: 'select', options: ['active', 'archived', 'draft'] },
  { key: 'tags', label: '标签', type: 'tags' },
  { key: 'content', label: '内容', type: 'markdown' },
];

export const COMMON_KEYS = new Set([
  'id',
  'type',
  'slug',
  'title',
  'status',
  'tags',
  'created_at',
  'updated_at',
  'content',
  'relations',
]);

export const CAPITAL_DIMENSIONS = [
  { key: 'financial', label: '金融' },
  { key: 'academic', label: '学术' },
  { key: 'technical', label: '技术' },
  { key: 'research', label: '研究' },
  { key: 'industry', label: '产业' },
  { key: 'network', label: '人脉' },
  { key: 'geographic', label: '地理' },
  { key: 'institutional', label: '机构' },
] as const;

const SCORE_OPTIONS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

export const TYPE_SPECIFIC_FIELDS: Record<string, FieldDef[]> = {
  decision: [
    { key: 'context', label: '背景', type: 'textarea' },
    { key: 'question', label: '问题', type: 'text' },
    { key: 'current_belief', label: '当前信念', type: 'textarea' },
    { key: 'decision', label: '决策', type: 'textarea' },
    { key: 'expected_outcome', label: '预期结果', type: 'textarea' },
    { key: 'actual_result', label: '实际结果', type: 'textarea' },
    { key: 'belief_update', label: '信念更新', type: 'textarea' },
    { key: 'verdict', label: '判定结论', type: 'select', options: ['confirmed', 'partially_confirmed', 'invalidated', 'inconclusive'] },
  ],
  evidence: [
    { key: 'source_type', label: '来源类型', type: 'select', options: ['paper', 'news', 'policy', 'company', 'experiment', 'conversation', 'market', 'observation'] },
    { key: 'source_url', label: '来源链接', type: 'text' },
    { key: 'date', label: '日期', type: 'date' },
    { key: 'summary', label: '摘要', type: 'textarea' },
    { key: 'strength', label: '强度', type: 'select', options: ['strong', 'moderate', 'weak'] },
  ],
  belief: [
    { key: 'description', label: '描述', type: 'textarea' },
    { key: 'confidence', label: '置信度', type: 'select', options: ['high', 'medium', 'low'] },
  ],
  strategy: [
    { key: 'horizon', label: '时间范围', type: 'text' },
  ],
  project: [
    { key: 'hypothesis', label: '假设', type: 'textarea' },
    { key: 'start_date', label: '开始日期', type: 'date' },
    { key: 'end_date', label: '结束日期', type: 'date' },
  ],
  research: [
    { key: 'identity', label: '研究身份', type: 'textarea' },
    { key: 'core_questions', label: '核心问题', type: 'textarea' },
    { key: 'knowledge_tree', label: '知识树定位', type: 'list', hint: '智源 AI 知识树节点名（逗号分隔），保存后 /knowledge 页会高亮你的研究定位' },
  ],
  person: [
    { key: 'organization', label: '组织', type: 'text' },
    { key: 'role', label: '角色', type: 'text' },
    { key: 'relationship_strength', label: '关系强度', type: 'select', options: ['strong', 'medium', 'weak'] },
    { key: 'next_action_date', label: '下次跟进日期', type: 'date', hint: '设置后首页「待跟进」与到期提醒会追踪该日期' },
  ],
  opportunity: [
    { key: 'category', label: '类别', type: 'select', options: ['research', 'internship', 'scholarship', 'fellowship', 'phd', 'postdoc', 'company', 'lab', 'advisor', 'oss', 'startup', 'conference'] },
    { key: 'strategic_fit', label: '战略契合度 (1-10)', type: 'number' },
    { key: 'research_fit', label: '研究契合度 (1-10)', type: 'number' },
    { key: 'option_value', label: '期权价值', type: 'textarea' },
    { key: 'cost', label: '成本', type: 'text' },
    { key: 'risk', label: '风险', type: 'text' },
    { key: 'timing', label: '时机', type: 'text' },
    { key: 'deadline', label: '截止日期', type: 'date' },
    { key: 'knowledge_tree', label: '知识树定位', type: 'list', hint: '该机会覆盖的智源知识树节点名（逗号分隔）' },
  ],
  experiment: [
    { key: 'hypothesis', label: '假设', type: 'textarea' },
    { key: 'config', label: '配置摘要', type: 'textarea', hint: '模型 / 数据 / 关键超参，一行一项' },
    { key: 'metrics', label: '指标结果', type: 'textarea', hint: '一行一项，如 accuracy: 0.82' },
    { key: 'setup', label: '设置', type: 'textarea' },
    { key: 'result', label: '结果', type: 'textarea' },
    { key: 'failure_mode', label: '失败模式', type: 'textarea' },
    { key: 'interpretation', label: '解读', type: 'textarea' },
    { key: 'follow_up', label: '后续跟进', type: 'textarea' },
    { key: 'artifacts', label: '产物链接', type: 'textarea', hint: 'wandb / 日志 / 代码，一行一个' },
  ],
  idea: [
    // 覆盖 COMMON status：想法生命周期（/ideas 看板按此分列）
    { key: 'status', label: '状态', type: 'select', options: ['idea', 'exploring', 'validating', 'adopted', 'shelved'], option_labels: { idea: '想法', exploring: '调研中', validating: '验证中', adopted: '已立项', shelved: '已搁置' } },
    { key: 'hypothesis', label: '一句话假设', type: 'textarea', hint: '如果 X，那么 Y（要可验证）' },
    { key: 'novelty', label: '新颖性', type: 'select', options: ['high', 'medium', 'low'], option_labels: { high: '高', medium: '中', low: '低' } },
    { key: 'feasibility', label: '可行性', type: 'select', options: ['high', 'medium', 'low'], option_labels: { high: '高', medium: '中', low: '低' } },
    { key: 'related', label: '相关工作 / 验证实验', type: 'textarea', hint: '文献笔记、实验卡片或 wiki 链接，一行一个' },
    { key: 'next_step', label: '下一步动作', type: 'text' },
    { key: 'knowledge_tree', label: '知识树定位', type: 'list', hint: '该想法覆盖的智源知识树节点名（逗号分隔）' },
  ],
  radar: [
    { key: 'category', label: '类别', type: 'select', options: ['ai_research', 'frontier_lab', 'company', 'university', 'hardware', 'ml_systems', 'robotics', 'funding', 'policy', 'immigration', 'ecosystem'] },
    { key: 'signal_strength', label: '信号强度', type: 'select', options: ['high', 'medium', 'low'] },
    { key: 'impact', label: '影响', type: 'textarea' },
  ],
  capital: [
    { key: 'period_start', label: '周期开始', type: 'date' },
    { key: 'period_end', label: '周期结束', type: 'date' },
    ...CAPITAL_DIMENSIONS.map((d) => ({
      key: d.key,
      label: `${d.label}资本 (0-10)`,
      type: 'select' as const,
      options: SCORE_OPTIONS,
    })),
  ],
  profile: [
    { key: 'versions', label: '版本 (JSON)', type: 'textarea' },
    { key: 'compiled_from', label: '编译来源', type: 'text' },
    { key: 'knowledge_tree', label: '知识树定位', type: 'list', hint: '智源 AI 知识树节点名（逗号分隔），保存后 /knowledge 页会高亮你的定位' },
  ],
  event: [
    { key: 'event_date', label: '事件日期', type: 'date' },
    { key: 'recurrence', label: '重复', type: 'select', options: RECURRENCE_OPTIONS, option_labels: RECURRENCE_LABELS, hint: '设置后日历会展开显示未来的发生日' },
    { key: 'recurrence_until', label: '重复截止', type: 'date', hint: '可选，循环到此日期为止' },
    { key: 'location', label: '地点', type: 'text' },
    { key: 'event_type', label: '事件类型', type: 'text' },
  ],
  organization: [
    { key: 'industry', label: '行业', type: 'text' },
    { key: 'location', label: '地点', type: 'text' },
    { key: 'website', label: '网站', type: 'text' },
  ],
  task: [
    // 覆盖 COMMON_FIELDS 的 status：任务生命周期为 todo/doing/done
    { key: 'status', label: '状态', type: 'select', options: ['todo', 'doing', 'done', 'archived'] },
    { key: 'due_date', label: '截止日期', type: 'date' },
    { key: 'recurrence', label: '重复', type: 'select', options: RECURRENCE_OPTIONS, option_labels: RECURRENCE_LABELS, hint: '设置后完成任务会自动把截止日期推进到下一周期，日历展开显示未来发生日' },
    { key: 'recurrence_until', label: '重复截止', type: 'date', hint: '可选，循环到此日期为止' },
    { key: 'priority', label: '优先级', type: 'select', options: ['high', 'medium', 'low'] },
    { key: 'notes', label: '备注', type: 'textarea' },
    { key: 'knowledge_tree', label: '知识树定位', type: 'list', hint: '任务涉及的智源知识树节点名（逗号分隔）' },
  ],
};