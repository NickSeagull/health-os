import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import { parseVisitDetailMd } from "../lib/data/visits";
import { getCanonicalUnit, isUnitMismatch, resolveAlias } from "../lib/data/lab-aliases";
import { isFutureDate, isIsoTimestamp, slugify, toMoscowTimestamp } from "../lib/data/validation";
import { MED_TIMINGS } from "../lib/types/medication";
import { isMoodCrisis } from "../lib/mood-crisis";
import { specialtyColors } from "../lib/chart-theme";

test("visit Markdown parser reads the English protocol labels", () => {
  const parsed = parseVisitDetailMd(
    "# Initial appointment\n\n" +
      "- **Date:** 2026-06-25\n" +
      "- **Doctor:** Alex Smith\n" +
      "- **Clinic:** Central Clinic\n" +
      "- **Specialty:** Cardiology\n"
  );

  assert.equal(parsed.title, "Initial appointment");
  assert.equal(parsed.date, "2026-06-25");
  assert.equal(parsed.doctor, "Alex Smith");
  assert.equal(parsed.clinic, "Central Clinic");
  assert.equal(parsed.specialty, "Cardiology");
});

test("lab aliases expose conventional English canonical names", () => {
  const aliases = {
    HGB: "Hemoglobin",
    WBC: "White blood cells",
    PLT: "Platelets",
    ESR: "ESR",
    Glucose: "Glucose",
    Creatinine: "Creatinine",
    ALT: "ALT",
    AST: "AST",
    "Total cholesterol": "Total cholesterol",
    LDL: "LDL",
    HDL: "HDL",
    Triglycerides: "Triglycerides",
    TSH: "TSH",
    "Free T4": "Free T4",
    Testosterone: "Total testosterone",
    Cortisol: "Cortisol",
    "25(OH)D": "Vitamin D",
    "Vitamin B12": "Vitamin B12",
    Ferritin: "Ferritin",
    Iron: "Iron",
  } as const;
  for (const [input, canonical] of Object.entries(aliases)) {
    assert.equal(resolveAlias(input), canonical, `${input} should resolve to ${canonical}`);
  }
  const registry = JSON.parse(readFileSync(new URL("../../Data/labs/_marker-aliases.json", import.meta.url), "utf8")) as { markers: { canonical: string }[] };
  const registered = new Set(registry.markers.map((marker) => marker.canonical));
  assert.equal(registered.size, registry.markers.length, "canonical names must be unique");
  for (const canonical of Object.values(aliases)) {
    assert.ok(registered.has(canonical), `${canonical} must be present in the shared registry`);
    assert.equal(resolveAlias(canonical), canonical, `${canonical} should remain canonical`);
  }
  assert.equal(isUnitMismatch("Hemoglobin", "g/L", "g/L"), false);
  assert.equal(isUnitMismatch("Hemoglobin", "g/dL", "g/L"), true);
});

test("registry aliases preserve marker identity and standard measurement units", () => {
  assert.equal(resolveAlias("Vitamin D (25-OH)"), "Vitamin D");
  assert.equal(resolveAlias("Serum iron"), "Iron");
  assert.equal(resolveAlias("Free thyroxine"), "Free T4");
  assert.equal(resolveAlias("Free testosterone"), "Free testosterone");
  assert.equal(getCanonicalUnit("TSH"), "mIU/L");
  assert.equal(getCanonicalUnit("Prolactin"), "µIU/mL");
  assert.equal(getCanonicalUnit("Ferritin"), "µg/L");
  assert.equal(getCanonicalUnit("Iron"), "µmol/L");
  assert.equal(getCanonicalUnit("ESR"), "mm/hr");
  assert.equal(getCanonicalUnit("Prothrombin time"), "s");
  assert.equal(isUnitMismatch("White blood cells", "x10^9/L"), false);
  assert.equal(isUnitMismatch("Total testosterone", "ng/mL"), true);
});

test("specialty aliases use their general and dentistry colors", () => {
  assert.equal(specialtyColors["primary care"], specialtyColors.general);
  assert.equal(specialtyColors["primary care physician"], specialtyColors.general);
  assert.equal(specialtyColors["restorative dentist"], specialtyColors.dentistry);
});

test("slugification and timestamp validation use English runtime inputs", () => {
  assert.equal(slugify("Cardiology"), "cardiology");
  assert.equal(isIsoTimestamp("2026-07-31T12:00:00+03:00"), true);
  assert.equal(isIsoTimestamp("2026-07-31T12:00:00"), false);
  assert.equal(isFutureDate("2999-01-01"), true);
  assert.equal(toMoscowTimestamp("2026-07-31T09:00:00Z"), "2026-07-31T12:00:00+03:00");
});

test("medication timing vocabulary is limited to the four schedule slots", () => {
  assert.deepEqual([...MED_TIMINGS], ["morning", "day", "evening", "night"]);
});

test("English crisis wording variants trigger the red-flag detector", () => {
  for (const notes of [
    "I don't want to wake up",
    "I do not want to wake up",
    "I don’t want to wake up",
    "She will be better off without me",
  ]) {
    const entry = {
      ts: "2026-07-31T12:00:00+03:00",
      mood: 7,
      energy: 5,
      stress: 5,
      sleep_quality: 5,
      notes,
      tags: [],
    };
    const reasons = isMoodCrisis(entry, [entry]);
    assert.ok(reasons?.some((reason) => reason.includes("immediate attention")), notes);
  }
});
