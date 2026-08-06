import fs from "fs";
import { dataPath } from "./paths";
import { safeReadJson, safeWriteJson } from "./utils";
import type { GoalsFile } from "@/lib/types/goal";

/**
 * Файл целей называется по году: 2026.json, 2027.json.
 *
 * Год вычисляется в момент обращения, а не при сборке. Захардкоженный год
 * означал бы, что первого января дашборд молча перестаёт видеть цели —
 * без ошибки, просто с пустым разделом.
 *
 * Если файла за текущий год ещё нет, берётся самый свежий существующий:
 * цели прошлого года остаются актуальными, пока не заведены новые.
 */
function goalsPath(): string {
  const dir = dataPath("goals");
  const current = `${new Date().getFullYear()}.json`;
  const currentPath = dataPath("goals", current);
  if (fs.existsSync(currentPath)) return currentPath;
  try {
    const years = fs
      .readdirSync(dir)
      .filter((f) => /^\d{4}\.json$/.test(f))
      .sort();
    if (years.length) return dataPath("goals", years[years.length - 1]);
  } catch {
    /* каталога ещё нет — вернём путь текущего года, читатель получит null */
  }
  return currentPath;
}

export async function readGoals(): Promise<GoalsFile | null> {
  return safeReadJson<GoalsFile>(goalsPath());
}

export async function writeGoals(data: GoalsFile): Promise<void> {
  await safeWriteJson(goalsPath(), data);
}
