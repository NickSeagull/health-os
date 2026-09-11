# Active Context and Checkpoint

## Active Context (`Cache/active-context.md`)

Working context carried between sessions. Rewritten at every `/wrap-up`.

### Required Sections

1. **Latest Session** — date, work completed, files, plus one line each for the 2–3 preceding sessions
2. **Current Tasks** — the top 5 active health tasks with statuses:
   - `in_progress` — being worked on right now
   - `waiting` — awaiting an external event (results, an appointment)
   - `next` — next to be done
3. **Current Focus** — what the work is focused on (phase, health areas)
4. **Expectations for the Next Session** — what should happen before the next session
5. **Next Steps** — specific actions
6. **Blockers** — what is preventing progress

### «Current Tasks» Format

```markdown
## Current Tasks

| # | Task | Status | Context |
|---|------|--------|---------|
| 1 | Upload lab results | waiting | Gemotest, expected March 16–17 |
| 2 | Book a hematologist appointment | next | After receiving the results |
| 3 | Book a urologist appointment | next | Deadline April 1 |
```

### When to Update

- `/wrap-up` — rewrite in full
- During a session — if a task’s status changes (waiting → in_progress, task completed)

## Checkpoint (`Cache/checkpoint.yml`)

A recovery point for multistep operations. Allows an interrupted task to resume.

### When to Activate (active: true)

- Processing multiple files from Inbox (3+ files)
- Uploading multiple lab reports
- Multistep interpretation or data import
- Any operation that could be interrupted halfway through

### When to Deactivate (active: false)

- The task is complete
- `/wrap-up` — if the task is incomplete, leave active: true with up-to-date context

### Fields

```yaml
active: true
task_id: "inbox-2026-03-15"        # unique ID
task_title: "Processing 5 PDFs from Inbox"
skill: "inbox"                      # skill that started the task
current_step: "processing_file_3"   # current step
total_steps: 5                      # total steps (if known)
started_at: "2026-03-15T14:30:00"
last_updated: "2026-03-15T15:10:00"
context:
  files_processed: ["scan1.pdf", "scan2.pdf"]
  files_remaining: ["scan3.pdf", "scan4.pdf", "scan5.pdf"]
  notes: "The first two are blood tests; the third appears to be an ultrasound"
```

### At Session Start (`/day`)

If `active: true` → display:
```
⚡ Interrupted task: {task_title}
   Progress: {current_step}/{total_steps}
   Skill: /{skill}
   Continue? (yes / start over / cancel)
```
