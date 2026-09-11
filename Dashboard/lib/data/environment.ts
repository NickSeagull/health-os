import { dataPath } from "./paths";
import { safeReadJson } from "./utils";
import type { EnvironmentData } from "@/lib/types/environment";

const ENVIRONMENT_PATH = () => dataPath("context", "environment.json");

/** Read-only: skills and agents maintain external context; the dashboard displays it. */
export async function readEnvironment(): Promise<EnvironmentData | null> {
  return safeReadJson<EnvironmentData>(ENVIRONMENT_PATH());
}
