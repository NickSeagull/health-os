import type { GoalsFile } from "@/lib/types/goal";

/**
 * Пересчёт сметы и факта по целям — Блок 10 и Блок 13 `data-schemas.md`.
 * Общий модуль для роутов и для карточки бюджета: раньше роут считал факт по-своему,
 * а `cost-waterfall` рисовал столбцы по `directions[]`, подписывая их числом
 * из `cost_summary` — сумма по столбцам расходится с заголовком.
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

/** Факт по направлению — сумма `cost_actual_rub` его milestones */
export function directionActual(
  milestones: { cost_actual_rub?: number | null }[]
): number {
  return sum(milestones.map((m) => m.cost_actual_rub ?? 0));
}

/**
 * Пересчитывает `cost_summary.total_actual_rub` и `by_phase[*].actual`.
 *
 * Прежний роут обновлял только `total_actual_rub`, оставляя `by_phase` в прежнем
 * состоянии: разбивка по фазам расходилась с итогом после первой же оплаты.
 * Смета (`estimate`) намеренно не трогается — расхождение показывает UI, чинить
 * его должен человек, а не роут задним числом (см. `estimateMismatch`).
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
 * Сравнивает объявленную смету с суммой по направлениям.
 *
 * Расхождения возможны сразу в трёх местах: общий итог,
 * phase_1 23 000 против 43 000, phase_3 33 000 против 28 000. Показывать нужно
 * само расхождение — молчаливый выбор одного из чисел скрывает ошибку в данных.
 */
export function estimateMismatch(goals: GoalsFile): EstimateMismatch[] {
  const out: EstimateMismatch[] = [];

  const computedTotal = sum(goals.directions.map((d) => d.cost_estimate_rub ?? 0));
  if (goals.cost_summary?.total_estimate_rub !== computedTotal) {
    out.push({
      scope: "Итого",
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
