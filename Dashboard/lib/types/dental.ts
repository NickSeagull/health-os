export type ToothStatus =
  | "healthy"
  | "filled"
  | "crowned"
  | "extracted"
  | "implant"
  | "needs_treatment"
  | "root_canal";

export interface Tooth {
  status: ToothStatus;
  notes: string;
}

export interface ToothMap {
  version: number;
  dentist_id: string;
  next_visit: string | null;
  teeth: Record<string, Tooth>;
  summary: {
    total: number;
    healthy: number;
    filled: number;
    crowned: number;
    implant: number;
    extracted: number;
    needs_treatment: number;
    root_canal: number;
  };
  imaging: DentalImaging[];
  notes: string;
}

export interface DentalImaging {
  type: string;
  date: string;
  format: string;
  files: number;
  size_mb: number;
  location: string;
  viewer: string;
  notes: string;
}

export interface DentalProcedure {
  date: string | null;
  teeth: string[];
  type: string;
  description: string;
  doctor_id: string | null;
  notes: string;
}

export interface DentalProceduresFile {
  version: number;
  procedures: DentalProcedure[];
}
