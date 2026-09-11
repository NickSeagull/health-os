---
name: day
description: |
  Start a health-os work session: delta since last time, data integrity check, alerts, and 2–3 recommendations for today.
  Not for a full status snapshot — use /status for that. Not for ending a session — use /wrap-up for that.
  Triggers: “day”, “start the day”, “let’s start”, “what today”, “where to start”
---

# Day — session start

> **Profile.** Before reading or writing, resolve the active profile using
> `.claude/shared/profile-resolution.md`. The shorthand path `Data/X` in this file
> means `Data/profiles/<active>/X` — never write to the literal shorthand path.
> Before writing, state whose profile the data will be written to.

## Purpose

Load the hot context, show the delta since the previous session, show alerts, and recommend 2–3 actions. This is the entry point for every session.

## User request

$ARGUMENTS

## Workflow

### 1. Load context (in parallel)

Read using the Read tool:
- `MEMORY.md` — long-term memory, active threads, open questions
- `Cache/active-context.md` — hot context: tasks, expectations, blockers
- `Cache/checkpoint.yml` — recovery point for an interrupted task
- `Data/goals/YYYY.json` — directions, phases, milestones, deadlines
- `Data/medications/current.json` — active medication/supplement courses

### 2. Checkpoint recovery

If `Cache/checkpoint.yml` contains `active: true`:
```
⚡ Interrupted task: {task_title}
   Progress: {current_step}/{total_steps}
   Skill: /{skill}
   Continue? (yes / start over / cancel)
```

### 3. Check pending breadcrumbs

Use Glob to check `.claude/hooks/pending-sessions/*.json`:
- If pending files exist (other than the current session), suggest `/recover-sessions`
- If none exist, continue

### 4. Delta since the previous session

From `Cache/active-context.md`, show:
- When the last session was and what was done
- What was expected by this session (the “Expectations” section)
- What changed (if there is new data)

### 5. Current tasks

From the “Current tasks” section of `Cache/active-context.md`, show a table with statuses.
If a task has status `waiting` and its expected event has already occurred, mark it ready to work on.

### 6. Data integrity check

```bash
python3 .claude/scripts/check-integrity.py
```

Quick check: JSON validity, index completeness, CSV consistency, date formats, marker reachability, estimate reconciliation, and resolvable file references.

- If everything passes, show nothing and continue
- If there are problems, show them before alerts and offer to fix them. A schema/data mismatch silently corrupts results, so it takes priority over any health alert
- If the script is unavailable or fails, do not block the session; note it in one line

### 7. Alerts

Check and show if there is:

| Type | Condition | Severity |
|-----|---------|----------|
| Milestone deadline | ≤7 days until deadline | medium |
| Milestone overdue | past due | high |
| Course ending | ≤3 days until end | medium |
| Follow-up overdue | past due | high |
| Revaccination | overdue | low |

Format:
```
⚠️ [severity] description — deadline DD.MM
```

### 8. Recommendations (2–3 actions)

Priority:
1. **Phase 1** milestones (urgent) → recommend first
2. **Phase 2** milestones (planned) → if phase 1 is under control
3. **Recurring items** — traction review, mood, weight

Format:
```
### Recommended for today

1. [action] — why now
2. [action] — why now
3. [action] — why now
```

### 9. Morning context (before 12:00)

If the current time is before 12:00, also show:
- Morning medications (from `current.json`, according to the schedule)
- Today’s visits (from Todoist/Calendar, if available)
- WHOOP recovery (if the MCP is available)

### 10. Finish

```
---
What are we doing today?
```

## Rules

- Show only facts from the data; do not infer
- If `active-context.md` does not exist, this is the first run or the file has not been created yet. Do not send the user to `/status`: only `/wrap-up` writes this file. Show what is available and continue
- If there is little data, do not pad the output; show what exists
- Do not duplicate the full `/status`; show only the delta and alerts

⚕️ *This information is for reference only. Consult a doctor before making treatment decisions.*
