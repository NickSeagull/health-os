export interface LabIndex {
  version: number;
  analyses: LabIndexEntry[];
}

export interface LabIndexEntry {
  date: string;
  file: string;
  type: string;
  lab: string;
  markers_count: number;
  flags?: string[];
}

/**
 * В Data/labs/ сосуществуют ТРИ поколения схемы:
 *   v1 — плоский `markers[]` в корне (большинство файлов)
 *   v2 — `panels[].markers[]` (партия 2026-03-15)
 *   v3 — `studies[].markers[]` (урологические файлы 2022)
 * Читать нужно все три: игнорирование v2 и v3 скрывало 28% маркеров.
 * Для сбора использовать collectMarkers() из lib/data/labs.ts.
 */
export interface LabFileData {
  version: number;
  date: string;
  /** Имя лаборатории: в v1/v3 поле называется `lab`, в v2 — `laboratory` */
  lab?: string;
  laboratory?: string;
  type: string;
  subtype?: string;
  source?: string;
  scanned_date?: string;
  original_file?: string;
  original_files?: string[];
  archive_path?: string;
  /** Дата готовности результата (v2) */
  analysis_date?: string;
  /** То же в v3 */
  result_date?: string;
  order_number?: string;
  /** База — `Data/labs/`, то есть `pdfs/x.pdf` → `Data/labs/pdfs/x.pdf` */
  pdf_path?: string | null;
  markers?: LabMarker[];
  panels?: LabPanel[];
  studies?: LabStudy[];
  summary?: string | LabSummaryCounts | null;
  deviations?: string[];
  recommendations?: string[];
  notes?: string;
}

/** Заголовок панели лежит в `name` — так во всех четырёх файлах v2 на диске */
export interface LabPanel {
  name?: string | null;
  markers?: LabMarker[];
}

export interface LabStudy {
  name?: string | null;
  material?: string;
  doctor?: string;
  markers?: LabMarker[];
}

/** В части файлов summary — объект со счётчиками, в части — связный текст */
export interface LabSummaryCounts {
  total?: number;
  normal?: number;
  low?: number;
  high?: number;
  critical?: number;
}

/**
 * Enum статусов — Блок 1 `data-schemas.md`. Прежде в union входили
 * `positive`, `negative` и `borderline`, которых нет ни в одном из 471 маркера
 * на диске и нет в каноническом перечне: тип разрешал писать несуществующие статусы.
 */
export type MarkerStatus =
  | "normal"
  | "low"
  | "high"
  | "critical"
  | "variant"
  | "detected"
  | "deviation";

export interface LabMarker {
  name: string;
  value: number | string;
  /** Не опускается даже при безразмерном результате — тогда `""` */
  unit: string;
  /** Вместо `value`, когда и результат, и референс словесные */
  value_text?: string;
  reference_min?: number | null;
  reference_max?: number | null;
  /** Словесный референс: «Не обнаружено» */
  reference_text?: string;
  reference_range?: string;
  status: MarkerStatus;
  /** В v2 всегда null; новых значений не вводить */
  flag?: null;
  note?: string;
  interpretation?: string;
}

export interface MarkerTrendPoint {
  date: string;
  value: number;
  unit: string;
  status: string;
  /** `null` при одностороннем референсе — так лежит в данных */
  reference_min?: number | null;
  reference_max?: number | null;
  lab: string;
  /** true, если единица отличается от канонической и точка несопоставима напрямую */
  unitMismatch?: boolean;
}

export interface InBodyData {
  version: number;
  date: string;
  type: "body_composition";
  device: string;
  device_id: string;
  subject: {
    height_cm: number;
    age: number;
    sex: string;
  };
  composition: {
    total_body_water_l: number;
    protein_kg: number;
    minerals_kg: number;
    body_fat_mass_kg: number;
    weight_kg: number;
  };
  metrics: {
    skeletal_muscle_mass_kg: number;
    bmi: number;
    body_fat_pct: number;
    inbody_score: number;
    visceral_fat_level: number;
    waist_hip_ratio: number;
    basal_metabolic_rate_kcal: number;
    fat_free_mass_kg: number;
    degree_of_obesity_pct: number;
    icm_kg_m2: number;
  };
  weight_control: {
    ideal_weight_kg: number;
    fat_control_kg: number;
    muscle_control_kg: number;
  };
  segmental_lean_mass: SegmentalData;
  segmental_fat_mass: SegmentalData;
  recommended_calories_kcal: number;
  notes?: string;
}

export interface SegmentalData {
  right_arm_kg: number;
  right_arm_pct: number;
  left_arm_kg: number;
  left_arm_pct: number;
  trunk_kg: number;
  trunk_pct: number;
  right_leg_kg: number;
  right_leg_pct: number;
  left_leg_kg: number;
  left_leg_pct: number;
}
