import fs from "fs";
import { sharedDataPath } from "./paths";

/**
 * Canonical marker names and measurement units.
 *
 * The source of truth is `Data/labs/_marker-aliases.json`. Previously this file
 * contained hard-coded aliases WITHOUT unit information, so a trend for a marker
 * reported by different laboratories in different units could become numerically
 * meaningless: for example, testosterone 17.33 nmol/L → 6.5 ng/mL looked like a
 * threefold collapse even though it was an increase.
 *
 * English abbreviations from analyzer exports are not necessarily covered by the
 * canonical dictionary, so an additional device-alias layer is defined below.
 */

interface CanonicalMarker {
  canonical: string;
  synonyms?: string[];
  not_synonyms?: string[];
  canonical_unit?: string;
  units_seen?: string[];
  conversions?: Record<string, number>;
  risk?: string;
  note?: string;
}

interface AliasFile {
  version: number;
  markers: CanonicalMarker[];
}

/** Analyzer abbreviations and common English names not guaranteed in the canonical dictionary. */
const deviceAliases: Record<string, string> = {
  HGB: "Hemoglobin",
  Hb: "Hemoglobin",
  Hemoglobin: "Hemoglobin",
  "Hemoglobin (HGB)": "Hemoglobin",
  WBC: "White blood cells",
  "White blood cells": "White blood cells",
  RBC: "Red blood cells",
  PLT: "Platelets",
  Platelets: "Platelets",
  HCT: "Hematocrit",
  "Hematocrit (HCT)": "Hematocrit",
  ESR: "ESR",
  Glucose: "Glucose",
  "Venous glucose": "Glucose",
  Creatinine: "Creatinine",
  Urea: "Urea",
  "Uric acid": "Uric acid",
  ALT: "ALT",
  AST: "AST",
  GGT: "GGT",
  ALP: "Alkaline phosphatase",
  "Total cholesterol": "Total cholesterol",
  HDL: "HDL",
  LDL: "LDL",
  Triglycerides: "Triglycerides",
  TSH: "TSH",
  "TSH (thyroid-stimulating hormone)": "TSH",
  "Free T3": "Free T3",
  "Free T4": "Free T4",
  Testosterone: "Total testosterone",
  "Total testosterone": "Total testosterone",
  Cortisol: "Cortisol",
  ACTH: "ACTH",
  "25-OH Vitamin D": "Vitamin D",
  "25(OH)D": "Vitamin D",
  "Vitamin D": "Vitamin D",
  "Vitamin B12": "Vitamin B12",
  Ferritin: "Ferritin",
  Iron: "Iron",
  CRP: "C-reactive protein",
  Potassium: "Potassium",
  Sodium: "Sodium",
  Calcium: "Calcium",
  GFR: "GFR",
  eGFR: "GFR",
  Microalbumin: "Microalbumin",
};

let aliasMap: Record<string, string> = {};
let unitMap: Record<string, string> = {};
let riskMap: Record<string, string> = {};
let loaded = false;

function load(): void {
  if (loaded) return;
  loaded = true;

  aliasMap = { ...deviceAliases };

  try {
    const raw = fs.readFileSync(sharedDataPath("labs", "_marker-aliases.json"), "utf-8");
    const parsed = JSON.parse(raw) as AliasFile;

    for (const m of parsed.markers ?? []) {
      if (!m.canonical) continue;
      aliasMap[m.canonical] = m.canonical;
      for (const s of m.synonyms ?? []) {
        aliasMap[s] = m.canonical;
      }
      if (m.canonical_unit) unitMap[m.canonical] = m.canonical_unit;
      if (m.risk) riskMap[m.canonical] = m.risk;
    }
    // Keep the English analyzer names canonical even when an older registry
    // still contains a synonym with a broader or legacy label.
    aliasMap = { ...aliasMap, ...deviceAliases };
  } catch {
    // The dictionary is unavailable; use the analyzer-abbreviation layer.
    // Units cannot be checked in this case, so trends are marked as unverified.
  }
}

export function resolveAlias(name: string): string {
  load();
  return aliasMap[name] ?? name;
}

/** Canonical marker unit; undefined when the marker is absent from the dictionary. */
export function getCanonicalUnit(canonicalName: string): string | undefined {
  load();
  return unitMap[canonicalName];
}

/** Risk of unit confusion: high / medium / low. */
export function getUnitRisk(canonicalName: string): string | undefined {
  load();
  return riskMap[canonicalName];
}

/**
 * Whether a point's unit differs from the canonical unit.
 * If the marker is absent from the dictionary or has no unit, treat it as matching
 * so the chart is not filled with false warnings.
 */
export function isUnitMismatch(
  canonicalName: string,
  unit: string | undefined,
  canonicalUnit?: string
): boolean {
  const expected = canonicalUnit ?? getCanonicalUnit(canonicalName);
  if (!expected || !unit) return false;
  return normalizeUnit(unit) !== normalizeUnit(expected);
}

/** Normalize unit spellings: "10^9/L", "x10^9/L", and "×10⁹/L" are equivalent. */
function normalizeUnit(u: string): string {
  return u
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[×x]/g, "x")
    .replace(/⁹/g, "9")
    .replace(/¹²/g, "12")
    .replace(/\^/g, "")
    .replace(/\.$/, "");
}

export function getAliasMap(): Record<string, string> {
  load();
  return { ...aliasMap };
}
