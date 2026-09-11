import { NextResponse } from "next/server";
import { readMeds, writeMeds } from "@/lib/data/meds";
import { Validator } from "@/lib/data/validation";
import { MED_TIMINGS, type MedsFile } from "@/lib/types/medication";

/** Four independent arrays from Block 11. Losing any one makes records invisible. */
const MED_ARRAYS = ["medications", "supplements", "topical", "protocols"] as const;

const MED_STATUSES = ["active", "as_needed", "paused", "finished"] as const;

export async function GET() {
  const meds = await readMeds();
  if (!meds) {
    return NextResponse.json({ error: "Meds not found" }, { status: 404 });
  }
  return NextResponse.json(meds);
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Partial<MedsFile>;

    const existing = await readMeds();
    if (!existing) {
      return NextResponse.json({ error: "Meds not found" }, { status: 404 });
    }

    const v = new Validator();
    for (const key of MED_ARRAYS) {
      // The client sends the complete file: a missing array would silently
      // make all of its courses disappear.
      v.requireArray(body?.[key], key);

      // Iterate only over actual arrays; otherwise `.entries()` would crash the route.
      const items = Array.isArray(body?.[key]) ? body[key] : [];
      for (const [i, item] of items.entries()) {
        const entry = item as { id?: unknown; name?: unknown; status?: unknown; timing?: unknown };
        if (typeof entry?.id !== "string" || entry.id.trim() === "") {
          v.add(`${key}[${i}].id: required field (${key.slice(0, 3)}_NN)`);
        }
        if (typeof entry?.name !== "string" || entry.name.trim() === "") {
          v.add(`${key}[${i}].name: required field`);
        }
        if (key === "medications" || key === "supplements") {
          v.requireArray(entry?.timing, `${key}[${i}].timing`);
          const timing = Array.isArray(entry?.timing) ? entry.timing : [];
          timing.forEach((value, timingIndex) => {
            v.requireEnum(value, `${key}[${i}].timing[${timingIndex}]`, MED_TIMINGS);
          });
        }
        // protocols[] is empty in the data, and its status set is not defined.
        if (key !== "protocols") {
          v.requireEnum(entry?.status, `${key}[${i}].status`, MED_STATUSES);
        }
      }
    }

    const invalid = v.response();
    if (invalid) return invalid;

    await writeMeds({
      ...existing,
      ...(body as MedsFile),
      // Preserve version on overwrite; never reset it (Block 0).
      version: existing.version ?? 1,
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Write failed" },
      { status: 500 }
    );
  }
}
