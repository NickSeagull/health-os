---
name: recover-sessions
description: |
  Processing uncommitted sessions - creating minimal logs, clearing breadcrumbs.
  Triggers: “recover-sessions”, “process sessions”, “uncommitted sessions”
---

# Recover Sessions - processing pending breadcrumbs

## Purpose

Process unfinished sessions (aborted without `/wrap-up`). Create minimal session logs, clear breadcrumbs.

## User request

$ARGUMENTS

## Workflow

### 1. Scanning pending

Via Glob read all `.claude/hooks/pending-sessions/*.json`.

For each file extract:
- `session_id` — session ID
- `date` - date (YYYY-MM-DD)
- `timestamp` — the moment of the last breadcrumb record, UTC. **Source HH-MM for log name**: breadcrumb created before the hook was fixed has `start_time` empty
- `transcript_path` — path to the session transcript. The main sign of non-emptiness
- `message_count` — number of transcript lines. For reference: old breadcrumb is always `0`, you cannot rely on this field
- `elapsed_seconds` — duration in seconds. Zero if there was no session start tmp file
- `start_time` — start time. May be empty

### 2. Classification

Whether a session is not empty is determined by the presence of a transcript, NOT by the `message_count` value.

| Category | Condition | Action |
|-----------|---------|----------|
| `current` | `session_id` matches the current session | Skip, don't touch |
| `recoverable` | The file by `transcript_path` exists and is not empty | Create a log, then delete breadcrumb |
| `empty` | The file by `transcript_path` exists, but is empty (0 bytes) | Create a log marked “session without content”, then delete breadcrumb |
| `orphan` | `transcript_path` is empty or the file for it was not found | **Do not delete anything.** Add to the “require manual solution” list and show to the user |

It is forbidden to define an empty session by `message_count`: before fixing `.claude/hooks/session-save.sh` this field was always equal to zero, and a filter based on it would have deleted 100% of sessions without creating a single log.

Use `message_count` only as a reference value in the log body and only if it is greater than zero.

### 3. Context extraction

For each session of the `recoverable` category, determine the topic by its `transcript_path`.

Reading restrictions:
- Read **no more than the first 50 lines** of the transcript - this is enough for the topic
- The transcript can weigh tens of megabytes. Never download it in its entirety: `head -n 50 "$transcript_path"`
- If after 50 lines the topic is unclear, write down “not defined” and move on

Being unable to determine the topic **does not cancel log creation**.

### 4. Creating session logs

For each session of categories `recoverable` and `empty` create `Cache/sessions/YYYY-MM-DD_HH-MM.md`:
- `YYYY-MM-DD` — from the `date` field
- `HH-MM` — from `start_time`, if it is non-empty; otherwise from `timestamp` (recorded in UTC - note this in the log)
- If a file with the same name already exists, add the suffix `_2`, `_3`, etc. **Do not overwrite existing log**

```markdown
# Session YYYY-MM-DD HH:MM (recovered)

- **ID:** {session_id}
- **Duration:** ~{elapsed} min (if `elapsed_seconds` > 0, otherwise “unknown”)
- **Messages:** ~{message_count} (if > 0, otherwise do not display the line)
- **Transcript:** {transcript_path}
- **Status:** recovered (interrupted without wrap-up)

## Topic

{topic or "unspecified"}

## Note

The session was restored automatically via `/recover-sessions`.
Context is limited - full details are in the transcript along the path above.
```

### 5. Cleaning the breadcrumb

**Strict rule: breadcrumb is deleted only after the session log has been created and written to disk.** The order is strictly as follows:

1. Create a log
2. Make sure that the file `Cache/sessions/…md` exists and is not empty
3. Only after this delete `.claude/hooks/pending-sessions/{session_id}.json`

Reverse order and deletion “at the same time” are prohibited. If log creation fails, the breadcrumb remains in place and the session is included in the report as unprocessed.

For sessions of the category `orphan` breadcrumb **do not delete under any circumstances** - without a transcript, the session contents cannot be restored from anywhere, and deleting breadcrumb will destroy the last trace of it.

Delete the accompanying `.claude/hooks/session-start-{session_id}.tmp` if it exists. Its absence is a normal situation, not an error: the hook does not always create it. Don't present this as a problem.

### 6. Commit

Only if something has changed - there may be no new logs at all (all breadcrumbs may have turned out to be `orphan` or belong to the current session).

```bash
git status --porcelain Cache/sessions/ .claude/hooks/pending-sessions/
```

If the output is empty, do not commit. Otherwise:

```bash
git add Cache/sessions/ .claude/hooks/pending-sessions/
git commit -m "fix: recover N sessions"
```

### 7. Report

```
✅ Sessions processed: N
- [date] - [topic] (recovered, log created, breadcrumb cleared)
- [date] - session without content (log created, breadcrumb cleared)

⚠️ Requires manual solution: M
- [date] - {session_id}: transcript not found ({transcript_path or "field empty"})
  Breadcrumb left: .claude/hooks/pending-sessions/{session_id}.json

What can you do with them:
  1. Remember the contents of the session and create a log manually
  2. Delete breadcrumb if the session is definitely not important - only by your decision

Logs: Cache/sessions/
```

The section “Requires manual decision” is always shown when M > 0. Do not hide and do not decide for the user.

## Rules

- Do not touch the current session
- **Never delete breadcrumb if the session log has not been created.** Order: log → check for file existence → delete
- Non-emptiness is determined by the transcript, and not by `message_count`
- Do not delete sessions without a transcript (`orphan`) - leave to the user for a manual solution
- Do not block work - if the topic could not be determined, create a log without a topic
- Transcripts should be read partially (first 50 lines), never downloaded in full
- The absence of `session-start-*.tmp` is not an error, do not report it
- Commit only if there have been changes

**Completion Criteria:** Each breadcrumb is assigned to one of four categories; log files were created for all `recoverable` and `empty` and their existence was checked; only those breadcrumbs were deleted for which the log was confirmed on disk; all `orphan` remained in place and are listed in the report.
