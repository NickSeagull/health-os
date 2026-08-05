import { NextResponse } from "next/server";
import { readProfile, writeProfile } from "@/lib/data/profile";
import { Validator } from "@/lib/data/validation";
import type { ProfileData } from "@/lib/types/profile";

export async function GET() {
  const profile = await readProfile();
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  return NextResponse.json(profile);
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Partial<ProfileData>;

    const existing = await readProfile();
    if (!existing) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const v = new Validator();
    if (body?.basic !== undefined) {
      if (typeof body.basic !== "object" || body.basic === null) {
        v.add("basic: объект");
      } else {
        v.optionalDate(body.basic.date_of_birth, "basic.date_of_birth");
        v.optionalNumber(body.basic.height_cm, "basic.height_cm", "height_cm");
      }
    }
    v.optionalArray(body?.allergies, "allergies");
    v.optionalArray(body?.chronic_conditions, "chronic_conditions");
    v.optionalArray(body?.family_history, "family_history");
    v.optionalArray(body?.current_complaints, "current_complaints");
    if (body?.lifestyle !== undefined && typeof body.lifestyle !== "object") {
      v.add("lifestyle: объект");
    }

    const invalid = v.response();
    if (invalid) return invalid;

    // Слияние верхнего уровня: PUT приходил с той частью профиля, что показывает
    // страница, и сносил всё остальное. Блоки lifestyle сливаем отдельно —
    // иначе правка сна затирает незаполненные caffeine, hydration и остальные
    await writeProfile({
      ...existing,
      ...(body as ProfileData),
      version: existing.version ?? 1,
      lifestyle: body?.lifestyle
        ? { ...existing.lifestyle, ...body.lifestyle }
        : existing.lifestyle,
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Write failed" },
      { status: 500 }
    );
  }
}
