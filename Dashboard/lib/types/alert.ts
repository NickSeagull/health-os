/**
 * Каноническая схема алерта — Блок 5 файла `.claude/shared/critical-values.md`.
 *
 * Прежний плоский тип `{id, date, severity, category, title, message}` не совпадал
 * с тем, что пишут скиллы, ни одним полем кроме `id` и `title`. `readAlerts()`
 * клала весь файл целиком как один алерт, а панель обращалась к
 * `severityConfig[alert.severity]` по значению `undefined` — первый же настоящий
 * алерт ронял страницу в ErrorBoundary.
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
  /** Отметка времени с зоной: `YYYY-MM-DDTHH:MM:SS+03:00` */
  ts: string;
  severity: AlertSeverity;
  type: AlertType | string;
  source: AlertSource | string;
  title: string;
  /** Что именно обнаружено, с числами и референсом лаборатории */
  detail: string;
  marker?: string | null;
  value?: number | string | null;
  reference?: string | null;
  action?: string | null;
  acknowledged?: boolean;
  /** Дата файла `Cache/alerts/YYYY-MM-DD.json`, из которого пришёл алерт */
  date?: string;
}

/** Файл `Cache/alerts/YYYY-MM-DD.json` — обёртка, а не голый массив */
export interface AlertFile {
  version: number;
  date: string;
  alerts: HealthAlert[];
}
