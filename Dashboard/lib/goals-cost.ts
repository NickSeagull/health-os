import type { GoalsFile } from "@/lib/types/goal";

/**
 * Recalculate estimates and actuals for goals — Blocks 10 and 13 of `data-schemas.md`.
 * Shared by routes and the budget card: previously the route calculated actuals one way,
 * while `cost-waterfall` drew bars from `directions[]` and labeled them with a number
 * from `cost_summary`, so the bar total differed from the header.
 */

export const MILESTONE_STATUSES = [
  "not_started",
  "in_progress",
  "completed",
  "blocked",
  "cancelled",
  "skipped",
] as const;

export const DIRECTION_STATUSES = [
  "investigating",
  "in_progress",
  "monitoring",
  "resolved",
  "not_started",
] as const;

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** Actual cost for a direction: the sum of its milestones' `cost_actual_rub`. */
export function directionActual(
  milestones: { cost_actual_rub?: number | null }[]
): number {
  return sum(milestones.map((m) => m.cost_actual_rub ?? 0));
}

/**
 * Recalculate `cost_summary.total_actual_rub` and `by_phase[*].actual`.
 *
 * The previous route updated only `total_actual_rub`, leaving `by_phase` unchanged,
 * so the phase breakdown diverged from the total after the first payment.
 * Deliberately leave the estimate (`estimate`) untouched: the UI shows discrepancies,
 * and a person, rather than a retrospective route, must fix them (see `estimateMismatch`).
 */
export function recalcActuals(goals: GoalsFile): GoalsFile {
  for (const dir of goals.directions) {
    dir.cost_actual_rub = directionActual(dir.milestones ?? []);
  }

  goals.cost_summary.total_actual_rub = sum(
    goals.directions.map((d) => d.cost_actual_rub ?? 0)
  );

  for (const phase of Object.keys(goals.cost_summary.by_phase ?? {})) {
    const dirs = goals.directions.filter((d) => d.phase === phase);
    goals.cost_summary.by_phase[phase] = {
      ...goals.cost_summary.by_phase[phase],
      actual: sum(dirs.map((d) => d.cost_actual_rub ?? 0)),
    };
  }

  return goals;
}

export interface EstimateMismatch {
  scope: string;
  declared: number;
  computed: number;
}

/**
 * Compare the declared estimate with the sum across directions.
 *
 * Discrepancies can occur in three places at once: the overall total,
 * phase_1 23,000 versus 43,000, and phase_3 33,000 versus 28,000. Show the
 * discrepancy itself; silently choosing one number hides a data error.
 */
export function estimateMismatch(goals: GoalsFile): EstimateMismatch[] {
  const out: EstimateMismatch[] = [];

  const computedTotal = sum(goals.directions.map((d) => d.cost_estimate_rub ?? 0));
  if (goals.cost_summary?.total_estimate_rub !== computedTotal) {
    out.push({
      scope: "Total",
      declared: goals.cost_summary?.total_estimate_rub ?? 0,
      computed: computedTotal,
    });
  }

  for (const [phaseId, entry] of Object.entries(goals.cost_summary?.by_phase ?? {})) {
    const computed = sum(
      goals.directions
        .filter((d) => d.phase === phaseId)
        .map((d) => d.cost_estimate_rub ?? 0)
    );
    if (entry.estimate !== computed) {
      const name = goals.phases?.find((p) => p.id === phaseId)?.name ?? phaseId;
      out.push({ scope: name, declared: entry.estimate, computed });
    }
  }

  return out;
}
