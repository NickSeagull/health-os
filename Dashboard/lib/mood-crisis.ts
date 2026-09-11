import type { MoodEntry } from "@/lib/types/mood";

/**
 * Mental-health red flags — Block 4 of `.claude/shared/critical-values.md`.
 *
 * This block has absolute priority: when triggered, normal analysis stops.
 * The dashboard writes directly to `Data/mental/journal.jsonl`, bypassing the
 * `/mental` skill, so the check must be repeated here; otherwise an entry would
 * be written to disk without any system response.
 */

/** Phrases requiring an immediate stop, including indirect statements. */
const RED_FLAG_PATTERNS: RegExp[] = [
  /suicid|kill myself|end my life|take my own life/i,
  /i (?:don't|do not|don’t) want to (live|wake up|exist)/i,
  /(everyone|everybody|they|she|he) will be better off without me/i,
  /there is no point (in living|in going on|in continuing)|no reason to live/i,
  /\b(cut|cutting|hurt|harm)\s+(myself|my self)\b|self[- ]harm/i,
  /i want to (die|disappear forever)/i,
];

export const CRISIS_HELP_TEXT = [
  "Your entry suggests that you are having a hard time right now. You do not have to handle this alone.",
  "",
  "Where to get help right now:",
  "• 112 — general emergency number, available 24/7",
  "• 103 — ambulance service",
  "",
  "Psychological support (Russia):",
  "• 8 (495) 051 from a mobile phone, 051 from a landline — EMERCOM emergency psychological support, available 24/7 for adults",
  "• 8-800-2000-122 — Child Helpline for children, teenagers, and their parents",
  "",
  "Elsewhere — find a local helpline at findahelpline.com or befrienders.org",
  "",
  "If you are thinking about harming yourself, call now; do not wait.",
].join("\n");

/**
 * Return the triggered indicators, or null.
 *
 * `history` must include the current entry: the "drop within 24 hours" and
 * "low mood for seven days" thresholds are computed from the journal, not one point.
 */
export function isMoodCrisis(
  entry: MoodEntry,
  history: MoodEntry[]
): string[] | null {
  const reasons: string[] = [];

  if (entry.mood <= 2) {
    reasons.push(`mood ${entry.mood} on a ten-point scale`);
  }

  if (entry.notes && RED_FLAG_PATTERNS.some((re) => re.test(entry.notes))) {
    reasons.push("the notes contain a statement requiring immediate attention");
  }

  const sorted = [...history]
    .filter((e) => e?.ts && typeof e.mood === "number")
    .sort((a, b) => a.ts.localeCompare(b.ts));

  const entryTime = new Date(entry.ts).getTime();

  // Mood drop of 4 or more points within 24 hours.
  const dayAgo = entryTime - 24 * 60 * 60 * 1000;
  for (const prev of sorted) {
    const t = new Date(prev.ts).getTime();
    if (t < dayAgo || t >= entryTime) continue;
    if (prev.mood - entry.mood >= 4) {
      reasons.push(`mood fell from ${prev.mood} to ${entry.mood} within 24 hours`);
      break;
    }
  }

  // Mood ≤ 4 for seven consecutive days or more.
  const weekAgo = entryTime - 7 * 24 * 60 * 60 * 1000;
  const lastWeek = sorted.filter((e) => new Date(e.ts).getTime() >= weekAgo);
  if (
    lastWeek.length >= 3 &&
    lastWeek.every((e) => e.mood <= 4) &&
    new Date(lastWeek[0].ts).getTime() <= entryTime - 6 * 24 * 60 * 60 * 1000
  ) {
    reasons.push("mood has not risen above 4 for a week");
  }

  return reasons.length ? reasons : null;
}
