import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { readLabIndex } from "@/lib/data/labs";
import { safeReadJson, safeWriteJson, resolveWithin } from "@/lib/data/utils";
import { dataPath } from "@/lib/data/paths";
import { Validator, conflict, slugify } from "@/lib/data/validation";
import { MARKER_STATUSES, countMarkerStatuses, markerFlags } from "@/lib/lab-write";
import type { LabIndex, LabMarker } from "@/lib/types/lab";

export async function GET() {
  const index = await readLabIndex();
  if (!index) {
    return NextResponse.json({ error: "Lab index not found" }, { status: 404 });
  }
  return NextResponse.json(index);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, lab, type, markers, summary, notes } = body ?? {};

    const v = new Validator();
    // date попадает в имя файла напрямую — без проверки через него уходили за пределы каталога
    v.requireDate(date, "date");
    v.requireString(type, "type");
    v.requireString(lab, "laboratory");
    v.requireArray(markers, "markers");

    const list: unknown[] = Array.isArray(markers) ? markers : [];
    if (list.length === 0) v.add("markers: нужен хотя бы один маркер");

    list.forEach((raw, i) => {
      const m = raw as Partial<LabMarker>;
      if (!m || typeof m !== "object") {
        v.add(`markers[${i}]: объект маркера`);
        return;
      }
      if (typeof m.name !== "string" || m.name.trim() === "") {
        v.add(`markers[${i}].name: обязательное поле`);
      }
      if (m.value === undefined || m.value === null || m.value === "") {
        v.add(`markers[${i}].value: обязательное поле`);
      }
      // unit не опускается даже при безразмерном результате — тогда "" (Блок 1)
      if (typeof m.unit !== "string") {
        v.add(`markers[${i}].unit: строка, для безразмерного результата — пустая`);
      }
      v.requireEnum(m.status, `markers[${i}].status`, MARKER_STATUSES);
    });

    const invalid = v.response();
    if (invalid) return invalid;

    // Кириллица транслитерируется: все 60 существующих файлов названы латиницей
    const slug = slugify(type);
    if (!slug) {
      return NextResponse.json(
        { error: "type: не удалось построить имя файла, укажите тип латиницей" },
        { status: 400 }
      );
    }

    const filename = `${date}_${slug}.json`;
    const filePath = resolveWithin(dataPath("labs"), filename, [".json"]);

    // Молча перезаписывать существующий файл запрещено (Блок 0): за одну дату
    // в Data/labs/ лежит до шести разных анализов, имя не уникально само по себе
    const exists = await fs
      .access(filePath)
      .then(() => true)
      .catch(() => false);
    if (exists) {
      return conflict(
        `Файл ${filename} уже существует. Уточните тип, чтобы имя стало различимым`,
        { file: filename }
      );
    }

    const typed = list as LabMarker[];

    // Канон для новых записей — v2 с panels[] (Блок 1). Прежде роут писал плоский
    // markers[] с полем `lab`, то есть создавал файлы в схеме, от которой ушли
    const labData = {
      version: 1,
      date,
      type,
      laboratory: lab,
      source: "manual_entry",
      pdf_path: null,
      // В v2 summary — объект счётчиков, свободный текст уходит в notes
      summary: countMarkerStatuses(typed),
      // Заголовок панели на диске лежит в `name` — так во всех четырёх файлах v2.
      // В data-schemas.md Блок 1 указан ключ `panel`, но такого ключа в данных нет
      panels: [{ name: type, markers: typed }],
      notes: [summary, notes].filter(Boolean).join(" ") || undefined,
    };

    await safeWriteJson(filePath, labData);

    const indexPath = path.join(dataPath("labs"), "_index.json");
    const index = await safeReadJson<LabIndex>(indexPath);
    if (index) {
      index.analyses.push({
        date,
        file: filename,
        type,
        lab,
        markers_count: typed.length,
        flags: markerFlags(typed),
      });
      // Индекс отсортирован по дате по возрастанию (Блок 2). push() в конец
      // рушил порядок для всех, кто на него полагается
      index.analyses.sort((a, b) => a.date.localeCompare(b.date));
      await safeWriteJson(indexPath, index);
    }

    return NextResponse.json({ success: true, file: filename });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Create failed" },
      { status: 500 }
    );
  }
}
