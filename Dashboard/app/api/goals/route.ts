import { NextResponse } from "next/server";
import { readGoals, writeGoals } from "@/lib/data/goals";
import { Validator } from "@/lib/data/validation";
import {
  DIRECTION_STATUSES,
  MILESTONE_STATUSES,
  recalcActuals,
} from "@/lib/goals-cost";
import type { GoalsFile } from "@/lib/types/goal";

export async function GET() {
  const goals = await readGoals();
  if (!goals) {
    return NextResponse.json({ error: "Goals not found" }, { status: 404 });
  }
  return NextResponse.json(goals);
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Partial<GoalsFile>;

    const existing = await readGoals();
    if (!existing) {
      return NextResponse.json({ error: "Goals not found" }, { status: 404 });
    }

    const v = new Validator();
    v.requireArray(body?.directions, "directions");

    // Обходим только то, что действительно массив: `directions: "строка"` роняло
    // роут пятисоткой на `.entries()` вместо отказа по валидации
    const directions = Array.isArray(body?.directions) ? body.directions : [];
    for (const [i, dir] of directions.entries()) {
      v.requireString(dir?.area, `directions[${i}].area`);
      v.requireString(dir?.kr, `directions[${i}].kr`);
      v.requireEnum(dir?.status, `directions[${i}].status`, DIRECTION_STATUSES);
      v.optionalDate(dir?.last_activity, `directions[${i}].last_activity`);
      v.optionalNumber(dir?.cost_estimate_rub, `directions[${i}].cost_estimate_rub`, "cost_rub");
      v.optionalNumber(dir?.cost_actual_rub, `directions[${i}].cost_actual_rub`, "cost_rub");
      v.requireArray(dir?.milestones, `directions[${i}].milestones`);

      const milestones = Array.isArray(dir?.milestones) ? dir.milestones : [];
      for (const [j, m] of milestones.entries()) {
        const at = `directions[${i}].milestones[${j}]`;
        v.requireString(m?.id, `${at}.id`);
        v.requireString(m?.title, `${at}.title`);
        v.requireEnum(m?.status, `${at}.status`, MILESTONE_STATUSES);
        // deadline и есть плановая дата — будущее для неё нормально
        v.optionalDate(m?.deadline, `${at}.deadline`, true);
        v.optionalDate(m?.completed_date, `${at}.completed_date`);
        v.optionalNumber(m?.cost_estimate_rub, `${at}.cost_estimate_rub`, "cost_rub");
        v.optionalNumber(m?.cost_actual_rub, `${at}.cost_actual_rub`, "cost_rub");
      }
    }

    const invalid = v.response();
    if (invalid) return invalid;

    const merged: GoalsFile = {
      ...existing,
      ...(body as GoalsFile),
      // version у файла целей = 2, сбрасывать его нельзя
      version: existing.version ?? 2,
      cost_summary: { ...existing.cost_summary, ...(body?.cost_summary ?? {}) },
    };

    // Факт всегда производный от milestones — иначе итог и разбивка по фазам
    // расходятся с суммой по направлениям
    await writeGoals(recalcActuals(merged));
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Write failed" },
      { status: 500 }
    );
  }
}
