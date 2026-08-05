import type { LabFileData, LabMarker } from "@/lib/types/lab";

/**
 * Сбор маркеров анализа из всех трёх поколений схемы.
 *
 * Модуль намеренно свободен от `fs` и прочих серверных зависимостей: те же данные
 * разбирают и клиентские компоненты (`/api/labs/[file]` отдаёт файл как есть),
 * а импорт `lib/data/labs.ts` в клиент утянул бы за собой Node-модули и уронил сборку.
 *
 * В Data/labs/ сосуществуют markers[] (v1), panels[].markers[] (v2) и
 * studies[].markers[] (v3) — чтение только корневого markers[] скрывает 28% базы,
 * включая всю партию 2026 года.
 */
export function collectMarkers(lab: LabFileData | null | undefined): LabMarker[] {
  if (!lab) return [];
  const out: LabMarker[] = [];
  if (Array.isArray(lab.markers)) out.push(...lab.markers);
  for (const panel of lab.panels ?? []) {
    if (Array.isArray(panel.markers)) out.push(...panel.markers);
  }
  for (const study of lab.studies ?? []) {
    if (Array.isArray(study.markers)) out.push(...study.markers);
  }
  return out;
}
