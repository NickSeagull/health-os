export interface GoalsFile {
  version: number;
  okr_ref: string;
  phases: Phase[];
  directions: HealthDirection[];
  fitness_target: FitnessTarget;
  cost_summary: CostSummary;
}

export interface Phase {
  id: string;
  name: string;
  period: string;
  priority: "high" | "medium" | "normal";
  directions: string[];
}

export interface HealthDirection {
  area: string;
  kr: string;
  phase: string;
  status: "investigating" | "not_started" | "monitoring" | "in_progress" | "resolved";
  goal: string;
  last_activity: string;
  cost_estimate_rub: number;
  cost_actual_rub: number;
  milestones: Milestone[];
  related_visits: string[];
  related_labs: string[];
}

export interface Milestone {
  id: string;
  title: string;
  /** Values from the data; data-schemas.md lists a different set (documentation mismatch). */
  type: "visit" | "lab" | "procedure" | "action" | "metric" | "treatment";
  status: "not_started" | "in_progress" | "completed" | "blocked" | "cancelled" | "skipped";
  deadline?: string;
  oms_available?: boolean;
  cost_estimate_rub?: number;
  cost_actual_rub?: number;
  todoist_task_id?: string;
  depends_on?: string[];
  notes?: string;
  completed_date?: string;
}

export interface FitnessTarget {
  workouts_per_month: number;
  target_weight_kg: number;
  target_body_fat_pct: number;
  current_mode: string;
  training_type: string;
  training_frequency: string;
}

export interface CostSummary {
  total_estimate_rub: number;
  total_actual_rub: number;
  by_phase: Record<string, { estimate: number; actual: number }>;
  oms_savings_estimate_rub: number;
}
