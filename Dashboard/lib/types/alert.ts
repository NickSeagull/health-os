/**
 * Canonical alert schema — Block 5 of `.claude/shared/critical-values.md`.
 *
 * The previous flat type `{id, date, severity, category, title, message}` matched
 * only the `id` and `title` fields written by skills. `readAlerts()` treated the
 * entire file as one alert, and the panel looked up `severityConfig[alert.severity]`
 * with an `undefined` value; the first real alert then crashed the page in ErrorBoundary.
 */

export type AlertSeverity = "critical" | "high" | "medium" | "low";

export type AlertType =
  | "lab_critical"
  | "vital_critical"
  | "mental_crisis"
  | "medication"
  | "follow_up"
  | "recovery"
  | "other";

export type AlertSource = "labs" | "inbox" | "body" | "mental" | "coach";

export interface HealthAlert {
  id: string;
  /** Timestamp with time zone: `YYYY-MM-DDTHH:MM:SS+03:00`. */
  ts: string;
  severity: AlertSeverity;
  type: AlertType | string;
  source: AlertSource | string;
  title: string;
  /** What was detected, including values and the laboratory reference. */
  detail: string;
  marker?: string | null;
  value?: number | string | null;
  reference?: string | null;
  action?: string | null;
  acknowledged?: boolean;
  /** Date of the `Cache/alerts/YYYY-MM-DD.json` file containing the alert. */
  date?: string;
}

/** `Cache/alerts/YYYY-MM-DD.json` wraps the alerts; it is not a bare array. */
export interface AlertFile {
  version: number;
  date: string;
  alerts: HealthAlert[];
}
