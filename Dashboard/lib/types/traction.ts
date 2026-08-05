export interface TractionReview {
  ts: string;
  type: "baseline" | "weekly" | "monthly";
  period: string;
  directions_summary: DirectionSummary[];
  fitness: {
    workouts_this_month: number;
    target: number;
    mode: string;
  };
  cost_this_period_rub: number;
  cost_total_rub: number;
  cost_estimate_total_rub: number;
  highlights: string[];
  blockers: string[];
}

export interface DirectionSummary {
  kr: string;
  area: string;
  status: string;
  milestones_done: number;
  milestones_total: number;
  last_activity: string;
  cost_actual: number;
}
