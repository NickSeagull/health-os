/**
 * `Data/context/environment.json` — внешний контекст жизни пациента.
 *
 * Файл объявлен обязательным к прочтению всеми AI-специалистами
 * (`holistic-framework.md`, Блок 4), но дашборд не читал его вообще: ни страницы,
 * ни карточки. При жалобе на хроническую усталость климат, циркадный контекст
 * и стрессоры — первый экран, а не пятый.
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
    /** Выводы, следующие из широты и климата, — готовые формулировки для врача */
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
    /** Якоря хронологии: год, возраст и событие — привязка симптомов к жизни */
    chronology_anchors?: {
      year: number;
      age?: number;
      event: string;
      context_at_the_time?: string | null;
      needs_clarification?: boolean;
    }[];
  };
  /** Что ещё не собрано — показывается как чеклист */
  _needs_input?: string[];
}
