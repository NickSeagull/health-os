import { dataPath } from "./paths";
import { safeReadJsonl, safeAppendJsonl } from "./utils";
import type { MoodEntry } from "@/lib/types/mood";

const JOURNAL_PATH = dataPath("mental", "journal.jsonl");

export async function readMoodJournal(): Promise<MoodEntry[]> {
  return safeReadJsonl<MoodEntry>(JOURNAL_PATH);
}

export async function appendMoodEntry(entry: MoodEntry): Promise<void> {
  await safeAppendJsonl(JOURNAL_PATH, entry);
}
