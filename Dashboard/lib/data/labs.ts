import fs from "fs/promises";
import path from "path";
import { dataPath } from "./paths";
import { safeReadJson, safeWriteJson, resolveWithin } from "./utils";
import type { LabIndex, LabFileData, InBodyData, MarkerTrendPoint } from "@/lib/types/lab";
import { resolveAlias, getCanonicalUnit, isUnitMismatch } from "./lab-aliases";
import { collectMarkers } from "@/lib/lab-markers";

const LABS_DIR = dataPath("labs");
const INDEX_PATH = path.join(LABS_DIR, "_index.json");

export async function readLabIndex(): Promise<LabIndex | null> {
  return safeReadJson<LabIndex>(INDEX_PATH);
}

export async function readLabFile(filename: string): Promise<LabFileData | null> {
  let target: string;
  try {
    target = resolveWithin(LABS_DIR, filename, [".json"]);
  } catch {
    return null;
  }
  return safeReadJson<LabFileData>(target);
}

export async function readInBodyFile(filename: string): Promise<InBodyData | null> {
  let target: string;
  try {
    target = resolveWithin(LABS_DIR, filename, [".json"]);
  } catch {
    return null;
  }
  return safeReadJson<InBodyData>(target);
}

export async function writeLabFile(filename: string, data: LabFileData): Promise<void> {
  // Ошибка намеренно пробрасывается: запись за пределы каталога должна падать громко
  const target = resolveWithin(LABS_DIR, filename, [".json"]);
  await safeWriteJson(target, data);
}

// Реализация вынесена в lib/lab-markers.ts, чтобы её могли импортировать
// и клиентские компоненты: этот модуль тянет fs и в браузер не собирается.
export { collectMarkers };

/** В части файлов лаборатория лежит в `lab`, в части — в `laboratory` */
function labName(lab: LabFileData): string {
  return lab.lab ?? lab.laboratory ?? "";
}

export async function listUniqueMarkers(): Promise<string[]> {
  const index = await readLabIndex();
  if (!index) return [];

  const names = new Set<string>();
  for (const entry of index.analyses) {
    if (entry.type === "body_composition") continue;
    const lab = await readLabFile(entry.file);
    for (const m of collectMarkers(lab)) {
      if (m?.name) names.add(resolveAlias(m.name));
    }
  }
  return Array.from(names).sort();
}

export async function aggregateMarker(markerName: string): Promise<MarkerTrendPoint[]> {
  const index = await readLabIndex();
  if (!index) return [];

  const canonical = resolveAlias(markerName);
  const canonicalUnit = getCanonicalUnit(canonical);
  const points: MarkerTrendPoint[] = [];

  for (const entry of index.analyses) {
    if (entry.type === "body_composition") continue;
    const lab = await readLabFile(entry.file);
    if (!lab) continue;

    for (const m of collectMarkers(lab)) {
      if (!m?.name || resolveAlias(m.name) !== canonical) continue;
      if (typeof m.value !== "number") continue;

      points.push({
        date: lab.date,
        value: m.value,
        unit: m.unit,
        status: m.status,
        reference_min: m.reference_min,
        reference_max: m.reference_max,
        lab: labName(lab),
        // Помечаем точки в неканонической единице: без этого тренд
        // 17.33 нмоль/л → 6.5 нг/мл читается как обвал втрое, хотя это рост
        unitMismatch: isUnitMismatch(canonical, m.unit, canonicalUnit),
      });
    }
  }

  return points.sort((a, b) => a.date.localeCompare(b.date));
}

export async function listInBodyFiles(): Promise<InBodyData[]> {
  const index = await readLabIndex();
  if (!index) return [];

  const results: InBodyData[] = [];
  for (const entry of index.analyses) {
    if (entry.type === "body_composition") {
      const data = await readInBodyFile(entry.file);
      if (data) results.push(data);
    }
  }
  return results.sort((a, b) => a.date.localeCompare(b.date));
}

export async function getAllLabFiles(): Promise<string[]> {
  try {
    const files = await fs.readdir(LABS_DIR);
    return files.filter((f) => f.endsWith(".json") && f !== "_index.json");
  } catch {
    return [];
  }
}
