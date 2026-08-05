import { NextResponse } from "next/server";
import { readMeds, writeMeds } from "@/lib/data/meds";
import { Validator } from "@/lib/data/validation";
import type { MedsFile } from "@/lib/types/medication";

/** Четыре независимых массива Блока 11. Потеря любого делает записи невидимыми */
const MED_ARRAYS = ["medications", "supplements", "topical", "protocols"] as const;

const MED_STATUSES = ["active", "as_needed", "paused", "finished"] as const;

export async function GET() {
  const meds = await readMeds();
  if (!meds) {
    return NextResponse.json({ error: "Meds not found" }, { status: 404 });
  }
  return NextResponse.json(meds);
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Partial<MedsFile>;

    const existing = await readMeds();
    if (!existing) {
      return NextResponse.json({ error: "Meds not found" }, { status: 404 });
    }

    const v = new Validator();
    for (const key of MED_ARRAYS) {
      // Клиент присылает файл целиком: пропущенный массив означал бы, что
      // все курсы из него исчезли молча
      v.requireArray(body?.[key], key);

      // Обходим только то, что действительно массив, иначе `.entries()` роняет роут
      const items = Array.isArray(body?.[key]) ? body[key] : [];
      for (const [i, item] of items.entries()) {
        const entry = item as { id?: unknown; name?: unknown; status?: unknown };
        if (typeof entry?.id !== "string" || entry.id.trim() === "") {
          v.add(`${key}[${i}].id: обязательное поле (${key.slice(0, 3)}_NN)`);
        }
        if (typeof entry?.name !== "string" || entry.name.trim() === "") {
          v.add(`${key}[${i}].name: обязательное поле`);
        }
        // protocols[] в данных пуст, набор его статусов не зафиксирован
        if (key !== "protocols") {
          v.requireEnum(entry?.status, `${key}[${i}].status`, MED_STATUSES);
        }
      }
    }

    const invalid = v.response();
    if (invalid) return invalid;

    await writeMeds({
      ...existing,
      ...(body as MedsFile),
      // version сохраняется при перезаписи и никогда не сбрасывается (Блок 0)
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
