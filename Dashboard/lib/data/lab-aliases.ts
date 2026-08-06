import fs from "fs";
import { sharedDataPath } from "./paths";

/**
 * Канонические имена маркеров и единицы измерения.
 *
 * Источник истины — `Data/labs/_marker-aliases.json`. Прежде здесь лежал хардкод
 * БЕЗ информации о единицах, из-за чего тренд по маркеру, приходящему из разных
 * лабораторий в разных единицах, давал числовую бессмыслицу: например
 * тестостерон 17.33 нмоль/л → 6.5 нг/мл выглядел как обвал втрое, хотя это рост.
 *
 * Английские сокращения из аппаратных выгрузок словарём не покрываются —
 * для них оставлен дополнительный слой ниже.
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

/** Английские сокращения приборов — их нет в каноническом словаре */
const deviceAliases: Record<string, string> = {
  HGB: "Гемоглобин",
  Hb: "Гемоглобин",
  Hemoglobin: "Гемоглобин",
  "Гемоглобин (HGB)": "Гемоглобин",
  WBC: "Лейкоциты",
  RBC: "Эритроциты",
  PLT: "Тромбоциты",
  HCT: "Гематокрит",
  "Гематокрит (HCT)": "Гематокрит",
  ESR: "СОЭ",
  Glucose: "Глюкоза",
  "Глюкоза (венозная)": "Глюкоза",
  "Глюкоза венозная": "Глюкоза",
  Creatinine: "Креатинин",
  Urea: "Мочевина",
  "Uric acid": "Мочевая кислота",
  ALT: "АЛТ",
  AST: "АСТ",
  GGT: "ГГТ",
  ALP: "Щелочная фосфатаза",
  "Total cholesterol": "Холестерин общий",
  HDL: "ЛПВП",
  LDL: "ЛПНП",
  Triglycerides: "Триглицериды",
  TSH: "ТТГ (тиреотропный гормон)",
  "Free T3": "Т3 свободный",
  "Free T4": "Тироксин свободный (св. Т4)",
  Testosterone: "Тестостерон общий",
  Cortisol: "Кортизол",
  ACTH: "АКТГ",
  "25-OH Vitamin D": "Витамин D суммарный (25-OH D2 и D3)",
  "25(OH)D": "Витамин D суммарный (25-OH D2 и D3)",
  "Vitamin B12": "Витамин B12",
  Ferritin: "Ферритин",
  Iron: "Железо сывороточное",
  CRP: "С-реактивный белок",
  СРБ: "С-реактивный белок",
  Potassium: "Калий",
  Sodium: "Натрий",
  Calcium: "Кальций",
  GFR: "СКФ",
  eGFR: "СКФ",
  Microalbumin: "Микроальбумин",
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
  } catch {
    // Словарь недоступен — работаем на слое сокращений приборов.
    // Единицы при этом не проверяются, поэтому тренды помечаются как несверенные.
  }
}

export function resolveAlias(name: string): string {
  load();
  return aliasMap[name] ?? name;
}

/** Каноническая единица маркера. undefined, если маркера нет в словаре */
export function getCanonicalUnit(canonicalName: string): string | undefined {
  load();
  return unitMap[canonicalName];
}

/** Уровень риска путаницы единиц: high / medium / low */
export function getUnitRisk(canonicalName: string): string | undefined {
  load();
  return riskMap[canonicalName];
}

/**
 * Отличается ли единица точки от канонической.
 * Если маркера нет в словаре либо единица не указана — считаем совпадающей,
 * чтобы не засорять график ложными предупреждениями.
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

/** Приводит написания единиц к сравнимому виду: «10^9/л», «x10^9/л» и «×10⁹/л» — одно и то же */
function normalizeUnit(u: string): string {
  return u
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[х×x]/g, "x")
    .replace(/⁹/g, "9")
    .replace(/¹²/g, "12")
    .replace(/\^/g, "")
    .replace(/\.$/, "");
}

export function getAliasMap(): Record<string, string> {
  load();
  return { ...aliasMap };
}
