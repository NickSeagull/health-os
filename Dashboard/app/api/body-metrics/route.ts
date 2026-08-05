import { NextResponse } from "next/server";
import { readBodyMetrics, appendBodyMetric } from "@/lib/data/body-metrics";
import { readProfile } from "@/lib/data/profile";
import { Validator, conflict } from "@/lib/data/validation";
import type { BodyMetric } from "@/lib/types/body-metric";

export async function GET() {
  const metrics = await readBodyMetrics();
  return NextResponse.json(metrics);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const v = new Validator();
    v.requireDate(body?.date, "date");
    v.optionalNumber(body?.weight_kg, "weight_kg", "weight_kg");
    v.optionalNumber(body?.height_cm, "height_cm", "height_cm");
    v.optionalNumber(body?.bmi, "bmi", "bmi");
    v.optionalNumber(body?.body_fat_pct, "body_fat_pct", "body_fat_pct");
    v.optionalNumber(body?.muscle_mass_kg, "muscle_mass_kg", "muscle_mass_kg");
    v.optionalNumber(body?.systolic, "systolic", "systolic");
    v.optionalNumber(body?.diastolic, "diastolic", "diastolic");
    v.optionalNumber(body?.heart_rate, "heart_rate", "heart_rate");
    v.optionalNumber(body?.waist_cm, "waist_cm", "waist_cm");

    // Половина измерения давления бесполезна и ломает график: обе цифры или ни одной
    const hasSystolic = body?.systolic !== undefined && body.systolic !== null && body.systolic !== "";
    const hasDiastolic = body?.diastolic !== undefined && body.diastolic !== null && body.diastolic !== "";
    if (hasSystolic !== hasDiastolic) {
      v.add("systolic/diastolic: давление записывается парой, укажите оба значения");
    }
    if (
      hasSystolic &&
      hasDiastolic &&
      typeof body.systolic === "number" &&
      typeof body.diastolic === "number" &&
      body.systolic <= body.diastolic
    ) {
      v.add(
        `systolic/diastolic: систолическое (${body.systolic}) должно быть выше диастолического (${body.diastolic})`
      );
    }

    const invalid = v.response();
    if (invalid) return invalid;

    // Ключ строки — date (Блок 0). Дописать вторую строку за ту же дату значит
    // получить две точки одного дня в тренде и рассинхрон с InBody
    const existing = await readBodyMetrics();
    const clash = existing.find((r) => String(r.date) === body.date);
    if (clash) {
      return conflict(`Измерение за ${body.date} уже записано`, { existing: clash });
    }

    // Рост берётся из профиля, а не остаётся пустым (Блок 9)
    const profile = await readProfile();
    const heightCm =
      typeof body.height_cm === "number" ? body.height_cm : profile?.basic?.height_cm;

    const weightKg = typeof body.weight_kg === "number" ? body.weight_kg : undefined;
    const bmi =
      typeof body.bmi === "number"
        ? body.bmi
        : weightKg && heightCm
          ? Math.round((weightKg / (heightCm / 100) ** 2) * 10) / 10
          : undefined;

    const row: BodyMetric = {
      date: body.date,
      weight_kg: weightKg,
      height_cm: heightCm,
      bmi,
      body_fat_pct: body.body_fat_pct ?? undefined,
      muscle_mass_kg: body.muscle_mass_kg ?? undefined,
      systolic: body.systolic ?? undefined,
      diastolic: body.diastolic ?? undefined,
      heart_rate: body.heart_rate ?? undefined,
      waist_cm: body.waist_cm ?? undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined,
    };

    await appendBodyMetric(row);
    return NextResponse.json({ success: true, row });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Write failed" },
      { status: 500 }
    );
  }
}
