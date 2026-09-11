---
name: traction
description: |
  Periodic review of progress in all areas of health. Traction plan with statuses and next actions.
  Triggers: “treatment progress”, “traction”, “health status”, “health status”
---

# Health Traction - Progress Review (v2)

> **Profile.** Before reading and writing, determine the active profile by
>`.claude/shared/profile-resolution.md`. Short path `Data/X` in this file
> means `Data/profiles/<active>/X` — never write to the literal shorthand path.
> Before recording, tell whose profile it goes to.

## Purpose

Regular review of progress in all areas of health with persistence. Run once a week/month or upon request. Each review is saved as a snapshot.

## User request

$ARGUMENTS

## Workflow

### 1. Data collection (in parallel)

Read via Read tool:
- `Data/goals/YYYY.json` (v2) - directions, phases, milestones
- `Data/traction/reviews.jsonl` — previous snapshots
- `Data/costs/YYYY.jsonl` - expenses
- `Data/doctors/visits/_index.json` - last visits
- `Data/labs/_index.json` - latest tests
- `Data/medications/current.json` - active courses
- `Data/body-metrics.csv` - body metrics

### 2. Diff with previous review

If `reviews.jsonl` is not empty, load the latest snapshot and show diff:

```
### What has changed since the last review (YYYY-MM-DD)

| Direction | Was | Became | Δ milestones |
|-------------|------|-------|-------------|
| KR5.4 Dentistry | in_progress (1/6) | in_progress (2/6) | +1 ✅ |
| KR5.0 Hematologist | investigating (0/4) | in_progress (1/4) | +1 ✅ |

New expenses for the period: 7,000 ₽
```

### 3. Traction table by phases

```
## Phase 1. Urgent (March–April)

| KR | Direction | Status | Milestones | Latest | Next | Deadline | 💰 |
|----|-------------|--------|------------|-----------|-----------|---------|-----|
| 5.0 | Hematologist | 🟡 | 0/4 | — | Direction | 01.04 | 0/5k |
| 5.1 | Urology | 🔴 | 0/4 | 02.2024 | Sign up | 01.04 | 0/8k |
| 5.5 | Hormones | 🔴 | 0/3 | 08.2024 | Tests | 01.04 | 0/10k |

## Phase 2. Planned...
## Phase 3. Support...
```

### 4. Overdue milestones

```
⚠️Overdue:
- KR5.0_m1: Referral from a general practitioner - deadline 01.04, X days have passed
- KR5.1_m1: Book a urology appointment - deadline 01.04

Suggest: move the deadline? Create a task in Todoist?
```

### 5. Stagnant directions

If `last_activity` > 14 days and status is not monitoring/resolved:
```
🔻 Stagnation (>2 weeks without activity):
- KR5.10 Orthopedics - the last activity: 2010-06-10 (!)
- KR5.11 Mental - no activity
```

### 6. Medicines - course status

If there are active courses with `until`:
```
💊 Courses:
| Drug | Remaining | Dosage | Doctor |
|----------|----------|-----------|------|
```

Ongoing medications: [list]

### 7. Cost Summary

From `Data/costs/YYYY.jsonl`:
```
💰 Expenses for the period / for all time:
| Period | OMS | Privately | Total |
|--------|-----|--------|-------|
| This week | 0 | 5,000 | 5,000 |
| Total 2026 | 0 | 12,000 | 12,000 |

By directions: KR5.4 - 7,000, KR5.2 - 5,000
```

### 8. Recommendations

Based on the collected data:
- What to do first (by phase and priority)
- What milestones can be closed
- What deadlines are approaching?

### 9. Saving snapshot

After review → append to `Data/traction/reviews.jsonl`:

```jsonl
{"ts":"2026-03-14T...","type":"weekly","period":"2026-W11","directions_summary":[{"kr":"KR5.0","status":"investigating","milestones_done":0,"milestones_total":4, "last_activity":"2025-04-02","cost_actual":0}],"fitness":{"workouts_this_month":0,"target":12},"cost_this_period_rub":0,"cost_total_rub":0,"highlights":["Created v2 target model"],"blockers":["No entry for hematologist"]}
```

### 10. Data update

After discussion with the user:
- Update `Data/goals/YYYY.json` - statuses, milestones
- Create tasks in Todoist (if agreed)
- Create events in Google Calendar (if there are dates)
- Regenerate `Goals/health-goals.md` from `Data/goals/YYYY.json`

### 11. Recurring task

When you first start, suggest:
- Create a recurring task in Todoist: “Traction health review” (every Sunday)

## Integration with WHOOP

If WHOOP is available:
- Pull up data for the last week
- Show: avg recovery, workouts, sleep quality
- Progress on KR5.6 (12+ workouts/month)

## Rules

- Show FACTS, not speculation
- If there is no data - “no data”, do not invent
- Always save snapshot after review
- Cost: two ways (OMS / private)
- Disclaimer: “Recommendations are for informational purposes”

⚕️ *Information is for reference only. Consult your physician for treatment decisions.*
