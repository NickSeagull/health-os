export interface VisitIndex {
  version: number;
  generated: string;
  total: number;
  visits: VisitIndexEntry[];
}

export interface VisitIndexEntry {
  date: string;
  file: string;
  format: "md" | "json";
  specialty: string;
  doctor: string | null;
  clinic: string;
  brief: string;
}

export interface VisitDetailJson {
  version?: number;
  date: string;
  type: string;
  specialty: string;
  doctor: string | null;
  clinic: string;
  reason: string;
  findings: string[];
  diagnosis: string[];
  prescriptions: Prescription[];
  follow_up: string | null;
  source?: string;
}

export interface Prescription {
  drug: string;
  dose: string;
  duration: string;
}

export interface VisitDetailMd {
  raw: string;
  date?: string;
  doctor?: string;
  clinic?: string;
  specialty?: string;
  title?: string;
}
