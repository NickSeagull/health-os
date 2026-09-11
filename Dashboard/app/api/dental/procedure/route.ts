import { NextResponse } from "next/server";
import { readDentalProcedures, writeDentalProcedures } from "@/lib/data/dental";
import { Validator, conflict } from "@/lib/data/validation";
import { isFdiToothNumber } from "@/lib/dental-summary";

/**
 * Procedure type enum — Block 7 of data-schemas.md. Previously `type` was written
 * as supplied, including an empty string, allowing values outside the enum into the file.
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
    // `date: null` is allowed: all four existing records have an unknown date,
    // and substituting today's date is forbidden (Block 0).
    v.optionalDate(body?.date, "date");
    v.requireEnum(body?.type, "type", PROCEDURE_TYPES);
    v.requireString(body?.description, "description");
    v.optionalArray(body?.teeth, "teeth");

    const teeth: string[] = Array.isArray(body?.teeth) ? body.teeth : [];
    for (const tooth of teeth) {
      if (typeof tooth !== "string" || !isFdiToothNumber(tooth)) {
        v.add(`teeth: "${tooth}" is not an ISO 3950 number (11–18, 21–28, 31–38, 41–48)`);
      }
    }
    if (body?.notes !== undefined && typeof body.notes !== "string") {
      v.add("notes: string");
    }

    const invalid = v.response();
    if (invalid) return invalid;

    const procs = await readDentalProcedures();
    if (!procs) {
      return NextResponse.json({ error: "Procedures not found" }, { status: 404 });
    }

    const date = body.date || null;

    // Duplicate key: date + type + teeth (Block 0). Do not silently append
    // the same procedure: the history would contain two extractions of one tooth.
    const sameTeeth = [...teeth].sort().join(",");
    const duplicate = procs.procedures.find(
      (p) =>
        (p.date ?? null) === date &&
        p.type === body.type &&
        [...(p.teeth ?? [])].sort().join(",") === sameTeeth
    );
    if (duplicate) {
      return conflict("This procedure is already recorded", { existing: duplicate });
    }

    procs.procedures.push({
      date,
      teeth,
      type: body.type,
      description: body.description,
      // doctor_id is always null in the data and is not populated: a doctor is identified by
      // the name + specialty pair (Block 4), and the doc_XX reference is not resolved anywhere.
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
