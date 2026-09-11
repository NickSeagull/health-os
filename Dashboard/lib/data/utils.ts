import fs from "fs/promises";
import path from "path";
import { parse } from "csv-parse/sync";
import matter from "gray-matter";

/**
 * Resolve filename inside baseDir and ensure the result stays within it.
 *
 * Protect against path traversal. path.join alone does NOT protect against it:
 * it collapses `..` but still allows escape, so `path.join(base, "../../x")`
 * returns a path outside base. This previously allowed arbitrary files to be read,
 * including API-key configuration, and files outside the project to be written.
 *
 * @param allowedExtensions when provided, the path must end with one of these extensions
 * @throws when filename escapes baseDir, contains a null byte, or uses a forbidden extension
 */
export function resolveWithin(
  baseDir: string,
  filename: string,
  allowedExtensions?: string[]
): string {
  if (typeof filename !== "string" || filename.length === 0) {
    throw new Error("invalid filename");
  }

  // Decode first; otherwise %2F..%2F could bypass the check.
  let decoded: string;
  try {
    decoded = decodeURIComponent(filename);
  } catch {
    throw new Error("invalid filename encoding");
  }

  if (decoded.includes("\0")) {
    throw new Error("invalid filename: null byte");
  }

  const base = path.resolve(baseDir);
  const target = path.resolve(base, decoded);

  // The trailing separator is required; otherwise /Data/labs-secret would pass
  // the check for /Data/labs.
  if (target !== base && !target.startsWith(base + path.sep)) {
    throw new Error("path escapes base directory");
  }

  if (allowedExtensions?.length) {
    const lower = target.toLowerCase();
    if (!allowedExtensions.some((ext) => lower.endsWith(ext))) {
      throw new Error("file extension not allowed");
    }
  }

  return target;
}

export async function safeReadJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function safeReadCsv<T>(
  filePath: string
): Promise<T[]> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return parse(raw, {
      columns: true,
      skip_empty_lines: true,
      cast: true,
      cast_date: false,
    }) as T[];
  } catch {
    return [];
  }
}

export async function safeReadJsonl<T>(filePath: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return raw
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line) as T);
  } catch {
    return [];
  }
}

export async function safeReadMarkdown(filePath: string) {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const { data, content } = matter(raw);
    return { frontmatter: data, content, raw };
  } catch {
    return null;
  }
}

export async function safeReadFile(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

export async function safeWriteJson(
  filePath: string,
  data: unknown
): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  const tmp = filePath + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf-8");
  await fs.rename(tmp, filePath);
}

export async function safeAppendJsonl(
  filePath: string,
  entry: unknown
): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.appendFile(filePath, JSON.stringify(entry) + "\n", "utf-8");
}

export async function safeAppendCsv(
  filePath: string,
  row: Record<string, unknown>,
  headers: string[]
): Promise<void> {
  const values = headers.map((h) => {
    const v = row[h];
    if (v === undefined || v === null) return "";
    const s = String(v);
    return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  });
  await fs.appendFile(filePath, values.join(",") + "\n", "utf-8");
}

export async function safeWriteFile(
  filePath: string,
  content: string
): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, content, "utf-8");
}
