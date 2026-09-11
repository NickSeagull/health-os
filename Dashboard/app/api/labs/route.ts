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
    // date is inserted directly into the filename; without validation it could escape the directory.
    v.requireDate(date, "date");
    v.requireString(type, "type");
    v.requireString(lab, "laboratory");
    v.requireArray(markers, "markers");

    const list: unknown[] = Array.isArray(markers) ? markers : [];
    if (list.length === 0) v.add("markers: at least one marker is required");

    list.forEach((raw, i) => {
      const m = raw as Partial<LabMarker>;
      if (!m || typeof m !== "object") {
        v.add(`markers[${i}]: marker object required`);
        return;
      }
      if (typeof m.name !== "string" || m.name.trim() === "") {
        v.add(`markers[${i}].name: required field`);
      }
      if (m.value === undefined || m.value === null || m.value === "") {
        v.add(`markers[${i}].value: required field`);
      }
      // unit is required even for a unitless result; use "" in that case (Block 1).
      if (typeof m.unit !== "string") {
        v.add(`markers[${i}].unit: string; use an empty string for a unitless result`);
      }
      v.requireEnum(m.status, `markers[${i}].status`, MARKER_STATUSES);
    });

    const invalid = v.response();
    if (invalid) return invalid;

    // Existing lab files use Latin filenames.
    const slug = slugify(type);
    if (!slug) {
      return NextResponse.json(
        { error: "type: could not build a filename; provide the type in Latin characters" },
        { status: 400 }
      );
    }

    const filename = `${date}_${slug}.json`;
    const filePath = resolveWithin(dataPath("labs"), filename, [".json"]);

    // Silent overwrite is forbidden (Block 0): Data/labs/ can contain up to six
    // different tests for one date, so the filename is not unique by date alone.
    const exists = await fs
      .access(filePath)
      .then(() => true)
      .catch(() => false);
    if (exists) {
      return conflict(
        `File ${filename} already exists. Specify the type so the filename is unique`,
        { file: filename }
      );
    }

    const typed = list as LabMarker[];

    // New records use the v2 canonical schema with panels[] (Block 1). Previously
    // the route wrote flat markers[] with a `lab` field, creating outdated files.
    const labData = {
      version: 1,
      date,
      type,
      laboratory: lab,
      source: "manual_entry",
      pdf_path: null,
      // In v2, summary is a counter object; free text goes into notes.
      summary: countMarkerStatuses(typed),
      // The panel title is stored in `name`, as in all four v2 files.
      // Block 1 of data-schemas.md lists `panel`, but that key is absent from the data.
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
      // Keep the index sorted by ascending date (Block 2). Pushing to the end
      // broke ordering for every consumer that relies on it.
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
