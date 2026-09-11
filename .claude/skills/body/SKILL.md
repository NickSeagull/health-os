---
name: body
description: |
  Body metrics: weight, blood pressure, BMI, body composition. Trends and correlations with WHOOP.
  Triggers: “weight”, “blood pressure”, “BMI”, “weighed myself”, “measured my blood pressure”, “body metrics”
---

# Health Body — body metrics

> **Profile.** Before reading or writing, resolve the active profile using
> `.claude/shared/profile-resolution.md`. The shorthand path `Data/X` in this file
> means `Data/profiles/<active>/X` — never write to the literal shorthand path.
> Before writing, state whose profile the data will be written to.

## Purpose

Record and analyze body metrics: weight, blood pressure, BMI, body composition. Trends and correlations.

## Emergency thresholds — check first

**Before recording or performing any analysis**, consult Block 3 of `.claude/shared/critical-values.md`.

| Metric | Threshold | Action |
|------------|-------|----------|
| Blood pressure | ≥ 180/120 | **Hypertensive crisis.** This is an emergency, not “elevated blood pressure”. Display it in the first message; recommend calling an ambulance if there is chest pain, shortness of breath, impaired vision or speech, or facial asymmetry |
| Blood pressure | < 90/60 with fainting, confusion, or cold sweats | Emergency |
| Resting heart rate | < 40 or > 150 | Emergency |
| Weight | unintentional loss of > 5% of body weight in a month | See a doctor |

If triggered, record an alert with `severity: "critical"` and do not continue the normal workflow until the warning has been displayed.

## Workflow

### Adding a measurement

Ask for (all fields are optional except weight):
- weight (kg)
- blood pressure (systolic/diastolic)
- pulse
- body fat percentage (if body composition scales are available)
- muscle mass
- waist circumference
- notes

Structure of `Data/body-metrics.csv` — 11 columns:

```
date,weight_kg,height_cm,bmi,body_fat_pct,muscle_mass_kg,systolic,diastolic,heart_rate,waist_cm,notes
```

→ Add a row:
```
2026-03-21,82.5,191,22.6,18.2,,120,80,65,,"morning, fasting"
```

Writing rules:
- **Always enclose a note containing a comma in double quotes** — otherwise the row will gain an extra field and break parsing of the entire file
- Always populate `height_cm`, taking the value from `Data/profile.json` → `basic.height_cm`
- Calculate BMI as weight / (height in meters)², rounded to one decimal place
- Leave empty fields empty, without a space
- Use ISO 8601 dates, not future dates
- If an entry already exists for the same date, ask whether to replace it or add a second measurement

Plausibility check before recording: weight 30–250 kg, systolic 70–250, diastolic 40–150, pulse 30–220. If outside the range, ask again; it may be a typo.

### Viewing trends

1. Read `Data/body-metrics.csv`
2. Show the last 10 measurements:

```
| Date | Weight | BMI | Fat% | Blood pressure | Pulse |
|------|-----|-----|------|----------|-------|
```

3. Trend over the period:
```
📊 Weight over the last month:
  Start: 84.0 kg → Now: 82.5 kg (−1.5 kg)
  Min: 82.0 | Max: 84.5 | Avg: 83.2
```

4. Take the target weight from `Data/goals/YYYY.json` → `fitness_target.target_weight_kg`. If the value is `null`, do not show the goal block; instead, offer to set a goal:
```
🎯 Goal: 80 kg | Remaining: 2.5 kg | Pace: −1.5 kg/month → ~2 months
```

### InBody data

InBody body composition measurements are stored in `Data/labs/*_inbody.json` and partially duplicated manually in the CSV.

**The authoritative record is in `Data/labs/`**; the CSV only reflects summary values. If they disagree, the InBody data is correct. Do not create a new CSV row from InBody if a row for that date already exists.

### Correlations with WHOOP

1. Retrieve WHOOP data for the period through the `whoop` MCP server. If the server is unavailable, say so and continue without correlations
2. Show the relationship between weight and recovery, strain, and sleep

A correlation from a sample of one person is evidence level D.

### Life context

When interpreting weight and blood pressure changes, consider (Block 4 of the holistic framework):
- the nutrition phase from `Data/profile.json` → `lifestyle.nutrition` — a deficit or surplus explains most weight changes
- substances: hookah, caffeine, alcohol — direct effects on blood pressure and pulse
- exertion and recovery

### Alerts

Write to `Cache/alerts/YYYY-MM-DD.json` using the schema in Block 5 of `critical-values.md`.

| Condition | Severity |
|---------|----------|
| Blood pressure ≥ 180/120 or heart rate < 40 / > 150 | critical |
| Persistent blood pressure 160–179 / 100–119 | high |
| Blood pressure > 140/90 | medium |
| Weight changed by > 2 kg in a week | medium |
| BMI outside the 18.5–24.9 range | low |

## Pediatric profile

For patients under 18, height, weight, and BMI **must not be interpreted as absolute
values** — only as age- and sex-specific percentiles (WHO growth standards).
See `.claude/shared/pediatric-references.md`, Block 4.

- Record in the CSV as usual; interpret using percentiles
- The curve's **trajectory** matters more than the position on it: crossing two or more
  percentile lines downward or upward requires attention, whereas a consistently
  low percentile band is more often a normal variant
- A child's blood pressure is interpreted as a percentile for age, sex, and
  height. **The adult threshold of 140/90 does not apply**; the emergency thresholds in
  `critical-values.md` are also age-specific for children
- Without a date of birth, a percentile cannot be calculated — say so rather than
  substituting adult logic

---

## Rules

- **Check emergency thresholds first** — before recording and before trends
- CSV: UTF-8, commas, first row contains headers, 11 columns
- Append new entries to the end of the file; do not rewrite existing rows
- Notes containing commas must be enclosed in double quotes
- Take height from `Data/profile.json` → `basic.height_cm`
- For blood pressure > 140/90, warn that a primary care consultation is needed
- Completion criterion: the row is added, BMI is calculated, and any triggered alerts are recorded

⚕️ *This information is for reference only. Consult a doctor before making treatment decisions. If there are signs of an emergency, call 103 or 112.*
