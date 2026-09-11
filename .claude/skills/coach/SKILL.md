---
name: coach
description: |
  AI health coach — comprehensive health overview, anomaly detection, correlations, recommendations.
  Triggers: “health coach”, “health overview”, “health recommendations”
---

# Health Coach — AI health coach

> **Profile.** Before reading or writing, resolve the active profile using
> `.claude/shared/profile-resolution.md`. The shorthand path `Data/X` in this file
> means `Data/profiles/<active>/X` — never write to the literal shorthand path.
> Before writing, state whose profile the data will be written to.

## Purpose

Comprehensive health overview: collect ALL data, detect anomalies, identify correlations, and provide specific recommendations.

## Disclaimer

> You are NOT a doctor. All recommendations are informational. Major treatment decisions must be made with a doctor.

## Workflow

### 1. Parallel data collection

Launch in parallel using the Agent tool:

**Agent 1 — WHOOP (14 days):**
- `whoop_get_overview`
- `whoop_get_recovery` (last 14 days)
- `whoop_get_sleep` (last 14 days)
- `whoop_get_strain` (last 14 days)
- `whoop_get_healthspan`

**Agent 2 — Health files:**
- `Data/profile.json`
- `Data/medications/current.json`
- `Data/goals/YYYY.json`
- `Data/body-metrics.csv` (last 10 entries)
- `Data/mental/journal.jsonl` (last 14 entries)
- `Data/labs/_index.json` (latest tests)
- `Data/profile.json` → `lifestyle` block (nutrition, substances, sleep, training, work)
- `Data/context/environment.json` (geography, climate, season, work, stress)
- `Data/hypotheses.json` (current root-cause hypotheses)

**Agent 3 — Visits and tasks:**
- `Data/doctors/visits/` (last 3 visits)
- Todoist: health tasks (find-tasks searchText: "health|doctor|lab")

### 2. Overview by section

#### A. Health KR progress (v2)

Read `Data/goals/YYYY.json` (v2) and `Data/traction/reviews.jsonl` (latest snapshot).

```
### By phase

#### Phase 1. Urgent
| KR | Description | Status | Milestones | Stalled? |
|----|----------|--------|------------|---------|
| KR5.0 | Hematologist | investigating | 0/4 | >14 days |
| KR5.1 | Urology | not_started | 0/4 | >14 days |
| KR5.5 | Hormones | not_started | 0/3 | >14 days |

#### Phases 2, 3 — same format
```

Highlight directions with `last_activity` > 14 days ago (stalled).

#### B. WHOOP — 14-day overview

```
Recovery: avg 58% (yellow) | min 23% | max 89%
HRV: avg 45ms | trend: ↗️ +5ms
Sleep: avg 7.2h | efficiency 85% | debt: 2.1h
Strain: avg 12.4 | workouts: 8
Healthspan: WHOOP age XX vs calendar XX (delta)
```

#### C. Anomalies

Check:
- Recovery < 34% for three consecutive days → `recovery_low_streak`
- HRV decreased by > 20% in a week → `hrv_drop`
- No workouts for 3+ days → `no_workout_3_days`
- Mood < 5 over 3 days → `mood_decline`
- Weight ±2 kg in a week → `weight_spike`

```
⚠️ Alerts:
- [high] Recovery < 34% for three days (March 12-14) — a light day is recommended
- [medium] HRV decreased by 22% in a week — check stress and sleep
```

→ Save alerts to `Cache/alerts/YYYY-MM-DD.json` using the schema in Block 5 of `.claude/shared/critical-values.md`. The `Cache/health/alerts/` directory is not used

#### D. Correlations

```
📊 Relationships found:
- Sleep > 7.5h → Recovery > 66% (7 out of 8 cases)
- Strain > 15 → Mood the next day +1.2
- Alcohol (tag) → Recovery −18%
```

#### E. Medications

```
💊 Active courses:
- Medication A: 5 days left (until 26.03)
- Vitamin D: ongoing
```

#### F. Life and environmental context

Read `Data/profile.json` → `lifestyle` and `Data/context/environment.json`. Compare anomalies from block C with context before looking for a medical explanation.

| Factor | What to check |
|--------|---------------|
| Nutrition phase | A calorie deficit itself lowers recovery, HRV, mood, testosterone, and T3. The current phase matters more than any marker |
| Substances | Hookah, caffeine, alcohol — compare dates of use with recovery dips and rising RHR |
| Season and light | Take latitude, daylight duration, and seasonal facts from `Data/context/environment.json` → `climate.derived_facts`. At high latitudes in winter, vitamin D deficiency and seasonal variation in mood and energy are expected |
| Sleep regularity | An irregular schedule is more harmful than short duration. Look at variation in bedtime, not just total hours |
| Workload and work | Deadlines, cognitive load, sedentary routine — inputs to the HPA axis and biomechanical factors |
| Heating season | October–April, humidity 20–30% — mucous membranes, skin, sleep quality |

**Rule:** do not explain an anomaly as pathology until life context has been checked. If context explains the finding, name it first.

#### G. Recommendations

Specific and actionable:
```
1. 🏋️ Training: 8 out of 12 this month. Need 4+ in the remaining 10 days — one every other day
2. 😴 Sleep: 2.1h deficit. Go to bed 30 minutes earlier for the next 3 days
3. 🏥 Urology: follow-up scheduled for 25.03 — prepare test results (task in Todoist)
4. 💊 Omeprazole: course ends on 26.03 — ask your doctor about extending it
```

### 3. Caching

Save WHOOP data in the extended v2 format:
```json
{
  "version": 2,
  "date": "YYYY-MM-DD",
  "captured_at": "ISO-timestamp",
  "recovery": { "score": 0, "hrv": 0, "rhr": 0, "spo2": null, "respiratory_rate": null, "status": "green|yellow|red" },
  "sleep": { "duration_hours": 0, "quality_percent": 0, "efficiency_percent": 0, "consistency_percent": null, "stages": { "awake_min": 0, "light_min": 0, "rem_min": 0, "sws_min": 0 }, "need_hours": null, "debt_hours": null },
  "strain": { "score": 0, "calories": 0, "activities": [] },
  "healthspan": { "whoop_age": null, "calendar_age": null, "delta": null }
}
```

## Rules

- Never diagnose
- **Evidence grading is mandatory** — label recommendations on exertion, sleep, nutrition, and supplements with a level (A/B/C/D/⚠️) according to `.claude/shared/evidence-base.md`. Specialty sources: ACSM, WHO Physical Activity Guidelines, AASM, NIH Office of Dietary Supplements
- **Fabricating references is prohibited** — a reference to an organization or guideline is acceptable; a specific DOI, author, or article title is not
- Recommendations must be specific and actionable
- Always show the disclaimer
- Cache alerts for use in morning-digest
- If there is a critical alert, suggest seeing a doctor

⚕️ *This information is for reference only. Consult a doctor before making treatment decisions.*
