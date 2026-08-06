import { dataPath } from "./paths";
import { safeReadCsv, safeAppendCsv } from "./utils";
import type { BodyMetric } from "@/lib/types/body-metric";

const CSV_PATH = () => dataPath("body-metrics.csv");

const CSV_HEADERS = [
  "date",
  "weight_kg",
  "height_cm",
  "bmi",
  "body_fat_pct",
  "muscle_mass_kg",
  "systolic",
  "diastolic",
  "heart_rate",
  "waist_cm",
  "notes",
];

export async function readBodyMetrics(): Promise<BodyMetric[]> {
  return safeReadCsv<BodyMetric>(CSV_PATH());
}

export async function appendBodyMetric(row: BodyMetric): Promise<void> {
  await safeAppendCsv(CSV_PATH(), row as unknown as Record<string, unknown>, CSV_HEADERS);
}
