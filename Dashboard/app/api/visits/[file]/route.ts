import { NextRequest, NextResponse } from "next/server";
import {
  readVisitDetailJson,
  readVisitDetailMd,
  writeVisitDetailJson,
  writeVisitDetailMd,
} from "@/lib/data/visits";
import { Validator, badRequest, isPlainFilename } from "@/lib/data/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;

  if (file.endsWith(".md")) {
    const data = await readVisitDetailMd(file);
    if (!data) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  }

  const data = await readVisitDetailJson(file);
  if (!data) {
    return NextResponse.json({ error: "Visit not found" }, { status: 404 });
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

    const body = await request.json();

    if (file.endsWith(".md")) {
      // Раньше при отсутствии content в writeFile уходил undefined — протокол
      // затирался строкой «undefined» либо падал пятисоткой
      if (typeof body?.content !== "string" || body.content.trim() === "") {
        return badRequest("content: непустая строка с текстом протокола");
      }
      await writeVisitDetailMd(file, body.content);
      return NextResponse.json({ success: true });
    }

    const existing = await readVisitDetailJson(file);
    if (!existing) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    const v = new Validator();
    if (body?.date !== undefined) v.requireDate(body.date, "date");
    if (body?.specialty !== undefined) v.requireString(body.specialty, "specialty");
    if (body?.type !== undefined) v.requireString(body.type, "type");
    v.optionalArray(body?.findings, "findings");
    v.optionalArray(body?.diagnosis, "diagnosis");
    v.optionalArray(body?.prescriptions, "prescriptions");
    if (Array.isArray(body?.prescriptions)) {
      body.prescriptions.forEach((p: unknown, i: number) => {
        const drug = (p as { drug?: unknown })?.drug;
        if (typeof drug !== "string" || drug.trim() === "") {
          v.add(`prescriptions[${i}].drug: обязательное поле`);
        }
      });
    }

    const invalid = v.response();
    if (invalid) return invalid;

    // Слияние с существующим: тело запроса заменяло файл целиком и сносило
    // card_number, source и прочие поля, которых редактор не показывает
    await writeVisitDetailJson(file, {
      ...existing,
      ...body,
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
