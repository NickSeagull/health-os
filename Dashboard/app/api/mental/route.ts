import { NextResponse } from "next/server";
import { readMoodJournal, appendMoodEntry } from "@/lib/data/mental";
import {
  Validator,
  isIsoTimestamp,
  toMoscowTimestamp,
  isFutureDate,
} from "@/lib/data/validation";
import { CRISIS_HELP_TEXT, isMoodCrisis } from "@/lib/mood-crisis";
import type { MoodEntry } from "@/lib/types/mood";

export async function GET() {
  const entries = await readMoodJournal();
  return NextResponse.json(entries);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const v = new Validator();
    v.requireNumber(body?.mood, "mood", "score_1_10");
    v.requireNumber(body?.energy, "energy", "score_1_10");
    v.requireNumber(body?.stress, "stress", "score_1_10");
    v.requireNumber(body?.sleep_quality, "sleep_quality", "score_1_10");
    if (body?.notes !== undefined && typeof body.notes !== "string") {
      v.add("notes: строка");
    }
    v.optionalArray(body?.tags, "tags");

    // Ключ записи — ts, а не дата: за сутки допустимо несколько check-in (Блок 12)
    if (body?.ts !== undefined && !isIsoTimestamp(body.ts)) {
      v.add("ts: отметка времени ISO 8601 с зоной, например 2026-07-31T12:00:00+03:00");
    }
    if (isIsoTimestamp(body?.ts) && isFutureDate(body.ts.slice(0, 10))) {
      v.add(`ts: отметка из будущего (${body.ts})`);
    }

    const invalid = v.response();
    if (invalid) return invalid;

    const entry: MoodEntry = {
      // Браузер отдаёт UTC («…Z»), схема требует +03:00. Момент времени тот же
      ts: toMoscowTimestamp(body.ts ?? new Date().toISOString()),
      mood: body.mood,
      energy: body.energy,
      stress: body.stress,
      sleep_quality: body.sleep_quality,
      notes: body.notes ?? "",
      tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
    };

    await appendMoodEntry(entry);

    // Красные флаги из Блока 4 critical-values.md. Дашборд пишет в журнал в обход
    // /mental, поэтому проверку нужно повторить здесь — иначе запись «не хочу
    // просыпаться» уходит на диск, и система на неё никак не отвечает
    const history = await readMoodJournal();
    const crisis = isMoodCrisis(entry, history);

    return NextResponse.json({
      success: true,
      crisis: crisis ? { reasons: crisis, help: CRISIS_HELP_TEXT } : null,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Write failed" },
      { status: 500 }
    );
  }
}
