---
name: wiki
description: |
  Medical record wiki layer: linked entity pages, contradiction detection, orphan pages, broken links, and relationship graph.
  Triggers: “wiki”, “relationship graph”, “build wiki”, “check wiki”, “contradictions”, “what is unlinked”
---

# Wiki — Linked Medical Records

> **Profile.** Before reading or writing, resolve the active profile using
> `.claude/shared/profile-resolution.md`. Personal pages live in
> `Data/profiles/<active>/wiki/`; shared pages live in `Data/wiki/`.

## Purpose

JSON files in `Data/` store **values**: markers, dates, and doses. They are precise but disconnected. The wiki stores **relationships and judgments**: why a marker matters, which hypothesis explains it, what each doctor said, and where statements contradict one another.

Method: Andrej Karpathy's LLM Wiki, adapted to medical records. The key difference is that **numbers are not copied into Markdown**. Karpathy's sources are unstructured, making a Markdown page an improvement. Here, values already live in JSON and support trends, charts, and integrity checks. A page **links to** a record instead of copying it.

Copies inevitably drift from their originals. The system has already encountered this problem in specialist prompts containing copies of medical records: they became outdated and caused agents to assert claims that had been refuted.

---

## Page types

### Personal — `Data/profiles/<id>/wiki/`

| Directory | Describes |
|-----------|-----------|
| `condition/` | A condition or diagnosis: course, confirmed facts, influencing factors |
| `hypothesis/` | A root-cause hypothesis: evidence for and against, how to test it |
| `symptom/` | A complaint: onset, coinciding events, aggravating factors |
| `doctor/` | A doctor: specialty, visits, prescriptions, outstanding actions |
| `synthesis/` | A review: consilium report, comparison, or topic assessment |

### Shared — `Data/wiki/`

| Directory | Describes |
|-----------|-----------|
| `source/` | A literature source: guideline or study, with a URL |
| `marker/` | Marker reference: meaning, regulation, and confounders |

Shared pages are not tied to a person: the literature and marker physiology apply to everyone. Research found for one family member can support all profiles.

---

## Page format

```markdown
---
type: condition
title: Iron deficiency without anemia
slug: iron-deficiency-no-anemia
status: suspected        # active · suspected · resolved · refuted
created: 2026-03-20
updated: 2026-08-06
sources:                # paths to source records, WITHOUT copying values
  - labs/2026-03-15_cbc.json
  - doctors/visits/2026-03-20_hematologist.md
---

Ferritin has declined for three consecutive measurements while hemoglobin
remains normal: see [[marker/ferritin]]. Manifestation: [[symptom/fatigue]].

A competing explanation is [[hypothesis/thyroid-subclinical]]; transferrin
and soluble transferrin receptors distinguish them.

At the appointment, the hematologist favored deficiency: [[doctor/hematologist]].
Basis: [[source/bsg-iron-deficiency]].
```

**Format rules:**

- **Do not copy numerical values onto pages.** Write “declined for three consecutive measurements,” not “23 → 19 → 16.” Read values from `sources[]`
- `sources[]` paths are relative to the profile root; for shared pages, they are relative to `Data/`
- Use `[[type/slug]]` links in the body. Compute backlinks instead of storing them; stored copies would drift
- `slug` uses Latin letters, digits, and hyphens, and matches the filename without `.md`
- **Quote values containing a colon.** Unquoted `title: Analysis: causes of fatigue` breaks YAML, causing the page to lose its title, status, and sources while looking like a page that simply lacks them. A valid example is `title: "Analysis. Causes of fatigue"`

---

## Modes

### `build` — initial assembly

A one-time operation on first use. Read the active profile's `Data/` and create an initial set of pages:

1. From `hypotheses.json`: one page per hypothesis, with status and lab links from `evidence_for` / `evidence_against`
2. From `profile.json` → `chronic_conditions`: one page per condition
3. From `current_complaints`: one page per symptom
4. From `doctors/contacts.json` and the visit index: one page per doctor
5. From `consilium/`: a synthesis page for each report
6. From the lab index: **do not create pages directly.** A lab result is a source, not an entity. Create a page for what the result explains

Then link pages: find cross-page mentions, add `[[links]]`, and run `lint`.

Report how many pages were created and what remains unlinked.

### `sync` — after new data

Called after writes by `/inbox`, `/doctor`, `/labs`, and `/consilium`, or manually. **Integrate new data into existing pages** rather than rebuilding everything:

1. Read what has appeared since the last synchronization
2. Identify affected entities
3. Update affected pages: course, status, `sources[]`, and `updated`
4. Create pages for mentioned entities that lack a page
5. Flag new information that **contradicts** earlier content; show both statements rather than silently rewriting
6. Append an entry to `Data/profiles/<id>/wiki/_log.md`

Use a parseable log format:

```
## [2026-08-06] sync | Gemotest lab results 03-15
Pages affected: 4 · created: 1 · contradictions: 1
```

### `lint` — wiki health check

The main mode and the reason this layer exists.

| Check | Finds | Why it matters |
|-------|-------|----------------|
| **Contradictions** | Statements that cannot both be true | Doctors disagree; a hypothesis says “stable” while a lab result shows a decline |
| **Orphans** | Pages with no incoming links | An imported result was never interpreted; a hypothesis lacks `next_step`; a doctor's prescription was forgotten |
| **Broken links** | `[[x]]` with no page `x` | A medication appears in a visit note but not in `medications/`; a diagnosis is mentioned without its own page |
| **Outdated pages** | `updated` predates the newest file in `sources[]` | New lab results arrived, but the page's conclusion is unchanged |
| **Missing links** | Pages sharing a source without linking to one another | Two hypotheses rely on the same result but are disconnected |

The output is a work list:

```
⚠ Contradictions (2)
  [[condition/iron-deficiency]] “ferritin is stable”
    ↔ labs/2026-03-15_cbc.json shows a third consecutive decline
    Resolve: update the page or explain the discrepancy

○ Orphans (4)
  [[hypothesis/b12-deficiency]] — no incoming links or next_step

✗ Broken links (1)
  [[medication/magnesium-citrate]] ← mentioned in doctor/therapist
```

**Do not resolve contradictions automatically.** Show both statements and suggest what could distinguish them. Silent editing destroys information: disagreement between sources is itself a finding.

### `graph` — dashboard data

**Do not cache the graph to a file**: the dashboard parses pages on request. A cache would drift from the pages, recreating the problem of duplicate information.

This mode presents text statistics: nodes by type, edges, and the most and least connected pages.

---

## When the wiki is harmful

A neglected layer is **worse than no layer**: it looks trustworthy and is read as a current assessment.

Therefore:

- Run `lint` during `/wrap-up`
- Show each page's `updated` date and `sources[]`
- Mark a page outdated before reading it when a source is newer
- Treat a claim unsupported by `sources[]` as a page defect, not a style issue

---

## Rules

- **Do not copy numbers onto pages.** Link to records
- Compute backlinks rather than storing them
- Show contradictions rather than smoothing them over
- Personal pages must not link to another profile's pages. Shared sources and marker references are available to all profiles
- Give every clinical claim an evidence level and source according to `.claude/shared/evidence-base.md`
- Create source pages only with verifiable URLs: a fabricated wiki citation persists and may be cited again
- Match the filename's slug to the frontmatter `slug`
- Completion requires running `lint`, presenting contradictions, and appending to `_log.md`

⚕️ *This information is for reference only. Consult a physician for treatment decisions.*
