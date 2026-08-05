# Health Dashboard — Spec

> Реализация в отдельных сессиях. Этот файл — полный spec для входа через plan mode.

---

## Технологии

- **Next.js 15** (App Router)
- **shadcn/ui + Tailwind CSS 4**
- **Recharts** (графики)
- **SWR** (data fetching)
- **csv-parse** (CSV парсинг)
- **date-fns** (даты)
- **gray-matter** (Markdown frontmatter)
- **TypeScript strict**

---

## Архитектура

```
[Data/ files] ──fs.readFile──▶ [lib/data/*.ts] ──▶ [app/api/*/route.ts] ──JSON──▶ [Client + Recharts/shadcn]
```

- API Routes читают `../Data/` через Node.js `fs`
- Клиент — SWR для data fetching
- Кеширование: без кеша в dev, `revalidate: 60` в prod
- Только чтение — дашборд не мутирует данные

---

## Структура проекта

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
│       ├── labs/markers/route.ts  ← GET ?name=Гемоглобин → [{date, value, status, ref_min, ref_max}]
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

## Страницы (9 views)

### 1. Dashboard (`/`)

- 4 summary cards: вес/BMI, возраст, active KRs count, active meds count
- Active threads table (from goals v2 — directions with `status != resolved`)
- Recent 5 labs with flag badges
- Alerts panel (from `Cache/alerts/`)

### 2. Labs (`/labs`)

- Combobox для выбора маркера
- LineChart с зонами референсных значений (зелёная зона между `ref_min` и `ref_max`)
- Точки окрашены зелёным/красным по статусу
- Aliases mapping для inconsistent названий маркеров (например, «Гемоглобин» vs «Гемоглобин (Hb)» vs «HGB»)
- Таблица со всеми результатами анализов, сортировка по дате

### 3. Body (`/body`)

- Weight LineChart (3 фазы: gain → loss → gain, с аннотациями)
- BMI AreaChart с зонами (underweight / normal / overweight)
- Blood pressure dual line chart (systolic + diastolic)
- Exclude childhood measurements (2001–2003) в отдельную секцию «История»

### 4. Visits (`/visits`)

- Vertical timeline, группировка по годам
- Color-coded по специальности
- Click → Sheet (shadcn) с полными деталями визита
- Dual format: JSON (20 файлов) + Markdown (46 файлов)
- Для MD: regex parser для полей (`# title`, `- **Дата:**`, `- **Врач:**`)
- Data source: `Data/doctors/visits/_index.json` для быстрого доступа

### 5. Meds (`/meds`)

- Grid: morning / day / evening / night × medications
- Отдельные секции: medications, supplements, topical
- Status badges (`active`, `as_needed`, `completed`)

### 6. Dental (`/dental`)

- SVG-диаграмма 32 зубов (квадранты 1–4, ISO 3950)
- Цвет по статусу: healthy (белый), treated (синий), missing (серый), needs_treatment (красный)
- Hover → tooltip с заметками
- Data source: `Data/dental/tooth-map.json`

### 7. Mental (`/mental`)

- 4 линии: mood, energy, stress, sleep_quality (шкала 1–10)
- Data source: `Data/mental/journal.jsonl`
- Date range selector

### 8. Goals (`/goals`)

- Progress tracker организован по фазам (Phase 1/2/3)
- Milestones checklist по каждому направлению
- Cost summary table (estimate vs actual)
- Status badges с цветами

### 9. WHOOP (`/whoop`)

- Recovery %, HRV, RHR line charts
- Sleep performance, strain
- Data source: `Cache/whoop/` (переопределяется `HEALTH_OS_WHOOP_DIR`) либо WHOOP MCP

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

1. **Marker name aliases** — inconsistent naming across labs. Решение: aliases mapping в `lib/data/labs.ts`
2. **Two visit formats** — JSON (20) + Markdown (46). API определяет формат по расширению файла
3. **Sparse body metrics** — 14 точек за 24 года. Детские измерения (2001–2003) — в отдельную секцию
4. **WHOOP** — MCP-сервер (npx), без HTTP API. Решение: читать кеш из `Cache/whoop/`

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

Все пути относительно корня проекта (`health-os/`):

| Данные | Путь |
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

Каждая страница обязана отображать:

> ⚕️ Информация носит справочный характер. Для принятия решений о лечении обратитесь к врачу.
