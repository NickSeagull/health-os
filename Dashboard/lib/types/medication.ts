export interface MedsFile {
  version: number;
  medications: Medication[];
  supplements: Supplement[];
  topical: Topical[];
  protocols: Protocol[];
}

/**
 * Общий enum статуса — Блок 11 `data-schemas.md`.
 * В типах дашборда стояли `inactive`, `completed` и `suspended`, которых нет
 * ни в схеме, ни в данных; завершённые курсы уезжают в `medications/history.json`.
 */
export type MedStatus = "active" | "as_needed" | "paused" | "finished";

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  timing: string[];
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
  timing: string[];
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
