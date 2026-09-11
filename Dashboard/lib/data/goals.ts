import fs from "fs";
import { dataPath } from "./paths";
import { safeReadJson, safeWriteJson } from "./utils";
import type { GoalsFile } from "@/lib/types/goal";

/**
 * The goals file is named by year: 2026.json, 2027.json.
 *
 * Compute the year at access time rather than at build time. A hard-coded year
 * would make the dashboard silently stop showing goals on January 1: no error,
 * just an empty section.
 *
 * If the current year's file does not exist, use the most recent existing file:
 * the previous year's goals remain current until new ones are created.
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
    /* The directory does not exist yet; return the current-year path and let the reader return null. */
  }
  return currentPath;
}

export async function readGoals(): Promise<GoalsFile | null> {
  return safeReadJson<GoalsFile>(goalsPath());
}

export async function writeGoals(data: GoalsFile): Promise<void> {
  await safeWriteJson(goalsPath(), data);
}
