---
name: status
description: |
  Current health status: active directions, medication courses, upcoming visits, and open questions.
  Triggers: “status”, “what’s in progress”, “status”, “what now”, “show the state”
---

# Status — current health state

> **Profile.** Before reading or writing, resolve the active profile using
> `.claude/shared/profile-resolution.md`. The shorthand path `Data/X` in this file
> means `Data/profiles/<active>/X` — never write to the literal shorthand path.
> Before writing, state whose profile the data will be written to.

## Purpose

Show the complete picture: what is in progress, which courses are active, what is overdue, the current phase, and costs. Run at the start of a session or on request.

## User request

$ARGUMENTS

## Workflow

### 1. Collect data (in parallel)

Read using the Read tool:
- `MEMORY.md` — long-term memory, active threads
- `Cache/active-context.md` — hot context, what happened in the previous session
- `Data/goals/YYYY.json` (v2) — directions, phases, milestones
- `Data/traction/reviews.jsonl` — latest snapshot (tail)
- `Data/costs/YYYY.jsonl` — costs (all rows)
- `Data/medications/current.json` — active courses
- `Data/doctors/contacts.json` — doctors
- `Data/labs/_index.json` — latest tests
- `Data/mental/journal.jsonl` — latest mood entry (tail)
- `Data/body-metrics.csv` — latest measurement (tail)

Using Glob:
- `Data/doctors/visits/*.md` — latest visits (3)

### 2. Conclusion

```markdown
## Health status — YYYY-MM-DD

### Current phase

**Phase N. [Name]** ([period])
Phase progress: X/Y milestones

### Active directions (by phase)

#### Phase 1. Urgent
| KR | Direction | Status | Milestones | Next milestone | Deadline |
|----|-------------|--------|------------|---------------------|---------|
| 5.0 | Hematology | 🟡 | 0/4 | Primary care referral | 01.04 |

#### Phase 2. Planned
...

### Active medication courses

| Medication | Dosage | Remaining | Doctor |
|----------|-----------|----------|------|
| [from medications/current.json, only status: active, with until] |

Ongoing use: [list without until]

### Upcoming visits and follow-up

- [from recent visits — “Next visit” section]
- [overdue follow-ups — highlight]

### Recent events

- Last visit: [date, doctor]
- Last test: [date, type]
- Last measurement: [weight, date]
- Mood: [latest entry]
- Last traction review: [date, from reviews.jsonl]

### Costs

| Item | Amount |
|--------|-------|
| Current month | X ₽ |
| 2026 total | Y ₽ |
| Remaining estimate | Z ₽ |

### Open questions

[From the “Open questions” section of MEMORY.md]

### What changed since the previous session

[From the “Last session” section of Cache/active-context.md]
```

### 3. Alerts

Check and show if present:
- Milestone with a deadline ≤7 days away → warn
- Overdue milestone → highlight
- Course ending within ≤3 days → warn
- Overdue follow-up → highlight
- Overdue revaccination → remind
- No mood entries for >7 days → suggest one
- Stagnation (direction.last_activity > 14 days, status != monitoring) → note it

## Rules

- Show facts only; do not infer
- If data is missing, write “no data”; do not hide the section
- After showing the status, ask: “What are we doing today?”

⚕️ *This information is for reference only. Consult a doctor before making treatment decisions.*
