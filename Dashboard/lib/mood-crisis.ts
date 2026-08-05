import type { MoodEntry } from "@/lib/types/mood";

/**
 * Красные флаги психического состояния — Блок 4 `.claude/shared/critical-values.md`.
 *
 * Блок имеет абсолютный приоритет: при срабатывании обычный разбор останавливается.
 * Дашборд пишет в `Data/mental/journal.jsonl` напрямую, минуя скилл `/mental`,
 * поэтому проверку приходится дублировать здесь — иначе запись уходит на диск,
 * и система на неё никак не отвечает.
 */

/** Формулировки, при которых остановка обязательна, включая косвенные */
const RED_FLAG_PATTERNS: RegExp[] = [
  /суицид|покончить с собой|убить себя|свести счёты с жизнью/i,
  /не хочу (жить|просыпаться|существовать)/i,
  /(всем|им|ей|ему) будет лучше без меня/i,
  /нет смысла (жить|дальше|продолжать)|жить незачем/i,
  /(режу|порезал|резал|причинить себе)\s*себ|самоповреждени|селфхарм/i,
  /хочу (умереть|исчезнуть навсегда)/i,
];

export const CRISIS_HELP_TEXT = [
  "Судя по записи, тебе сейчас тяжело. Это не то, с чем стоит справляться в одиночку.",
  "",
  "Куда обратиться прямо сейчас:",
  "• 112 — единый номер экстренных служб, круглосуточно",
  "• 103 — скорая помощь",
  "",
  "Психологическая помощь (Россия):",
  "• 8 (495) 051 с мобильного, 051 с городского — экстренная психологическая помощь МЧС, круглосуточно, для взрослых",
  "• 8-800-2000-122 — Детский телефон доверия: для детей, подростков и их родителей",
  "",
  "В другой стране — найдите местную линию: findahelpline.com либо befrienders.org",
  "",
  "Если есть мысли о причинении себе вреда — позвони сейчас, не откладывая.",
].join("\n");

/**
 * Возвращает список сработавших признаков либо null.
 *
 * `history` должна включать саму запись — пороги «падение за сутки» и «низкое
 * настроение семь дней» считаются по журналу, а не по одной точке.
 */
export function isMoodCrisis(
  entry: MoodEntry,
  history: MoodEntry[]
): string[] | null {
  const reasons: string[] = [];

  if (entry.mood <= 2) {
    reasons.push(`настроение ${entry.mood} по десятибалльной шкале`);
  }

  if (entry.notes && RED_FLAG_PATTERNS.some((re) => re.test(entry.notes))) {
    reasons.push("в заметке есть формулировка, требующая немедленного внимания");
  }

  const sorted = [...history]
    .filter((e) => e?.ts && typeof e.mood === "number")
    .sort((a, b) => a.ts.localeCompare(b.ts));

  const entryTime = new Date(entry.ts).getTime();

  // Падение настроения на 4 и более пункта за сутки
  const dayAgo = entryTime - 24 * 60 * 60 * 1000;
  for (const prev of sorted) {
    const t = new Date(prev.ts).getTime();
    if (t < dayAgo || t >= entryTime) continue;
    if (prev.mood - entry.mood >= 4) {
      reasons.push(`настроение упало с ${prev.mood} до ${entry.mood} за сутки`);
      break;
    }
  }

  // Настроение ≤ 4 устойчиво семь дней и более
  const weekAgo = entryTime - 7 * 24 * 60 * 60 * 1000;
  const lastWeek = sorted.filter((e) => new Date(e.ts).getTime() >= weekAgo);
  if (
    lastWeek.length >= 3 &&
    lastWeek.every((e) => e.mood <= 4) &&
    new Date(lastWeek[0].ts).getTime() <= entryTime - 6 * 24 * 60 * 60 * 1000
  ) {
    reasons.push("настроение не поднимается выше 4 уже неделю");
  }

  return reasons.length ? reasons : null;
}
