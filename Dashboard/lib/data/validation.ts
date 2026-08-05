import { NextResponse } from "next/server";

/**
 * Проверки входных данных для мутирующих роутов.
 *
 * До появления этого модуля роуты писали в Data/ всё, что пришло в теле запроса:
 * дата из будущего, вес 8.25 вместо 82.5, статус, которого нет в enum, — всё
 * попадало на диск молча и всплывало потом как «сломанный тренд» или битый инвариант.
 * Схемы, на которые опираются проверки, описаны в .claude/shared/data-schemas.md.
 */

/**
 * Москва с 2014 года живёт на фиксированном UTC+3 без перехода на летнее время,
 * поэтому смещение задано константой, а не вычисляется через Intl.
 */
const MSK_OFFSET_MS = 3 * 60 * 60 * 1000;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

/** Сегодняшняя дата по Москве — точка отсчёта для «не из будущего» */
export function todayMoscow(): string {
  return new Date(Date.now() + MSK_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * Календарно существующая дата YYYY-MM-DD.
 * Одной регулярки мало: она пропускает 2026-02-31 и 2026-13-01.
 */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

export function isFutureDate(date: string): boolean {
  return date > todayMoscow();
}

export function isIsoTimestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    ISO_TIMESTAMP.test(value) &&
    !Number.isNaN(new Date(value).getTime())
  );
}

/**
 * Приводит отметку времени к московской зоне: Блок 12 data-schemas.md требует
 * `+03:00`, а браузер отдаёт UTC («…Z»). Момент времени при этом не меняется.
 */
export function toMoscowTimestamp(value: string): string {
  const shifted = new Date(new Date(value).getTime() + MSK_OFFSET_MS);
  return shifted.toISOString().replace(/\.\d+Z$/, "+03:00");
}

/** Грубые физиологические границы: ловят опечатку в разряде, а не ставят диагноз */
export const RANGES = {
  weight_kg: { min: 30, max: 250, label: "вес (кг)" },
  height_cm: { min: 50, max: 250, label: "рост (см)" },
  bmi: { min: 8, max: 100, label: "ИМТ" },
  body_fat_pct: { min: 1, max: 70, label: "процент жира" },
  muscle_mass_kg: { min: 10, max: 120, label: "мышечная масса (кг)" },
  systolic: { min: 70, max: 250, label: "систолическое давление" },
  diastolic: { min: 40, max: 150, label: "диастолическое давление" },
  heart_rate: { min: 30, max: 220, label: "пульс" },
  waist_cm: { min: 30, max: 250, label: "объём талии (см)" },
  score_1_10: { min: 1, max: 10, label: "оценка" },
  cost_rub: { min: 0, max: 100_000_000, label: "сумма (₽)" },
} as const;

export type RangeKey = keyof typeof RANGES;

/**
 * Копит ошибки, чтобы вернуть их разом, а не по одной за запрос.
 * Пустое/отсутствующее значение необязательного поля ошибкой не считается.
 */
export class Validator {
  private errors: string[] = [];

  add(message: string): this {
    this.errors.push(message);
    return this;
  }

  /** Обязательная непустая строка */
  requireString(value: unknown, field: string): this {
    if (typeof value !== "string" || value.trim() === "") {
      this.add(`${field}: обязательное поле, непустая строка`);
    }
    return this;
  }

  /** Обязательная дата YYYY-MM-DD, по умолчанию не из будущего */
  requireDate(value: unknown, field: string, allowFuture = false): this {
    if (!isIsoDate(value)) {
      this.add(`${field}: дата в формате YYYY-MM-DD`);
    } else if (!allowFuture && isFutureDate(value)) {
      this.add(`${field}: дата из будущего (${value}), сегодня ${todayMoscow()}`);
    }
    return this;
  }

  /** Дата, которую допустимо не указывать или указать как null */
  optionalDate(value: unknown, field: string, allowFuture = false): this {
    if (value === undefined || value === null || value === "") return this;
    return this.requireDate(value, field, allowFuture);
  }

  /** Число в грубых физиологических границах; undefined/null/"" пропускаются */
  optionalNumber(value: unknown, field: string, range: RangeKey): this {
    if (value === undefined || value === null || value === "") return this;
    const { min, max, label } = RANGES[range];
    if (typeof value !== "number" || !Number.isFinite(value)) {
      this.add(`${field}: должно быть числом`);
    } else if (value < min || value > max) {
      this.add(`${field}: ${value} вне диапазона ${min}–${max} (${label})`);
    }
    return this;
  }

  requireNumber(value: unknown, field: string, range: RangeKey): this {
    if (value === undefined || value === null || value === "") {
      this.add(`${field}: обязательное поле`);
      return this;
    }
    return this.optionalNumber(value, field, range);
  }

  requireEnum<T extends string>(
    value: unknown,
    field: string,
    allowed: readonly T[]
  ): this {
    if (typeof value !== "string" || !allowed.includes(value as T)) {
      this.add(`${field}: допустимые значения — ${allowed.join(", ")}`);
    }
    return this;
  }

  optionalEnum<T extends string>(
    value: unknown,
    field: string,
    allowed: readonly T[]
  ): this {
    if (value === undefined || value === null) return this;
    return this.requireEnum(value, field, allowed);
  }

  requireArray(value: unknown, field: string): this {
    if (!Array.isArray(value)) {
      this.add(`${field}: должно быть массивом`);
    }
    return this;
  }

  optionalArray(value: unknown, field: string): this {
    if (value === undefined || value === null) return this;
    return this.requireArray(value, field);
  }

  get ok(): boolean {
    return this.errors.length === 0;
  }

  /** Ответ 400 со списком всех проблем сразу, либо null, если проверки прошли */
  response(): NextResponse | null {
    if (this.ok) return null;
    return NextResponse.json(
      { error: this.errors.join("; "), fields: this.errors },
      { status: 400 }
    );
  }
}

export function badRequest(error: string): NextResponse {
  return NextResponse.json({ error }, { status: 400 });
}

/**
 * Параметр маршрута `[file]` обязан быть именно именем файла: без разделителей
 * и переходов вверх.
 *
 * `resolveWithin` такой путь всё равно отвергнет, но бросив исключение — наружу
 * уходила пятисотка с внутренним текстом «path escapes base directory».
 * Отказ во входных данных — это 400, а не сбой сервера.
 */
export function isPlainFilename(value: unknown): value is string {
  if (typeof value !== "string" || value === "") return false;

  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return false;
  }

  if (decoded.includes("\0")) return false;
  if (decoded === "." || decoded === "..") return false;
  return !/[\\/]/.test(decoded);
}

/** 409 — запись уже существует. Молча перезаписывать данные запрещено (Блок 0) */
export function conflict(
  error: string,
  extra?: Record<string, unknown>
): NextResponse {
  return NextResponse.json({ error, ...extra }, { status: 409 });
}

/**
 * Латинский kebab-case для имени файла. Кириллица транслитерируется:
 * все 60 существующих файлов в Data/labs/ и все визиты названы латиницей,
 * а прежняя регулярка оставляла русские буквы как есть.
 */
const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh",
  з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts",
  ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu",
  я: "ya",
};

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .split("")
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
