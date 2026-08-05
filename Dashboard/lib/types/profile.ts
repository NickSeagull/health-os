export interface ProfileData {
  version: number;
  basic: BasicInfo;
  allergies: Allergy[];
  chronic_conditions: ChronicCondition[];
  family_history: FamilyHistoryEntry[];
  current_complaints: Complaint[];
  lifestyle: Lifestyle;
}

export interface BasicInfo {
  full_name: string;
  date_of_birth: string;
  blood_type: string;
  height_cm: number;
  birth_weight_g: number;
  birth_height_cm: number;
  birth_head_cm: number;
  birth_place: string;
  birth_type: string;
  emergency_contact: {
    name: string;
    phone: string;
    relation: string;
  };
}

export interface Allergy {
  allergen: string;
  type: string;
  severity: "mild" | "moderate" | "severe";
  reaction: string;
  notes: string;
}

export interface ChronicCondition {
  condition: string;
  since: string;
  status: "active" | "investigating" | "confirmed" | "stable" | "resolved";
  notes: string;
}

export interface FamilyHistoryEntry {
  relative: string;
  name: string;
  age_at_birth: number;
  condition: string;
  notes: string;
}

export interface Complaint {
  area: string;
  description: string;
  since: string;
  status: "investigating" | "in_treatment" | "resolved";
  priority: "high" | "medium" | "low";
  notes: string;
}

/**
 * Типы выведены из фактического `Data/profile.json`, а не из ожиданий.
 *
 * Четыре поля были описаны неверно, и React молча съедал значения:
 * `smoking.cigarettes` там `false`, а не строка — на экране было «Сигареты: »;
 * `nutrition.tracking` там `true` — на экране «дефицит (сушка) · true»;
 * `sleep.duration_hours` там «7-8 (стабильно)» — «(7-8 (стабильно)ч)»;
 * `nutrition.history` там строка, а не массив. `safeReadJson<T>` — это каст без
 * валидации, поэтому tsc не видел ни одного из четырёх расхождений.
 */
export interface Lifestyle {
  exercise: {
    type: string;
    frequency: string;
    notes: string;
  };
  smoking: {
    cigarettes: boolean | string;
    hookah: boolean | string;
    notes: string;
  };
  alcohol: string;
  sleep: {
    target_bedtime: string;
    target_wakeup: string;
    duration_hours: number | string;
    notes: string;
  };
  nutrition: {
    tracking: boolean | string;
    current_phase: string;
    history: string | string[];
    standard_meal: string;
    notes: string;
  };
  work: string;
  /** Блоки, добавленные позже онбординга. Все четыре пока с `null` внутри */
  caffeine?: CaffeineBlock;
  hydration?: HydrationBlock;
  screen_and_light?: ScreenLightBlock;
  sleep_regularity?: SleepRegularityBlock;
  /** Список того, что не заполнено — служебное поле профиля */
  _needs_input?: string[];
}

export interface CaffeineBlock {
  coffee_cups_per_day: number | null;
  energy_drinks: string | null;
  tea: string | null;
  last_intake_time: string | null;
  notes?: string;
}

export interface HydrationBlock {
  water_liters_per_day: number | null;
  notes?: string;
}

export interface ScreenLightBlock {
  screen_hours_per_day: number | null;
  evening_screen_cutoff: string | null;
  morning_daylight_minutes: number | null;
  notes?: string;
}

export interface SleepRegularityBlock {
  actual_bedtime_weekday: string | null;
  actual_bedtime_weekend: string | null;
  variability_notes?: string;
}
