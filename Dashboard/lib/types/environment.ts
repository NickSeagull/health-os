/**
 * `Data/context/environment.json` — the patient's external life context.
 *
 * All AI specialists are required to read this file (`holistic-framework.md`,
 * Block 4), but the dashboard did not read it at all: neither the page nor the card.
 * For a complaint of chronic fatigue, climate, circadian context, and stressors
 * belong on the first screen, not the fifth.
 */
export interface EnvironmentData {
  version: number;
  updated: string;
  purpose?: string;
  location?: {
    city?: string;
    district?: string;
    street?: string;
    nearest_metro?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    since?: string | null;
    previous_locations?: { city: string; period: string; note?: string }[];
  };
  healthcare_access?: {
    insurance?: string;
    dms?: boolean;
    dms_details?: string | null;
    travel_readiness?: string | null;
    max_travel_time_min?: number | null;
    preferred_transport?: string | null;
    notes?: string | null;
  };
  climate?: {
    type?: string;
    /** Latitude and climate findings, ready-made wording for a physician. */
    derived_facts?: string[];
    seasonal_pattern_observed?: string | null;
  };
  air_and_water?: Record<string, unknown>;
  housing?: Record<string, unknown>;
  work?: {
    field?: string;
    posture?: string;
    schedule?: string | null;
    screen_hours_per_day?: number | null;
    remote_or_office?: string | null;
    cognitive_load?: string | null;
    deadline_pressure?: string | null;
    commute?: Record<string, unknown>;
    health_implications?: string[];
  };
  circadian_context?: Record<string, unknown>;
  stress_context?: {
    main_stressors?: string[] | string | null;
    financial_stress?: string | null;
    work_stress_level?: string | null;
    social_support?: Record<string, unknown>;
    life_events_recent?: string[] | string | null;
    /** Chronology anchors: year, age, and event linking symptoms to life events. */
    chronology_anchors?: {
      year: number;
      age?: number;
      event: string;
      context_at_the_time?: string | null;
      needs_clarification?: boolean;
    }[];
  };
  /** Data not yet collected, shown as a checklist. */
  _needs_input?: string[];
}
