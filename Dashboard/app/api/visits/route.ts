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
    // date is inserted directly into the filename; without validation it could escape the directory.
    v.requireDate(date, "date");
    v.requireString(specialty, "specialty");
    v.requireString(brief, "brief");
    v.optionalEnum(format, "format", ["md", "json"] as const);
    if (doctor !== undefined && doctor !== null && typeof doctor !== "string") {
      v.add("doctor: string or null");
    }
    if (clinic !== undefined && typeof clinic !== "string") {
      v.add("clinic: string");
    }
    if (format === "md" && content !== undefined && typeof content !== "string") {
      v.add("content: string");
    }

    const invalid = v.response();
    if (invalid) return invalid;

    // Visit filenames use Latin characters in kebab-case.
    const slug = slugify(specialty);
    if (!slug) {
      return NextResponse.json(
        { error: "specialty: could not build a filename" },
        { status: 400 }
      );
    }

    const ext = format === "md" ? "md" : "json";
    const filename = `${date}_${slug}.${ext}`;
    const filePath = resolveWithin(dataPath("doctors", "visits"), filename, [`.${ext}`]);

    // Visit duplicate key: date + specialty (Block 0), which also determines the filename.
    // Do not silently overwrite a visit record.
    const exists = await fs
      .access(filePath)
      .then(() => true)
      .catch(() => false);
    if (exists) {
      return conflict(
        `Visit ${filename} is already recorded. Update the existing record or specify a different specialty`,
        { file: filename }
      );
    }

    if (ext === "md") {
      const mdContent =
        content ||
        `# ${brief}\n\n- **Date:** ${date}\n- **Doctor:** ${doctor || "—"}\n- **Clinic:** ${clinic || "—"}\n- **Specialty:** ${specialty}\n`;
      await safeWriteFile(filePath, mdContent);
    } else {
      await safeWriteJson(filePath, {
        version: 1,
        date,
        type: "consultation",
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
        // format must match the file extension; this is the Block 5 invariant.
        format: ext,
        specialty,
        doctor: doctor || null,
        clinic: clinic || "",
        brief,
      });
      // Keep the index sorted by date: a period such as "2005-2012" sorts
      // by its first four characters, so string comparison is sufficient.
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
