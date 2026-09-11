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
 * Data/labs/ contains THREE schema generations:
 *   v1 — flat root `markers[]` (most files)
 *   v2 — `panels[].markers[]` (the 2026-03-15 batch)
 *   v3 — `studies[].markers[]` (the 2022 urology files)
 * Read all three: ignoring v2 and v3 hid 28% of the markers.
 * Use collectMarkers() from lib/data/labs.ts to collect them.
 */
export interface LabFileData {
  version: number;
  date: string;
  /** Laboratory name: `lab` in v1/v3 and `laboratory` in v2. */
  lab?: string;
  laboratory?: string;
  type: string;
  subtype?: string;
  source?: string;
  scanned_date?: string;
  original_file?: string;
  original_files?: string[];
  archive_path?: string;
  /** Date the result became available (v2). */
  analysis_date?: string;
  /** Same meaning in v3. */
  result_date?: string;
  order_number?: string;
  /** Base is `Data/labs/`: `pdfs/x.pdf` → `Data/labs/pdfs/x.pdf`. */
  pdf_path?: string | null;
  markers?: LabMarker[];
  panels?: LabPanel[];
  studies?: LabStudy[];
  summary?: string | LabSummaryCounts | null;
  deviations?: string[];
  recommendations?: string[];
  notes?: string;
}

/** Panel title is stored in `name`, as in all four v2 files on disk. */
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

/** In some files summary is a counter object; in others it is prose. */
export interface LabSummaryCounts {
  total?: number;
  normal?: number;
  low?: number;
  high?: number;
  critical?: number;
}

/**
 * Status enum — Block 1 of `data-schemas.md`. The union previously included
 * `positive`, `negative`, and `borderline`, none of which appears in the 471 markers
 * on disk or in the canonical list; the type allowed nonexistent statuses to be written.
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
  /** Included even for a unitless result, in which case it is `""`. */
  unit: string;
  /** Used instead of `value` when both the result and reference are textual. */
  value_text?: string;
  reference_min?: number | null;
  reference_max?: number | null;
  /** Textual reference, such as "Not detected". */
  reference_text?: string;
  reference_range?: string;
  status: MarkerStatus;
  /** Always null in v2; do not introduce new values. */
  flag?: null;
  note?: string;
  interpretation?: string;
}

export interface MarkerTrendPoint {
  date: string;
  value: number;
  unit: string;
  status: string;
  /** `null` for a one-sided reference, as stored in the data. */
  reference_min?: number | null;
  reference_max?: number | null;
  lab: string;
  /** true when the unit differs from canonical and the point is not directly comparable. */
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
