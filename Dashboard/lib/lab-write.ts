import type { LabMarker, LabSummaryCounts } from "@/lib/types/lab";

/**
 * Общие правила записи анализов — Блок 1 `data-schemas.md`.
 * Вынесено из роутов, чтобы POST (новый файл) и PUT (правка) считали
 * счётчики и флаги одинаково.
 */

/** Enum статуса маркера. Иных значений не вводить */
export const MARKER_STATUSES = [
  "normal",
  "low",
  "high",
  "critical",
  "variant",
  "detected",
  "deviation",
] as const;

/** `summary` в v2 — объект счётчиков, а не связный текст */
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
 * Флаги индекса — строки вида «Маркер status», только по отклонениям (Блок 2).
 * Роут писал «Маркер (status)» в скобках, расходясь со всеми 60 записями индекса.
 */
export function markerFlags(markers: LabMarker[]): string[] {
  return markers
    .filter((m) => m.status && m.status !== "normal")
    .map((m) => `${m.name} ${m.status}`);
}
