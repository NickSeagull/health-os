import { dataPath } from "./paths";
import { safeReadJson, safeWriteJson } from "./utils";
import type { ToothMap, DentalProceduresFile } from "@/lib/types/dental";

const TOOTH_MAP_PATH = () => dataPath("dental", "tooth-map.json");
const PROCEDURES_PATH = () => dataPath("dental", "procedures.json");

export async function readToothMap(): Promise<ToothMap | null> {
  return safeReadJson<ToothMap>(TOOTH_MAP_PATH());
}

export async function writeToothMap(data: ToothMap): Promise<void> {
  await safeWriteJson(TOOTH_MAP_PATH(), data);
}

export async function readDentalProcedures(): Promise<DentalProceduresFile | null> {
  return safeReadJson<DentalProceduresFile>(PROCEDURES_PATH());
}

export async function writeDentalProcedures(data: DentalProceduresFile): Promise<void> {
  await safeWriteJson(PROCEDURES_PATH(), data);
}
