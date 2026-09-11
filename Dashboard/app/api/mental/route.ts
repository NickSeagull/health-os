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
      v.add("notes: string");
    }
    v.optionalArray(body?.tags, "tags");

    // The record key is ts rather than date: multiple check-ins are allowed per day (Block 12).
    if (body?.ts !== undefined && !isIsoTimestamp(body.ts)) {
      v.add("ts: ISO 8601 timestamp with time zone, e.g. 2026-07-31T12:00:00+03:00");
    }
    if (isIsoTimestamp(body?.ts) && isFutureDate(body.ts.slice(0, 10))) {
      v.add(`ts: timestamp is in the future (${body.ts})`);
    }

    const invalid = v.response();
    if (invalid) return invalid;

    const entry: MoodEntry = {
      // Browsers send UTC ("…Z"), while the schema requires +03:00. The instant is unchanged.
      ts: toMoscowTimestamp(body.ts ?? new Date().toISOString()),
      mood: body.mood,
      energy: body.energy,
      stress: body.stress,
      sleep_quality: body.sleep_quality,
      notes: body.notes ?? "",
      tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
    };

    await appendMoodEntry(entry);

    // Red flags from Block 4 of critical-values.md. The dashboard writes to the journal
    // without going through /mental, so repeat the check here; otherwise an entry such as
    // "I don't want to wake up" would be written to disk without any system response.
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
