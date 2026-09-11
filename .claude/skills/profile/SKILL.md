---
name: profile
description: |
  PHR — basic medical record. View, create, and update a health profile.
  Triggers: «medical record», «health profile», «allergies», «blood type»
---

# Health Profile — medical record

> **Profile.** Before reading or writing, resolve the active profile using
> `.claude/shared/profile-resolution.md`. The short path `Data/X` in this file
> means `Data/profiles/<active>/X` — never write to the short path literally.
> Before writing, state whose profile the write targets.

## Purpose

Manage the basic personal health record (PHR). View, create, and update data.

## Workflow

### View

1. Read `Data/profile.json`
2. Show in a readable format:
   - Basic information (full name, date of birth, blood type, height)
   - Allergies (table: allergen, type, severity)
   - Chronic conditions (table: condition, year of onset, status, doctor)
   - Family history
   - Current complaints (table: area, description, status)

### Update

When an update is requested:
1. Ask what to update
2. Read the current `Data/profile.json`
3. Update the relevant fields
4. Save using the Write tool

### Add an allergy

Format:
```json
{
  "allergen": "name",
  "type": "food|drug|contact|respiratory",
  "severity": "mild|moderate|severe",
  "since": "YYYY",
  "reaction": "description of the reaction"
}
```

### Add a chronic condition

Format:
```json
{
  "condition": "name",
  "icd10": null,
  "since": "YYYY",
  "status": "active|remission|resolved",
  "doctor_id": "",
  "notes": ""
}
```

## Rules

- Do not delete records — change the status to `resolved`
- Dates in ISO 8601
- **Medical data must not leave the project directory** — writing PHI anywhere outside it is prohibited. If anything needs to go outside at all, send only aggregates: counts, statuses, metrics. No medication names, diagnoses, allergens, full names, or dates of birth

⚕️ *This information is for reference only. Consult a doctor for treatment decisions.*
