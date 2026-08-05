import fs from "fs/promises";
import path from "path";
import { cachePath } from "./paths";
import { safeReadJson } from "./utils";
import type { AlertFile, HealthAlert, AlertSeverity } from "@/lib/types/alert";

const ALERTS_DIR = cachePath("alerts");

const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function isKnownSeverity(value: unknown): value is AlertSeverity {
  return typeof value === "string" && value in SEVERITY_ORDER;
}

/**
 * Читает `Cache/alerts/YYYY-MM-DD.json` — каждый файл это обёртка `{version, date, alerts[]}`.
 *
 * Прежняя версия клала весь файл целиком в массив как один алерт, из-за чего у «алерта»
 * не было ни `severity`, ни `title`. Каталог до сих пор пуст, поэтому ошибка не всплывала:
 * сломался бы ровно первый настоящий алерт.
 */
export async function readAlerts(): Promise<HealthAlert[]> {
  let files: string[];
  try {
    files = await fs.readdir(ALERTS_DIR);
  } catch {
    return [];
  }

  const alerts: HealthAlert[] = [];

  for (const file of files.filter((f) => f.endsWith(".json"))) {
    const parsed = await safeReadJson<AlertFile>(path.join(ALERTS_DIR, file));
    if (!parsed || !Array.isArray(parsed.alerts)) continue;

    // Дата файла — запасной источник сортировки, если у записи нет ts
    const fileDate = parsed.date ?? file.replace(/\.json$/, "");

    for (const alert of parsed.alerts) {
      if (!alert || typeof alert !== "object") continue;
      alerts.push({
        ...alert,
        date: alert.date ?? fileDate,
        // Неизвестная severity не должна ронять панель. Сводим к самой громкой:
        // неопознанный алерт лучше показать лишний раз, чем потерять
        severity: isKnownSeverity(alert.severity) ? alert.severity : "high",
      });
    }
  }

  return alerts.sort((a, b) => {
    const bySeverity = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (bySeverity !== 0) return bySeverity;
    return (b.ts ?? b.date ?? "").localeCompare(a.ts ?? a.date ?? "");
  });
}
