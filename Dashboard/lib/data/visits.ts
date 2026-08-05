import path from "path";
import { dataPath } from "./paths";
import { safeReadJson, safeReadFile, safeWriteJson, safeWriteFile, resolveWithin } from "./utils";
import type { VisitIndex, VisitDetailJson, VisitDetailMd } from "@/lib/types/visit";

const VISITS_DIR = dataPath("doctors", "visits");
const INDEX_PATH = path.join(VISITS_DIR, "_index.json");

export async function readVisitIndex(): Promise<VisitIndex | null> {
  return safeReadJson<VisitIndex>(INDEX_PATH);
}

export async function readVisitDetailJson(filename: string): Promise<VisitDetailJson | null> {
  let target: string;
  try {
    target = resolveWithin(VISITS_DIR, filename, [".json"]);
  } catch {
    return null;
  }
  return safeReadJson<VisitDetailJson>(target);
}

export async function readVisitDetailMd(filename: string): Promise<VisitDetailMd | null> {
  let target: string;
  try {
    target = resolveWithin(VISITS_DIR, filename, [".md"]);
  } catch {
    return null;
  }
  const raw = await safeReadFile(target);
  if (!raw) return null;

  const titleMatch = raw.match(/^# (.+)/m);
  const dateMatch = raw.match(/- \*\*Дата:\*\* (.+)/);
  const doctorMatch = raw.match(/- \*\*Врач:\*\* (.+)/);
  const clinicMatch = raw.match(/- \*\*Клиника:\*\* (.+)/);
  const specialtyMatch = raw.match(/- \*\*Специальность:\*\* (.+)/);

  return {
    raw,
    title: titleMatch?.[1],
    date: dateMatch?.[1],
    doctor: doctorMatch?.[1],
    clinic: clinicMatch?.[1],
    specialty: specialtyMatch?.[1],
  };
}

export async function writeVisitDetailJson(
  filename: string,
  data: VisitDetailJson
): Promise<void> {
  // Ошибка намеренно пробрасывается: запись за пределы каталога должна падать громко
  const target = resolveWithin(VISITS_DIR, filename, [".json"]);
  await safeWriteJson(target, data);
}

export async function writeVisitDetailMd(
  filename: string,
  content: string
): Promise<void> {
  const target = resolveWithin(VISITS_DIR, filename, [".md"]);
  await safeWriteFile(target, content);
}

export async function writeVisitIndex(data: VisitIndex): Promise<void> {
  await safeWriteJson(INDEX_PATH, data);
}
