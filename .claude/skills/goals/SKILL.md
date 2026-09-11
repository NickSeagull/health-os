---
name: goals
description: |
  Progress on OKR O5 (health), automatically updated from WHOOP/labs/visits.
  Triggers: “health goals”, “health KR”, “health progress”
---

# Health Goals — goals and progress (v2)

> **Profile.** Before reading or writing, resolve the active profile using
> `.claude/shared/profile-resolution.md`. The shorthand path `Data/X` in this file
> means `Data/profiles/<active>/X` — never write to the literal shorthand path.
> Before writing, state whose profile the data will be written to.

## Purpose

Track progress on OKR O5 “Resolve health issues”. Work with phases, milestones, and costs. Automatically update from WHOOP, test, and visit data.

## User request

$ARGUMENTS

## Workflow

### View progress

1. Read `Data/goals/YYYY.json` (v2 — with phases[], milestones[])
2. Read `Goals/health-goals.md`
3. For KR5.6 (fitness), retrieve WHOOP data for the current month

Show overview by phase:

```
## OKR O5. Resolve health issues

### Phase 1. Urgent (March–April)
| KR | Direction | Status | Progress | Next milestone | Deadline |
|----|-------------|--------|----------|---------------------|---------|
| 5.0 | Hematology | 🟡 investigating | ░░░░ 0/4 | Primary care referral | 01.04 |
| 5.1 | Urology | 🔴 not_started | ░░░░ 0/4 | Book an appointment | 01.04 |
| 5.5 | Hormones | 🔴 not_started | ░░░ 0/3 | Get the panel tested | 01.04 |

### Phase 2. Planned (April–June)
...

### Phase 3. Maintenance (Q3)
...

Overall O5 progress: ░░░░░░░░░░ 0/41 milestones
💰 Costs: 0 / ~159,000 ₽ (estimate)
```

### Detailed direction view

On “details KR5.X”:
1. Show ALL milestones for the direction:
```
### KR5.4. Dentistry — in_progress

| # | Milestone | Type | Status | Deadline | OMS | Cost |
|---|-----------|-----|--------|---------|-----|-----------|
| 1 | Cleaning | procedure | ⬜ | 15.04 | ❌ | ~5,000 |
| 2 | Treatment plan | visit | ⬜ | 30.04 | ❌ | ~2,000 |
| 3 | Caries treatment | procedure | ⬜ | 31.05 | ❌ | ~15,000 |
| 4 | Crown | procedure | ⬜ | 30.06 | ❌ | ~20,000 |
| 5 | Implant consultation | visit | ⬜ | 30.06 | ❌ | ~2,000 |
| 6 | Bridge/implant | procedure | ⬜ | 30.09 | ❌ | ~35,000 |

Dependencies: 2→1, 3→2, 4→3, 5→3, 6→5
Estimate: ~79,000 ₽ | Actual: 0 ₽
Related visits: none
Related tests: none
```

2. Show related visits and tests from `related_visits[]` / `related_labs[]`

### Update a milestone

When requested or after a visit/test:
1. Ask which milestone to update
2. Update `Data/goals/YYYY.json`:
   - `milestones[].status` → `completed` / `in_progress` / `skipped`
   - `directions[].last_activity` → the current date
   - `directions[].cost_actual_rub` — recalculate from milestones
   - `cost_summary` — recalculate aggregates
3. Update `directions[].status`; if all milestones are completed → `monitoring` / `resolved`
4. Recalculate the progress bar

### Auto-detect completed milestones

On launch, check:
1. `Data/doctors/visits/_index.json` — new visits matching milestone type=visit
2. `Data/labs/_index.json` — new tests matching milestone type=lab
3. If milestone.todoist_task_id is present, check the task status in Todoist

Offer the user: “Visit [X] detected — mark milestone [Y] as completed?”

### Create a Todoist task from a milestone

When creating a new milestone or on request:
1. Create a task in Todoist (the “Health” project, section by phase)
2. Write `todoist_task_id` to the milestone
3. Set the deadline and priority

### Cost summary

```
💰 Health costs

| Phase | Estimate | Actual | Δ |
|------|--------|------|---|
| 1. Urgent | 23,000 | 0 | −23,000 |
| 2. Planned | 106,000 | 0 | −106,000 |
| 3. Maintenance | 30,000 | 0 | −30,000 |
| **Total** | **159,000** | **0** | |

OMS savings: ~XX,000 ₽
```

### Update KR5.6 (Fitness)

On every launch:
1. Get WHOOP strain for the current month
2. Count the activities
3. Update milestone `kr5.6_m1` progress

### Goals synchronization

After ANY goals update:
1. Regenerate `Goals/health-goals.md` — all 12 KRs, phases, and checkboxes

## Rules

- Progress = objective data (visits, tests, workouts)
- Statuses: not_started → investigating → in_progress → monitoring → resolved
- Costs: always show both paths (public insurance / private)
- On update, cascade updates to `Goals/health-goals.md` and `cost_summary`
- Detect stagnation: if `last_activity` was more than 2 weeks ago and status != monitoring/resolved, warn

⚕️ *This information is for reference only. Consult a doctor before making treatment decisions.*
