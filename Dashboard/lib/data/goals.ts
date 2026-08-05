import { dataPath } from "./paths";
import { safeReadJson, safeWriteJson } from "./utils";
import type { GoalsFile } from "@/lib/types/goal";

const GOALS_PATH = dataPath("goals", "2026.json");

export async function readGoals(): Promise<GoalsFile | null> {
  return safeReadJson<GoalsFile>(GOALS_PATH);
}

export async function writeGoals(data: GoalsFile): Promise<void> {
  await safeWriteJson(GOALS_PATH, data);
}
