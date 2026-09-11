# Health Dashboard — Spec

> Implementation is split across sessions. This file is the complete specification for starting in plan mode.

---

## Technology

- **Next.js 15** (App Router)
- **shadcn/ui + Tailwind CSS 4**
- **Recharts** (charts)
- **SWR** (data fetching)
- **csv-parse** (CSV parsing)
- **date-fns** (dates)
- **gray-matter** (Markdown frontmatter)
- **TypeScript strict**

---

## Architecture

```
[Data/ files] ──fs.readFile──▶ [lib/data/*.ts] ──▶ [app/api/*/route.ts] ──JSON──▶ [Client + Recharts/shadcn]
```

- API routes read `../Data/` through Node.js `fs`
- The client uses SWR for data fetching
- Caching: no cache in development, `revalidate: 60` in production
- Read-only: the dashboard does not mutate data

---

## Project Structure

```
dashboard/
├── app/
│   ├── layout.tsx              ← Sidebar + header + disclaimer
│   ├── page.tsx                ← Dashboard overview
│   ├── labs/page.tsx           ← Lab marker trends
│   ├── body/page.tsx           ← Weight/BMI/BP charts
│   ├── visits/page.tsx         ← Visit timeline
│   ├── meds/page.tsx           ← Medication schedule grid
│   ├── dental/page.tsx         ← SVG tooth map (ISO 3950)
│   ├── mental/page.tsx         ← Mood/energy/stress charts
│   ├── goals/page.tsx          ← KR progress tracker by phases
│   ├── whoop/page.tsx          ← Recovery, HRV, Sleep
│   └── api/
│       ├── labs/route.ts
│       ├── labs/markers/route.ts  ← GET ?name=Hemoglobin → [{date, value, status, ref_min, ref_max}]
│       ├── body-metrics/route.ts
│       ├── visits/route.ts
│       ├── meds/route.ts
│       ├── dental/route.ts
│       ├── mental/route.ts
│       ├── goals/route.ts
│       ├── profile/route.ts
│       ├── alerts/route.ts
│       └── whoop/route.ts
├── lib/
│   ├── data/                   ← fs-based data readers
│   │   ├── labs.ts             ← _index.json + lazy individual files + marker aggregation
│   │   ├── body-metrics.ts     ← CSV parser (csv-parse/sync)
│   │   ├── visits.ts           ← Dual parser (JSON + MD via gray-matter)
│   │   ├── profile.ts
│   │   ├── goals.ts
│   │   ├── meds.ts
│   │   ├── dental.ts
│   │   ├── mental.ts           ← JSONL reader
│   │   ├── alerts.ts
│   │   └── history.ts
│   ├── types/                  ← TypeScript interfaces
│   │   ├── lab.ts
│   │   ├── visit.ts
│   │   ├── body-metric.ts
│   │   ├── goal.ts             ← HealthDirection (v2), Milestone, Phase
│   │   ├── medication.ts
│   │   ├── dental.ts
│   │   ├── mood.ts
│   │   └── profile.ts
│   ├── utils.ts
│   └── whoop.ts
├── components/
│   ├── ui/                     ← shadcn/ui primitives
│   ├── layout/                 ← sidebar, header, nav
│   ├── dashboard/              ← overview cards, alerts
│   ├── labs/                   ← marker chart, selector, table
│   ├── body/                   ← weight/bp/bmi charts
│   ├── visits/                 ← timeline, visit card
│   ├── meds/                   ← schedule grid
│   ├── dental/                 ← tooth map SVG
│   ├── mental/                 ← mood charts
│   └── goals/                  ← KR tracker, phase progress
└── public/
    └── tooth-diagram.svg
```

---

## Pages (9 views)

### 1. Dashboard (`/`)

- 4 summary cards: weight/BMI, age, active KR count, active medication count
- Active threads table (from goals v2 — directions with `status != resolved`)
- Recent 5 labs with flag badges
- Alerts panel (from `Cache/alerts/`)

### 2. Labs (`/labs`)

- Combobox for selecting a marker
- LineChart with reference zones (green zone between `ref_min` and `ref_max`)
- Points colored green/red by status
- Alias mapping for inconsistent marker names (for example, “Hemoglobin” vs “Hemoglobin (Hb)” vs “HGB”)
- Canonical marker labels exposed by the UI: Hemoglobin, White blood cells, Platelets, ESR, Glucose, Creatinine, ALT, AST, Total cholesterol, LDL, HDL, Triglycerides, TSH, Free T4, Total testosterone, Cortisol, Vitamin D, Vitamin B12, Ferritin, Iron
- The shared marker registry must contain all 20 UI canonical labels. It is a superset of this selection and also retains other analytes. Identity-only entries do not define measurement units or conversion factors.
- Table of all lab results, sorted by date

### 3. Body (`/body`)

- Weight LineChart (3 phases: gain → loss → gain, with annotations)
- BMI AreaChart with zones (underweight / normal / overweight)
- Blood pressure dual line chart (systolic + diastolic)
- Place childhood measurements (2001–2003) in a separate “History” section

### 4. Visits (`/visits`)

