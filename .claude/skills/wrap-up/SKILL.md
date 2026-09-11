---
name: wrap-up
description: |
  Ending a health-os session: session log, active-context, checkpoint, MEMORY.md, Goals/health-goals.md, clearing breadcrumb and commit. Closes the entire session - not for saving a single file or analysis.
  Triggers: “end session”, “save session”, “wrap up”, “finished”, “close session”
---

# Wrap-up - end the session

> **Profile.** Before reading and writing, determine the active profile by
>`.claude/shared/profile-resolution.md`. Short path `Data/X` in this file
> means `Data/profiles/<active>/X` — never write to the literal shorthand path.
> Before recording, tell whose profile it goes to.

## Purpose

Save the session context in MEMORY.md, make a commit. No push (no remote).

## Workflow

### 1. Collect session results

The mechanism is not from memory, but from the state of the repository:

```bash
git status --short
git diff --stat HEAD
```

From this conclusion determine:
- Which files have changed (`git status --short`) and by how much (`git diff --stat HEAD`)
- Which areas are affected - along the paths of the changed files (`Data/labs/` → analyses, `Data/doctors/` → visits, etc.)
- What decisions were made - from the session
- What's left open?

### 2. Create a session log

Create file `Cache/sessions/YYYY-MM-DD_HH-MM.md`:

```markdown
# Session YYYY-MM-DD HH:MM

- **Duration:** ~X min
- **Directions:** [affected KR/directions]

## What's done

- [action 1]
- [action 2]

## Changed files

- [list of key files]

## Solutions

- [solution 1 - why]

## Open questions

- [what remains unresolved]
```

### 3. Update active-context

Overwrite `Cache/active-context.md`:

```markdown
# Active Context — Health-OS

## Last session

- **Date:** YYYY-MM-DD
- **What has been done:** [short list]
- **Changed files:** [list]

### Previous sessions

- [previous 2–3 sessions - one line each]

## Current tasks

| # | Problem | Status | Context |
|---|--------|--------|----------|
| 1 | [task] | in_progress/waiting/next | [context] |

## Current focus

- [what the work is currently focused on]

## Expectations for the next session

- [what should happen before the next login]

## Next steps

- [specific actions for the next session]

## Blockers

- [what prevents progress, if any]
```

### 4. Update checkpoint

Update `Cache/checkpoint.yml`:
- If the multi-step task is **completed** → `active: false`, reset the fields
- If the task is **not completed** → leave `active: true`, update `current_step`, `context`, `last_updated`
- If there was no multi-step task → do not touch

### 5. Update MEMORY.md

Update the following sections (WITHOUT “Last session” - it is in the active-context):

**"Active threads"** - update if changed:
- Add new directions
- Update statuses
- Remove completed

**"Open questions"** - update:
- Add new
- Remove solved ones

**"Next actions"** - update:
- What needs to be done in the next session
- Expected visits, tests

### 6. Update Goals/health-goals.md

Regenerate local targets file from live data:

**`Goals/health-goals.md`** - update from:
- `Data/goals/YYYY.json` (v2) → all KR from `directions[]` (number of directions read from file, do not set as a constant), phases, milestones checkboxes, expenses

Generate the file in full; do not patch it.

### 7. Clear breadcrumb

**only the breadcrumb of the current session** is deleted. Mass cleaning is prohibited: `.claude/hooks/pending-sessions/` contains traces of other sessions, including those running in parallel right now, and they are the only input for `/recover-sessions`.

**If `session_id` of the current session is known:**
- Remove `.claude/hooks/pending-sessions/{session_id}.json`
- Remove `.claude/hooks/session-start-{session_id}.tmp` if it exists. Missing file is normal, not an error

**If `session_id` is unknown:**
- **Do not delete anything.** Not by date, not by time of change, not “everything for today”
- Tell the user:
  ```
  ⚠️ Breadcrumb has not been cleared - the current session ID is unknown.
     You cannot delete files by date: breadcrumbs from other sessions may lie nearby.
     Recover the accumulated: /recover-sessions
  ```

Cleaning other people's breadcrumbs is the responsibility of `/recover-sessions`, not this skill.

### 8. Checking integrity before committing

```bash
python3 .claude/scripts/check-integrity.py
```

Committing broken data is worse than not committing: the defect is recorded in history and survives the session.

- Everything is over - move on in silence
- If there are problems, show them and ask whether to fix them now or commit them as is. The decision is up to the user: some discrepancies occur in the middle of unfinished work and this is normal
- The script is not available - mark one line and continue

### 9. Commit

First check if there is anything to commit:

```bash
git status --porcelain
```

**If the output is empty** - there are no changes. Do not commit (`git commit` will end with the error “nothing to commit”), in the confirmation write “Commit: not required - no changes.” This is not a session error.

**If the output is not empty:**

```bash
git add -A
git commit -m "[type]: short description"
```

Types: `feat`, `docs`, `fix`, `refactor`

**DO NOT push** - the project is local only.

### 10. Confirmation

```
✅ Session ended
- Session log: Cache/sessions/YYYY-MM-DD_HH-MM.md
- Active context updated
- Checkpoint: [deactivated / updated (task X, step Y/Z) / was not]
- MEMORY.md updated
- Goals/health-goals.md updated
- Breadcrumb: [cleared / not cleared - session_id unknown, see /recover-sessions]
- Commit: [hash] - [message] / not required - no changes
- Changed files: N
```

Each line reflects the actual result of the step. Do not write “cleaned” if step 7 went into the “unknown” branch, and do not write about the commit if it did not exist.

## Rules

- **Medical data does not leave the project directory** - recording PHI anywhere outside is prohibited. If this is needed at all, only aggregates go outside: quantities, statuses, metrics. No names of drugs, diagnoses, allergens, full names or dates of birth
- **Only your own breadcrumb** - deleting others or deleting by date is prohibited under any circumstances
- **Skill closes the entire session** - if the user asks to save a specific file, analysis or note, this is not `/wrap-up`. Run only on explicit session termination
- The order of steps is fixed in CLAUDE.md and cannot be changed: log → active-context → checkpoint → MEMORY → Goals → breadcrumb → integrity check → commit

**Completion criteria:** session log created; `Cache/active-context.md` contains all six required sections from `.claude/rules/active-context.md`; `Cache/checkpoint.yml` is brought into line with the actual state of the task; MEMORY.md and `Goals/health-goals.md` updated; breadcrumb was either deleted by the well-known `session_id`, or was explicitly left with a message to the user; the commit is made or honestly marked as not required; The step 10 report reflects the actual results of each step.
