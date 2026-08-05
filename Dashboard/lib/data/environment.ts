import { dataPath } from "./paths";
import { safeReadJson } from "./utils";
import type { EnvironmentData } from "@/lib/types/environment";

const ENVIRONMENT_PATH = dataPath("context", "environment.json");

/** Только чтение: внешний контекст ведут скиллы и агенты, дашборд его показывает */
export async function readEnvironment(): Promise<EnvironmentData | null> {
  return safeReadJson<EnvironmentData>(ENVIRONMENT_PATH);
}
