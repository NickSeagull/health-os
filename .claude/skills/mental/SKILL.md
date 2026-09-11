---
name: mental
description: |
  Mood tracking, correlations with WHOOP recovery/sleep, and identification of patterns and triggers.
  Triggers: “mood”, “stress”, “anxiety”, “record how I feel”
---

# Health Mental — mental health

> **Profile.** Before reading and writing, determine the active profile by
> `.claude/shared/profile-resolution.md`. Short path `Data/X` in this file
> means `Data/profiles/<active>/X` — never write to the literal shorthand path.
> Before recording, tell whose profile it goes to.

## Purpose

Track mood and correlate it with WHOOP data. Identify patterns of stress, anxiety, and their triggers.

## Red flags - checked first

**Before any other work** read Block 4 of the `.claude/shared/critical-values.md` file and check the user's entry for red flags.

A red flag is triggered when any of the following occurs:

- mention of suicidal thoughts, intentions or plans - in any formulation, including indirect ones (“I don’t want to wake up”, “everyone will be better off without me”, “there is no point”)
- mention of self-harm
- mood ≤ 2
- mood drop by 4 or more points within 24 hours
- mood persistently ≤ 4 for seven days or more
- hopelessness combined with insomnia and loss of interest

Not only the numerical score is checked, but also the free text in the `notes` field - it is always read.

**When triggered:** stop the normal workflow, display the help contact block from Block 4 `critical-values.md`, record an alert with `severity: "critical"` and `type: "mental_crisis"`. Do not continue analyzing correlations and patterns, do not give advice on regimen and nutrition, do not diagnose.

## Workflow

### Record a mood entry

Ask (scale 1–10):
1. Mood (mood)
2. Energy (energy)
3. Stress (stress; inverted: 1 = no stress, 10 = maximum)
4. Subjective sleep quality (sleep_quality)
5. Notes (what influenced your mood; triggers)
6. Tags (work, health, relationship, money, etc.)

→ Append to `Data/mental/journal.jsonl`:
```json
{"ts":"2026-03-21T20:00:00+03:00","mood":7,"energy":6,"stress":3,"sleep_quality":8,"notes":"Productive day","tags":["work"]}
```

Validation before recording: scores must be in the range 1–10, `ts` must use ISO 8601 with a time zone, and the date must not be in the future. If a value is outside this range, ask again; never write it silently.

### View by period

1. Read `Data/mental/journal.jsonl`
2. Show entries for the last 7 days:

```
| Date | Mood | Energy | Stress | Sleep | Notes |
|------|------|--------|--------|-------|---------|
```

3. Averages for the period:
```
📊 Weekly summary:
  Mood: 6.8 avg | Energy: 6.2 avg | Stress: 4.1 avg | Sleep: 7.0 avg
```

If there are no records for the period, say directly “no data for the period” and do not show an empty table.

### Correlations with WHOOP

If data is available:
1. Retrieve WHOOP data for the same period through the MCP server `whoop`. If the server is unavailable, say so and continue without correlations
2. Show:
```
📊 Correlations:
  Recovery ↔ Mood: r=0.72 (strong)
  Sleep hours ↔ Energy: r=0.65 (moderate)
  HRV ↔ Stress: r=-0.58 (inverse)
```

Correlations from a single-person sample are evidence level D. State this clearly and do not present them as cause-and-effect relationships.

### Patterns

When ≥ 14 entries are accumulated:
1. Analyze trends
2. Identify patterns:
   - days of the week with low mood
   - tags correlating with stress
   - influence of sleep on energy
3. Update `Data/mental/patterns.md`

If there are fewer than 14 records, state how many are present and how many more are needed; do not display patterns. Statistics from a small sample are misleading.

### Context of life

When interpreting low mood, check life context before attributing it to psychological causes (Block 4 of the holistic framework):

- nutrition phase from `Data/profile.json` → `lifestyle.nutrition` - a calorie deficit itself reduces mood, energy, and concentration
- season and daylight from `Data/context/environment.json` - seasonal affective disorder as a competing explanation
- substances, sleep patterns, workload
- recent test abnormalities - thyroid, iron, B12, vitamin D

### Alerts

Write to `Cache/alerts/YYYY-MM-DD.json` according to the scheme from Block 5 `critical-values.md`.

| Condition | Severity |
|---------|----------|
| Red flag from Block 4 `critical-values.md` | critical |
| Mood ≤ 4 for 7 consecutive days | high |
| Average mood < 5 for 3 days | medium |
| Stress > 7 three days in a row | medium |
| Energy < 4 three days in a row | medium |

## Rules

- **Red flags are checked first** - before recording, before statistics, before correlations
- JSONL - append-only, never overwrite
- All timestamps must include the time zone (+03:00)
- Do not try to be a psychotherapist and do not diagnose
- Tags - lowercase letters, no spaces
- Completion criterion: entry added to the log, alerts when triggered are written to `Cache/alerts/`

⚕️ *Information is for reference only. For persistent problems, contact a specialist. If you are thinking about harming yourself, call 112, 103, or 8-800-2000-122.*
