import { NextRequest, NextResponse } from "next/server";
import { readLabFile, writeLabFile } from "@/lib/data/labs";
import { collectMarkers } from "@/lib/lab-markers";
import { Validator, badRequest, isPlainFilename } from "@/lib/data/validation";
import { MARKER_STATUSES } from "@/lib/lab-write";
import type { LabFileData, LabMarker } from "@/lib/types/lab";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;
  const data = await readLabFile(file);
  if (!data) {
    return NextResponse.json({ error: "Lab file not found" }, { status: 404 });
  }
  return NextResponse.json(data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  try {
    const { file } = await params;
    if (!isPlainFilename(file)) {
      return badRequest("file: имя файла без пути");
    }

    const body = (await request.json()) as Partial<LabFileData>;

    // Правка идёт поверх существующего файла: тело запроса перезаписывало его
    // целиком, снося поля, о которых роут не знает — pdf_path, deviations,
    // order_number, а у файлов v3 ещё и studies[] со всеми маркерами
    const existing = await readLabFile(file);
    if (!existing) {
      return NextResponse.json({ error: "Lab file not found" }, { status: 404 });
    }

    const v = new Validator();
    if (body?.date !== undefined) v.requireDate(body.date, "date");
    v.optionalDate(body?.analysis_date, "analysis_date");
    v.optionalDate(body?.result_date, "result_date");
    v.optionalDate(body?.scanned_date, "scanned_date");
    if (body?.type !== undefined) v.requireString(body.type, "type");

    // Маркеры проверяем во всех трёх поколениях схемы разом
    const incoming: LabMarker[] = collectMarkers(body as LabFileData);
    incoming.forEach((m, i) => {
      if (typeof m?.name !== "string" || m.name.trim() === "") {
        v.add(`markers[${i}].name: обязательное поле`);
      }
      if (m?.value === undefined && m?.value_text === undefined) {
        v.add(`markers[${i}]: нужно value либо value_text`);
      }
      v.requireEnum(m?.status, `markers[${i}].status`, MARKER_STATUSES);
    });

    const invalid = v.response();
    if (invalid) return invalid;

    const merged: LabFileData = {
      ...existing,
      ...body,
      // version никогда не сбрасывается и не удаляется (Блок 0)
      version: existing.version ?? 1,
    };

    await writeLabFile(file, merged);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Write failed" },
      { status: 500 }
    );
  }
}
