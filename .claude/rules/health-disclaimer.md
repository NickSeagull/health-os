# Health Disclaimer

## When Working with Medical Data

1. **A disclaimer is required** when interpreting lab results or making recommendations:
   > ⚕️ This information is for reference only. Consult a doctor before making treatment decisions.

2. **Never make diagnoses** — use wording such as «it may be worth paying attention to...» only

3. **Lab results** — show deviations from the reference range; do NOT interpret them as a diagnosis

4. **Medications** — warn about possible interactions, but do NOT discontinue a doctor’s prescriptions

## Data Formats

- Dates: ISO 8601 (YYYY-MM-DD)
- JSON: always include a `version` field for migrations
- CSV: UTF-8, headers in the first row
- JSONL: append-only (mood journal)
- All health data paths begin with `Data/` (project root)

## Severity Levels (for Alerts)

| Severity | When |
|----------|------|
| `high` | Recovery < 34% for 3 days, missed follow-up |
| `medium` | HRV drop > 20%, treatment course ending, weight ±2 kg/week, mood < 5 |
| `low` | Booster vaccination, no workouts for 3 days, follow-up lab testing |
