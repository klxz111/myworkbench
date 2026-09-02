export type EntityStatus = 'active' | 'archived' | 'draft';

export interface BaseEntity {
  id: string;
  type: string;
  title: string;
  status?: EntityStatus;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface StrategyEntity extends BaseEntity {
  type: 'strategy';
  horizon?: string;
  objectives?: string[];
  constraints?: string[];
  key_results?: string[];
}

export interface ResearchEntity extends BaseEntity {
  type: 'research';
  identity?: string;
  branches?: string[];
  core_questions?: string[];
  literature?: string[];
}

export interface DecisionEntity extends BaseEntity {
  type: 'decision';
  context?: string;
  question?: string;
  options?: Array<{ label: string; pros: string[]; cons: string[] }>;
  evidence?: string[];
  current_belief?: string;
  decision?: string;
  expected_outcome?: string;
  gate?: {
    invalidate_if?: string;
    review_date?: string;
    pivot_signals?: string[];
  };
  actual_result?: string;
  belief_update?: string;
}

export interface ProjectEntity extends BaseEntity {
  type: 'project';
  hypothesis?: string;
  start_date?: string;
  end_date?: string;
  linked_experiments?: string[];
  linked_decisions?: string[];
  outcomes?: string[];
}

export interface ExperimentEntity extends BaseEntity {
  type: 'experiment';
  hypothesis?: string;
  setup?: string;
  configuration?: Record<string, unknown>;
  dataset?: string;
  hardware?: string[];
  result?: string;
  failure_mode?: string;
  interpretation?: string;
  follow_up?: string[];
}

export interface PersonEntity extends BaseEntity {
  type: 'person';
  organization?: string;
  role?: string;
  research_interests?: string[];
  relationship_strength?: 'strong' | 'medium' | 'weak';
  last_interaction?: string;
  next_action?: string;
}

export interface EvidenceEntity extends BaseEntity {
  type: 'evidence';
  source_type?:
    | 'paper'
    | 'news'
    | 'policy'
    | 'company'
    | 'experiment'
    | 'conversation'
    | 'market'
    | 'observation';
  source_url?: string;
  date?: string;
  summary?: string;
  strength?: 'strong' | 'moderate' | 'weak';
  linked_beliefs?: string[];
}

export interface OpportunityEntity extends BaseEntity {
  type: 'opportunity';
  category?:
    | 'research'
    | 'internship'
    | 'scholarship'
    | 'fellowship'
    | 'phd'
    | 'postdoc'
    | 'company'
    | 'lab'
    | 'advisor'
    | 'oss'
    | 'startup'
    | 'conference';
  strategic_fit?: number;
  research_fit?: number;
  capital_gain?: string[];
  option_value?: string;
  cost?: string;
  risk?: string;
  timing?: string;
  required_preparation?: string[];
  deadline?: string;
}

export interface RadarEntity extends BaseEntity {
  type: 'radar';
  category?:
    | 'ai_research'
    | 'frontier_lab'
    | 'company'
    | 'university'
    | 'hardware'
    | 'ml_systems'
    | 'robotics'
    | 'funding'
    | 'policy'
    | 'immigration'
    | 'ecosystem';
  signal_strength?: 'high' | 'medium' | 'low';
  impact?: string;
  linked_events?: string[];
  linked_decisions?: string[];
}

export interface CapitalEntry {
  category:
    | 'financial'
    | 'academic'
    | 'technical'
    | 'research'
    | 'industry'
    | 'network'
    | 'geographic'
    | 'institutional';
  amount?: number;
  description?: string;
  source?: string;
}

export interface CapitalEntity extends BaseEntity {
  type: 'capital';
  entries?: CapitalEntry[];
  total_score?: number;
  period_start?: string;
  period_end?: string;
}

export type Entity =
  | StrategyEntity
  | ResearchEntity
  | DecisionEntity
  | ProjectEntity
  | ExperimentEntity
  | PersonEntity
  | EvidenceEntity
  | OpportunityEntity
  | RadarEntity
  | CapitalEntity;
