import { NextResponse } from "next/server";
import { readDentalProcedures, writeDentalProcedures } from "@/lib/data/dental";
import { Validator, conflict } from "@/lib/data/validation";
import { isFdiToothNumber } from "@/lib/dental-summary";

/**
 * Enum типа процедуры — Блок 7 data-schemas.md. Раньше `type` писался как есть,
 * включая пустую строку, и в файл попадали значения, которых в enum нет.
 */
const PROCEDURE_TYPES = [
  "filling",
  "extraction",
  "crown",
  "implant",
  "cleaning",
  "root_canal",
  "whitening",
  "orthodontics",
] as const;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const v = new Validator();
    // `date: null` допустим — у всех четырёх существующих записей дата неизвестна,
    // и подставлять вместо неё сегодняшнюю запрещено (Блок 0)
    v.optionalDate(body?.date, "date");
    v.requireEnum(body?.type, "type", PROCEDURE_TYPES);
    v.requireString(body?.description, "description");
    v.optionalArray(body?.teeth, "teeth");

    const teeth: string[] = Array.isArray(body?.teeth) ? body.teeth : [];
    for (const tooth of teeth) {
      if (typeof tooth !== "string" || !isFdiToothNumber(tooth)) {
        v.add(`teeth: «${tooth}» не номер ISO 3950 (11–18, 21–28, 31–38, 41–48)`);
      }
    }
    if (body?.notes !== undefined && typeof body.notes !== "string") {
      v.add("notes: строка");
    }

    const invalid = v.response();
    if (invalid) return invalid;

    const procs = await readDentalProcedures();
    if (!procs) {
      return NextResponse.json({ error: "Procedures not found" }, { status: 404 });
    }

    const date = body.date || null;

    // Ключ дубликата — date + type + teeth (Блок 0). Молча дописывать вторую
    // такую же процедуру нельзя: в истории появятся два удаления одного зуба
    const sameTeeth = [...teeth].sort().join(",");
    const duplicate = procs.procedures.find(
      (p) =>
        (p.date ?? null) === date &&
        p.type === body.type &&
        [...(p.teeth ?? [])].sort().join(",") === sameTeeth
    );
    if (duplicate) {
      return conflict("Такая процедура уже записана", { existing: duplicate });
    }

    procs.procedures.push({
      date,
      teeth,
      type: body.type,
      description: body.description,
      // doctor_id в данных всегда null и не заполняется: врач опознаётся парой
      // name + specialty (Блок 4), ссылка doc_XX не резолвится нигде
      doctor_id: null,
      notes: body.notes ?? "",
    });

    await writeDentalProcedures(procs);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Create failed" },
      { status: 500 }
    );
  }
}
