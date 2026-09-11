import type { Tooth, ToothMap, ToothStatus } from "@/lib/types/dental";

/**
 * Recompute the dental chart `summary` and parse tooth numbers under ISO 3950 (FDI).
 * This module has no server dependencies: a client component renders the chart,
 * while the route writes by the same rules so the two write sources cannot diverge.
 */

export const TOOTH_STATUSES = [
  "healthy",
  "filled",
  "crowned",
  "implant",
  "extracted",
  "needs_treatment",
  "root_canal",
] as const satisfies readonly ToothStatus[];

/** The complete adult dentition is a constant, not a data-derived value. */
export const TOTAL_TEETH = 32;

/** All valid positions: quadrants 1–4, with teeth 1–8 in each. */
export const FDI_NUMBERS: string[] = [1, 2, 3, 4].flatMap((quadrant) =>
  [1, 2, 3, 4, 5, 6, 7, 8].map((tooth) => `${quadrant}${tooth}`)
);

export function isFdiToothNumber(value: string): boolean {
  return FDI_NUMBERS.includes(value);
}

/**
 * `teeth` is sparse: keys exist only for teeth with a known status.
 *
 * This follows two rules from Block 6 of `data-schemas.md` that the old route violated:
 * `total` is always 32, not the number of records (otherwise editing one tooth
 * would rewrite the chart header from "32 teeth" to "3 teeth"), and status counts
 * include only present records. A missing key means "status unknown", so that
 * tooth is excluded from every count.
 */
export function recountToothSummary(teeth: Record<string, Tooth>): ToothMap["summary"] {
  const summary: ToothMap["summary"] = {
    total: TOTAL_TEETH,
    healthy: 0,
    filled: 0,
    crowned: 0,
    implant: 0,
    extracted: 0,
    needs_treatment: 0,
    root_canal: 0,
  };

  for (const tooth of Object.values(teeth ?? {})) {
    // Needed for a status read from disk that is not in the enum.
    const status = tooth?.status;
    if (status && TOOTH_STATUSES.includes(status)) {
      summary[status] += 1;
    }
  }

  return summary;
}

/** Number of teeth without a record: the dentition size minus known statuses. */
export function unknownToothCount(teeth: Record<string, Tooth>): number {
  return TOTAL_TEETH - Object.keys(teeth ?? {}).length;
}
