import fs from "fs/promises";
import { NextResponse } from "next/server";
import { readVisitIndex, writeVisitIndex } from "@/lib/data/visits";
import { safeWriteJson, safeWriteFile, resolveWithin } from "@/lib/data/utils";
import { dataPath } from "@/lib/data/paths";
import { Validator, conflict, slugify, todayMoscow } from "@/lib/data/validation";

export async function GET() {
  const index = await readVisitIndex();
  if (!index) {
    return NextResponse.json({ error: "Visit index not found" }, { status: 404 });
  }
  return NextResponse.json(index);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, specialty, doctor, clinic, brief, content, format } = body ?? {};

    const v = new Validator();
    // date попадает в имя файла напрямую — без проверки через него уходили за пределы каталога
    v.requireDate(date, "date");
    v.requireString(specialty, "specialty");
    v.requireString(brief, "brief");
    v.optionalEnum(format, "format", ["md", "json"] as const);
    if (doctor !== undefined && doctor !== null && typeof doctor !== "string") {
      v.add("doctor: строка либо null");
    }
    if (clinic !== undefined && typeof clinic !== "string") {
      v.add("clinic: строка");
    }
    if (format === "md" && content !== undefined && typeof content !== "string") {
      v.add("content: строка");
    }

    const invalid = v.response();
    if (invalid) return invalid;

    // Кириллица транслитерируется: конвенция имён визитов — латиница, kebab-case
    const slug = slugify(specialty);
    if (!slug) {
      return NextResponse.json(
        { error: "specialty: не удалось построить имя файла" },
        { status: 400 }
      );
    }

    const ext = format === "md" ? "md" : "json";
    const filename = `${date}_${slug}.${ext}`;
    const filePath = resolveWithin(dataPath("doctors", "visits"), filename, [`.${ext}`]);

    // Ключ дубликата визита — date + specialty (Блок 0), и он же даёт имя файла.
    // Молча перезаписать протокол приёма нельзя
    const exists = await fs
      .access(filePath)
      .then(() => true)
      .catch(() => false);
    if (exists) {
      return conflict(
        `Визит ${filename} уже записан. Дополните существующий протокол или уточните специальность`,
        { file: filename }
      );
    }

    if (ext === "md") {
      const mdContent =
        content ||
        `# ${brief}\n\n- **Дата:** ${date}\n- **Врач:** ${doctor || "—"}\n- **Клиника:** ${clinic || "—"}\n- **Специальность:** ${specialty}\n`;
      await safeWriteFile(filePath, mdContent);
    } else {
      await safeWriteJson(filePath, {
        version: 1,
        date,
        type: "консультация",
        specialty,
        doctor: doctor || null,
        clinic: clinic || "",
        reason: brief,
        findings: [],
        diagnosis: [],
        prescriptions: [],
        follow_up: null,
      });
    }

    const index = await readVisitIndex();
    if (index) {
      index.visits.push({
        date,
        file: filename,
        // format обязан совпадать с расширением file — инвариант Блока 5
        format: ext,
        specialty,
        doctor: doctor || null,
        clinic: clinic || "",
        brief,
      });
      // Индекс держим отсортированным по дате: период вида «2005-2012»
      // сортируется по первым четырём символам, поэтому сравниваем строки
      index.visits.sort((a, b) => a.date.localeCompare(b.date));
      index.total = index.visits.length;
      index.generated = todayMoscow();
      await writeVisitIndex(index);
    }

    return NextResponse.json({ success: true, file: filename });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Create failed" },
      { status: 500 }
    );
  }
}
