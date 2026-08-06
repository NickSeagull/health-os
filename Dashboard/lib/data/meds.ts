import { dataPath } from "./paths";
import { safeReadJson, safeWriteJson } from "./utils";
import type { MedsFile } from "@/lib/types/medication";

const MEDS_PATH = () => dataPath("medications", "current.json");

export async function readMeds(): Promise<MedsFile | null> {
  return safeReadJson<MedsFile>(MEDS_PATH());
}

export async function writeMeds(data: MedsFile): Promise<void> {
  await safeWriteJson(MEDS_PATH(), data);
}
