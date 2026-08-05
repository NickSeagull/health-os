import fs from "fs/promises";
import path from "path";
import { parse } from "csv-parse/sync";
import matter from "gray-matter";

/**
 * Резолвит filename внутри baseDir и гарантирует, что результат не выходит за его пределы.
 *
 * Защита от path traversal. path.join сам по себе НЕ защищает: он схлопывает `..`,
 * но спокойно выпускает наружу — `path.join(base, "../../x")` вернёт путь вне base.
 * Через это читались произвольные файлы, включая конфиги с API-ключами, и записывались
 * файлы за пределы проекта.
 *
 * @param allowedExtensions если задан, путь обязан оканчиваться на одно из расширений
 * @throws если filename пытается выйти за baseDir, содержит нулевой байт или запрещённое расширение
 */
export function resolveWithin(
  baseDir: string,
  filename: string,
  allowedExtensions?: string[]
): string {
  if (typeof filename !== "string" || filename.length === 0) {
    throw new Error("invalid filename");
  }

  // Декодируем, иначе %2F..%2F обходит проверку
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

  // Разделитель в конце обязателен: иначе /Data/labs-secret пройдёт проверку на /Data/labs
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
