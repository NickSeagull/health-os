import { NextRequest, NextResponse } from "next/server";
import { readToothMap, writeToothMap } from "@/lib/data/dental";
import { Validator } from "@/lib/data/validation";
import { TOOTH_STATUSES, isFdiToothNumber, recountToothSummary } from "@/lib/dental-summary";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  try {
    const { number } = await params;
    const updates = await request.json();

    const v = new Validator();
    if (!isFdiToothNumber(number)) {
      v.add(`number: not an ISO 3950 tooth number (11–18, 21–28, 31–38, 41–48); received "${number}"`);
    }
    // Status is required: do not default to "healthy" — a missing tooth record
    // means "status unknown", not "healthy" (Block 6).
    v.requireEnum(updates?.status, "status", TOOTH_STATUSES);
    if (updates?.notes !== undefined && typeof updates.notes !== "string") {
      v.add("notes: string");
    }
    const invalid = v.response();
    if (invalid) return invalid;

    const map = await readToothMap();
    if (!map) {
      return NextResponse.json({ error: "Tooth map not found" }, { status: 404 });
    }

    map.teeth[number] = {
      status: updates.status,
      notes: updates.notes ?? map.teeth[number]?.notes ?? "",
    };

    map.summary = recountToothSummary(map.teeth);

    await writeToothMap(map);
    return NextResponse.json({ success: true, summary: map.summary });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 500 }
    );
  }
}
