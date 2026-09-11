import { NextRequest, NextResponse } from "next/server";
import { readGoals, writeGoals } from "@/lib/data/goals";
import { Validator, todayMoscow } from "@/lib/data/validation";
import { MILESTONE_STATUSES, recalcActuals } from "@/lib/goals-cost";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();

    const v = new Validator();
    v.optionalEnum(updates?.status, "status", MILESTONE_STATUSES);
    v.optionalDate(updates?.completed_date, "completed_date");
    v.optionalNumber(updates?.cost_actual_rub, "cost_actual_rub", "cost_rub");
    if (updates?.notes !== undefined && typeof updates.notes !== "string") {
      v.add("notes: string");
    }
    const invalid = v.response();
    if (invalid) return invalid;

    const goals = await readGoals();
    if (!goals) {
      return NextResponse.json({ error: "Goals not found" }, { status: 404 });
    }

    const today = todayMoscow();
    let found = false;

    for (const dir of goals.directions) {
      const milestone = dir.milestones.find((m) => m.id === id);
      if (!milestone) continue;

      const statusChanged =
        updates.status !== undefined && updates.status !== milestone.status;

      if (updates.status !== undefined) milestone.status = updates.status;
      if (updates.notes !== undefined) milestone.notes = updates.notes;
      if (updates.cost_actual_rub !== undefined) {
        milestone.cost_actual_rub = updates.cost_actual_rub;
      }
      if (updates.completed_date !== undefined) {
        milestone.completed_date = updates.completed_date;
      }
      if (updates.status === "completed" && !milestone.completed_date) {
        milestone.completed_date = today;
      }

      // Move last_activity only when the status changes. Previously every edit,
      // including a note, made the direction look fresh even when nothing happened,
      // and /traction counted activity from that date.
      if (statusChanged) dir.last_activity = today;

      found = true;
      break;
    }

    if (!found) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    // Recalculate actuals everywhere: by direction, in cost_summary, and by phase.
    // Previously by_phase[*].actual was not updated and diverged from the total.
    await writeGoals(recalcActuals(goals));
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 500 }
    );
  }
}
