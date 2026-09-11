import fs from "fs/promises";
import path from "path";
import { cachePath } from "./paths";
import { safeReadJson } from "./utils";
import type { AlertFile, HealthAlert, AlertSeverity } from "@/lib/types/alert";

const ALERTS_DIR = () => cachePath("alerts");

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
 * Read `Cache/alerts/YYYY-MM-DD.json`; each file wraps `{version, date, alerts[]}`.
 *
 * The previous version put the entire file into the array as one alert, leaving
 * the "alert" without either `severity` or `title`. The directory was empty, so
 * the bug stayed hidden and would have broken the first real alert.
 */
export async function readAlerts(): Promise<HealthAlert[]> {
  let files: string[];
  try {
    files = await fs.readdir(ALERTS_DIR());
  } catch {
    return [];
  }

  const alerts: HealthAlert[] = [];

  for (const file of files.filter((f) => f.endsWith(".json"))) {
    const parsed = await safeReadJson<AlertFile>(path.join(ALERTS_DIR(), file));
    if (!parsed || !Array.isArray(parsed.alerts)) continue;

    // The file date is a fallback sort value when a record has no ts.
    const fileDate = parsed.date ?? file.replace(/\.json$/, "");

    for (const alert of parsed.alerts) {
      if (!alert || typeof alert !== "object") continue;
      alerts.push({
        ...alert,
        date: alert.date ?? fileDate,
        // An unknown severity must not crash the panel. Use the highest severity:
        // showing an unrecognized alert twice is safer than losing it.
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
