export interface WhoopDay {
  date: string;
  recovery_score: number;
  recovery_status: "green" | "yellow" | "red";
  hrv_ms: number;
  rhr_bpm: number;
  spo2_pct?: number;
  skin_temp_c?: number;
  strain_score: number;
  calories: number;
  sleep_duration_ms: number;
  sleep_quality_pct: number;
  sleep_efficiency_pct?: number;
  activities: WhoopActivity[];
}

export interface WhoopActivity {
  title: string;
  sport_id: number;
  strain: number;
  start: string;
  end: string;
  kilojoules: number;
  avg_hr: number;
  max_hr: number;
}

export interface WhoopHomeResponse {
  metadata: {
    id: string;
    cycle_start: string;
    cycle_end?: string;
    sleep_state: string;
    day_number: number;
  };
  live_metadata?: {
    recovery: number;
    strain: number;
    sleep_ms: number;
    calories: number;
  };
  gauges: WhoopGauge[];
  pillars: Record<string, unknown>;
  activities: WhoopActivity[];
  statistics: Record<string, unknown>;
}

export interface WhoopGauge {
  title: string;
  score_display: string;
  fill: number;
}

export interface WhoopRecoveryDeepDive {
  score: number;
  status: string;
  metrics: WhoopMetric[];
}

export interface WhoopSleepDeepDive {
  performance_pct: number;
  duration_ms: number;
  efficiency_pct: number;
  contributors: WhoopMetric[];
}

export interface WhoopStrainDeepDive {
  score: number;
  activities: WhoopActivity[];
  hr_zones: { zone: number; duration_ms: number; pct: number }[];
  kilojoules: number;
}

export interface WhoopMetric {
  icon?: string;
  title: string;
  value: string;
  status?: string;
}