- Vertical timeline, grouped by year
- Color-coded by specialty
- Click → Sheet (shadcn) with full visit details
- Dual format: JSON (20 files) + Markdown (46 files)
- For MD: regex parser for fields (`# title`, `- **Date:**`, `- **Doctor:**`, `- **Specialty:**`, `- **Clinic:**`)
- Data source: `Data/doctors/visits/_index.json` for fast access

### 5. Meds (`/meds`)

- Grid: morning / day / evening / night × medications
- Separate sections: medications, supplements, topical
- Status badges (`active`, `as_needed`, `completed`)

### 6. Dental (`/dental`)

- SVG diagram of 32 teeth (quadrants 1–4, ISO 3950)
- Color by status: healthy (white), treated (blue), missing (gray), needs_treatment (red)
- Hover → tooltip with notes
- Data source: `Data/dental/tooth-map.json`

### 7. Mental (`/mental`)

- 4 lines: mood, energy, stress, sleep_quality (1–10 scale)
- Data source: `Data/mental/journal.jsonl`
- Date range selector

### 8. Goals (`/goals`)

- Progress tracker organized by phase (Phase 1/2/3)
- Milestone checklist for each health area
- Cost summary table (estimate vs actual)
- Colored status badges

### 9. WHOOP (`/whoop`)

- Recovery %, HRV, RHR line charts
- Sleep performance, strain
- Data source: `Cache/whoop/` (overridden by `HEALTH_OS_WHOOP_DIR`) or WHOOP MCP

---

## TypeScript Types

### Goal types (matching v2 schema)

```typescript
interface Phase {
  id: string;
  name: string;
  period: string;
  priority: 'high' | 'medium' | 'normal';
  directions: string[];
}

interface Milestone {
  id: string;
  title: string;
  type: 'visit' | 'lab' | 'procedure' | 'action' | 'treatment' | 'metric';
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  deadline: string | null;
  oms_available: boolean | null;
  cost_estimate_rub: number | null;
  cost_actual_rub: number | null;
  todoist_task_id: string | null;
  depends_on: string[];
  notes: string | null;
}

interface HealthDirection {
  area: string;
  kr: string;
  phase: string;
  status: string;
  goal: string;
  last_activity: string | null;
  cost_estimate_rub: number;
  cost_actual_rub: number;
  milestones: Milestone[];
  related_visits: string[];
  related_labs: string[];
}

interface GoalsFile {
  version: 2;
  okr_ref: string;
  phases: Phase[];
  directions: HealthDirection[];
  fitness_target: FitnessTarget;
  cost_summary: CostSummary;
}
```

### Lab types

```typescript
interface LabMarker {
  name: string;
  value: number;
  unit: string;
  reference_min: number | null;
  reference_max: number | null;
  status: 'normal' | 'low' | 'high' | 'critical';
  flag: string | null;
}

interface LabResult {
  date: string;
  type: string;
  laboratory: string;
  file: string;
  markers_count?: number;
  flags?: string[];
}
```

### Visit types

```typescript
interface VisitIndex {
  date: string;
  file: string;
  format: 'json' | 'md';
  specialty: string;
  doctor: string | null;
  clinic: string | null;
  brief: string;
}
```

---

## Known Complexities

1. **Marker name aliases** — inconsistent naming across labs. Solution: alias mapping in `lib/data/labs.ts`
2. **Two visit formats** — JSON (20) + Markdown (46). The API detects the format from the file extension
3. **Sparse body metrics** — 14 points over 24 years. Childhood measurements (2001–2003) go in a separate section
4. **WHOOP** — MCP server (npx), without an HTTP API. Solution: read the cache from `Cache/whoop/`

---

## Implementation Sessions

| Session | Scope | Est. Time |
|---------|-------|-----------|
| S1 | Scaffold: create-next-app, shadcn init, layout, sidebar, types, profile API | ~1–2h |
| S2 | Dashboard + Labs: _index reader, marker aggregation, LineChart with ref zones | ~2–3h |
| S3 | Body + Visits + Meds: CSV parser, dual visit parser, timeline, schedule grid | ~2h |
| S4 | Dental + Mental + Goals: SVG tooth map, JSONL reader, phase tracker | ~1–2h |
| S5 | WHOOP + Alerts + Polish: WHOOP proxy, alerts, responsive, dark mode | optional |

---

## Data Paths

All paths are relative to the project root (`health-os/`):

| Data | Path |
|--------|------|
| Profile | `Data/profile.json` |
| Goals | `Data/goals/2026.json` (v2) |
| Labs index | `Data/labs/_index.json` |
| Lab files | `Data/labs/*.json` |
| Visits index | `Data/doctors/visits/_index.json` |
| Visit files | `Data/doctors/visits/*.{json,md}` |
| Body metrics | `Data/body-metrics.csv` |
| Medications | `Data/medications/current.json` |
| Dental | `Data/dental/tooth-map.json` |
| Mental | `Data/mental/journal.jsonl` |
| Traction | `Data/traction/reviews.jsonl` |
| Costs | `Data/costs/2026.jsonl` |
| Alerts | `Cache/alerts/*.json` |
| WHOOP cache | `../Cache/whoop/*.json` |

---

## Health Disclaimer

Every page must display:

> ⚕️ This information is for reference only. Consult a doctor for treatment decisions.
