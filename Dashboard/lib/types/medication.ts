export interface MedsFile {
  version: number;
  medications: Medication[];
  supplements: Supplement[];
  topical: Topical[];
  protocols: Protocol[];
}

/**
 * Shared status enum — Block 11 of `data-schemas.md`.
 * Dashboard types previously included `inactive`, `completed`, and `suspended`,
 * none of which exists in the schema or data; completed courses go to
 * `medications/history.json`.
 */
export type MedStatus = "active" | "as_needed" | "paused" | "finished";
export const MED_TIMINGS = ["morning", "day", "evening", "night"] as const;
export type MedTiming = (typeof MED_TIMINGS)[number];

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  timing: MedTiming[];
  with_food: boolean;
  reason: string;
  doctor_id?: string;
  started: string;
  until?: string;
  side_effects: string[];
  status: MedStatus;
  notes?: string;
}

export interface Supplement {
  id: string;
  name: string;
  brand?: string;
  dosage: string;
  frequency: string;
  timing: MedTiming[];
  reason: string;
  started: string;
  status: MedStatus;
}

export interface Topical {
  id: string;
  name: string;
  type: string;
  frequency: string;
  reason: string;
  status: MedStatus;
}

export interface Protocol {
  id: string;
  name: string;
  description: string;
  status: string;
}
