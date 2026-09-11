import type { LabMarker, LabSummaryCounts } from "@/lib/types/lab";

/**
 * Shared rules for writing laboratory results — Block 1 of `data-schemas.md`.
 * Kept outside the routes so POST (new file) and PUT (edit) calculate
 * counts and flags identically.
 */

/** Marker-status enum. Do not introduce other values. */
export const MARKER_STATUSES = [
  "normal",
  "low",
  "high",
  "critical",
  "variant",
  "detected",
  "deviation",
] as const;

/** In v2, `summary` is a counter object rather than prose. */
export function countMarkerStatuses(markers: LabMarker[]): LabSummaryCounts {
  return {
    total: markers.length,
    normal: markers.filter((m) => m.status === "normal").length,
    low: markers.filter((m) => m.status === "low").length,
    high: markers.filter((m) => m.status === "high").length,
    critical: markers.filter((m) => m.status === "critical").length,
  };
}

/**
 * Index flags are strings of the form "Marker status", only for deviations (Block 2).
 * The route used "Marker (status)", which differed from all 60 index records.
 */
export function markerFlags(markers: LabMarker[]): string[] {
  return markers
    .filter((m) => m.status && m.status !== "normal")
    .map((m) => `${m.name} ${m.status}`);
}
