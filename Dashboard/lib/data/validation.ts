import { NextResponse } from "next/server";

/**
 * Input validation for mutating routes.
 *
 * Before this module existed, routes wrote everything from the request body to Data/:
 * a future date, weight 8.25 instead of 82.5, or a status outside the enum could all
 * reach disk silently and surface later as a broken trend or invariant.
 * The schemas used by these checks are described in .claude/shared/data-schemas.md.
 */

/**
 * Since 2014, Moscow has used fixed UTC+3 without daylight saving time,
 * so the offset is a constant rather than being computed through Intl.
 */
const MSK_OFFSET_MS = 3 * 60 * 60 * 1000;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

/** Today's date in Moscow, used as the reference for "not in the future". */
export function todayMoscow(): string {
  return new Date(Date.now() + MSK_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * A calendar-valid YYYY-MM-DD date.
 * A regular expression alone is insufficient: it allows 2026-02-31 and 2026-13-01.
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
 * Convert a timestamp to Moscow time: Block 12 of data-schemas.md requires
 * `+03:00`, while browsers send UTC ("…Z"). The instant does not change.
 */
export function toMoscowTimestamp(value: string): string {
  const shifted = new Date(new Date(value).getTime() + MSK_OFFSET_MS);
  return shifted.toISOString().replace(/\.\d+Z$/, "+03:00");
}

/** Broad physiological bounds catch order-of-magnitude typos; they do not diagnose. */
export const RANGES = {
  weight_kg: { min: 30, max: 250, label: "weight (kg)" },
  height_cm: { min: 50, max: 250, label: "height (cm)" },
  bmi: { min: 8, max: 100, label: "BMI" },
  body_fat_pct: { min: 1, max: 70, label: "body fat percentage" },
  muscle_mass_kg: { min: 10, max: 120, label: "muscle mass (kg)" },
  systolic: { min: 70, max: 250, label: "systolic blood pressure" },
  diastolic: { min: 40, max: 150, label: "diastolic blood pressure" },
  heart_rate: { min: 30, max: 220, label: "heart rate" },
  waist_cm: { min: 30, max: 250, label: "waist circumference (cm)" },
  score_1_10: { min: 1, max: 10, label: "score" },
  cost_rub: { min: 0, max: 100_000_000, label: "amount (RUB)" },
} as const;

export type RangeKey = keyof typeof RANGES;

/**
 * Accumulate errors so they can be returned together rather than one per request.
 * An empty or missing optional value is not an error.
 */
export class Validator {
  private errors: string[] = [];

  add(message: string): this {
    this.errors.push(message);
    return this;
  }

  /** Required non-empty string. */
  requireString(value: unknown, field: string): this {
    if (typeof value !== "string" || value.trim() === "") {
      this.add(`${field}: required non-empty string`);
    }
    return this;
  }

  /** Required YYYY-MM-DD date; by default, it cannot be in the future. */
  requireDate(value: unknown, field: string, allowFuture = false): this {
    if (!isIsoDate(value)) {
      this.add(`${field}: date must use YYYY-MM-DD format`);
    } else if (!allowFuture && isFutureDate(value)) {
      this.add(`${field}: date is in the future (${value}); today is ${todayMoscow()}`);
    }
    return this;
  }

  /** Date that may be omitted or set to null. */
  optionalDate(value: unknown, field: string, allowFuture = false): this {
    if (value === undefined || value === null || value === "") return this;
    return this.requireDate(value, field, allowFuture);
  }

  /** Number within broad physiological bounds; undefined, null, and "" are allowed. */
  optionalNumber(value: unknown, field: string, range: RangeKey): this {
    if (value === undefined || value === null || value === "") return this;
    const { min, max, label } = RANGES[range];
    if (typeof value !== "number" || !Number.isFinite(value)) {
      this.add(`${field}: must be a number`);
    } else if (value < min || value > max) {
      this.add(`${field}: ${value} is outside the ${min}–${max} range (${label})`);
    }
    return this;
  }

  requireNumber(value: unknown, field: string, range: RangeKey): this {
    if (value === undefined || value === null || value === "") {
      this.add(`${field}: required field`);
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
      this.add(`${field}: allowed values are ${allowed.join(", ")}`);
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
      this.add(`${field}: must be an array`);
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

  /** Return a 400 with all problems, or null when validation succeeds. */
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
 * The `[file]` route parameter must be a filename, with no separators or
 * parent-directory traversal.
 *
 * `resolveWithin` would reject this path anyway, but throwing an exception would
 * expose a 500 with the internal message "path escapes base directory".
 * Invalid input should produce 400, not a server failure.
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

/** 409: the record already exists. Silent overwrites are forbidden (Block 0). */
export function conflict(
  error: string,
  extra?: Record<string, unknown>
): NextResponse {
  return NextResponse.json({ error, ...extra }, { status: 409 });
}

/**
 * Latin kebab-case for filenames. Existing lab files and visits use Latin names;
 * non-Latin input is removed by the slugifier rather than retained as an identifier.
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
