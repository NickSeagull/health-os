# `Data/` — Medical Data Directory

The entire medical record lives here: profile, lab results, visits, medications, and goals. Everything else in the project—skills, agents, and the dashboard—reads and writes these files.

The repository contains **templates**, not personal records. You create your own data from the templates; it stays out of Git (see [Why the contents are not version-controlled](#why-the-contents-are-not-version-controlled)).

---

## Two types of templates

| Suffix | What it contains | Purpose |
|--------|------------------|---------|
| `*.example.*` | An empty but valid structure: empty arrays, `null`, and zero counters | Starting your own record |
| `*.demo.*` | The same schema populated with synthetic data for a fictional patient | Exploring the dashboard before entering your own data |

The demo patient is “Demo User,” a 34-year-old man whose city is listed as “Your city.” The data is invented: mostly normal lab results with one mild abnormality (vitamin D at 24 ng/mL), one primary care visit, one vitamin supplement, and three weight entries. It has no connection to a real person and must not be treated as a clinical example. The bundled structured dataset uses English labels.

---

## Getting started

### Option 1. Explore the demo

Copy all demo files to their working filenames by removing the `.demo` suffix:

```bash
find Data -name '*.demo.*' | while read -r f; do cp "$f" "${f/.demo./.}"; done
mv Data/goals/goals.json  Data/goals/2026.json    # see the year note below
mv Data/costs/costs.jsonl Data/costs/2026.jsonl
```

Run this from the project root. The command works in `bash` and `zsh`.

Then start the dashboard:

```bash
cd Dashboard && npm install && npm run dev
```

The demo templates remain in place, so you can delete the working copies and repeat at any time.

### Option 2. Start your own record

Do the same with empty templates:

```bash
find Data -name '*.example.*' ! -name '_analysis.*' ! -name '_visit.*' \
  | while read -r f; do cp "$f" "${f/.example./.}"; done
mv Data/goals/goals.json  Data/goals/2026.json
mv Data/costs/costs.jsonl Data/costs/2026.jsonl
```

`_analysis.reference.json` and `_visit.reference.md` are intentionally excluded: they are **single-entry** templates, not whole-file templates. Copy them manually using the intended filename, such as `Data/labs/2026-06-18_cbc.json` or `Data/doctors/visits/2026-06-25_therapist.md`.

Continue through skills rather than editing by hand: `/onboarding` interviews you and distributes answers across files; `/inbox` processes lab PDFs; `/labs`, `/doctor`, and `/meds` write their respective files.

> If you tried the demo, delete the working copies before option 2; otherwise, the fictional patient will remain in your medical record.

### Note on files named by year

Two working files are named by year: goals and expenses. Templates have no year—`goals.example.json` and `costs.example.jsonl`—because each user's starting year may differ. That explains the two `mv` commands above.

References to these files are currently hardcoded to 2026: the dashboard reads `Data/goals/2026.json` (`Dashboard/lib/data/goals.ts:5`), and skills reference `Data/costs/2026.jsonl`. When starting another year, rename the files and update these references.

---

## Where everything lives

### Root files

| File | Contents |
|------|----------|
| `profile.json` | Medical record: basic information, allergies, chronic conditions, family history, complaints, and lifestyle |
| `history.json` | Surgeries, hospitalizations, injuries, and significant life events—the chronological anchor |
| `vaccinations.json` | Vaccinations and tuberculin tests |
| `hypotheses.json` | Hypotheses about symptom causes, with status and evidence for and against |
| `body-metrics.csv` | Weight, height, BMI, blood pressure, pulse, and body composition—eleven columns |

### Subdirectories

| Directory | Files | Contents |
|-----------|-------|----------|
| `context/` | `environment.json` | External context: city, climate, housing, work, circadian rhythm, and stressors |
| `labs/` | `_index.json`, `YYYY-MM-DD_[type].json` | Lab results: an index plus one file per test panel |
| `labs/pdfs/` | — | Lab reports referenced by `pdf_path` |
| `doctors/` | `contacts.json` | Doctors: full name, specialty, and clinic |
| `doctors/visits/` | `_index.json`, `YYYY-MM-DD_[specialty].md` | Visit notes: an index plus one file per visit |
| `doctors/prep/` | `[specialty].md` | Preparation for the next appointment; overwritten, with no date in the filename |
| `dental/` | `tooth-map.json`, `procedures.json` | ISO 3950 tooth chart and procedure history |
| `medications/` | `current.json`, `history.json` | Four independent arrays: medications, supplements, topical treatments, and protocols. Completed courses go in `history.json` |
| `mental/` | `journal.jsonl`, `patterns.md` | Well-being journal and identified patterns |
| `goals/` | `<year>.json` | Health areas, milestones, and cost estimates |
| `costs/` | `<year>.jsonl` | Expenses: one expense per line |
| `traction/` | `reviews.jsonl` | Progress snapshots by health area |
| `consilium/` | `_sessions.json`, `YYYY-MM-DD_[scope].md` | AI consilium index and reports |
| `specialists/` | `marker-ownership.json`, `cross-specialty-map.json` | **System knowledge, not your data.** Marker ownership and relationships between specialties. Bundled and tracked in Git |
| `history/` | — | Directory for digitizing old documents |

`labs/_marker-aliases.json` is also system knowledge: canonical marker names, synonyms, and unit conversion factors. It is bundled with the project.

### Service files

A name starting with an underscore denotes a service file rather than a record:

- `_index.json` — lab and visit indexes
- `_marker-aliases.json`, `_sessions.json` — reference registry and session log
- `_analysis.reference.json`, `_visit.reference.md` — single-entry templates for a test panel and visit note

The underscore is functional: indexes and invariants count directory entries, excluding service files.

---

## Formats that empty templates do not illustrate

`*.example.jsonl` files are empty: that is how an append-only journal begins. See the corresponding `*.demo.jsonl` or the examples below for each line's schema.

**`mental/journal.jsonl`** — one well-being entry:

```json
{"ts":"2026-07-10T22:10:00+03:00","mood":7,"energy":6,"stress":4,"sleep_quality":7,"notes":"","tags":[]}
```

`ts` includes a time zone, not just a date: there may be several entries per day. Scores range from 1 to 10; for `stress`, 10 means maximum stress.

**`costs/<year>.jsonl`** — one expense:

```json
{"ts":"2026-06-18","kr":"KR5.0","type":"lab","description":"","payment":"private","cost_rub":2400,"clinic":"","visit_ref":null}
```

`payment` is `oms` (public insurance, with `cost_rub` = 0) or `private`. `kr` comes from `goals/<year>.json`; if the expense fits no health area, use `null` rather than inventing a KR.

**`traction/reviews.jsonl`** — a progress snapshot, one line per review. See `reviews.demo.jsonl` for the structure.

**`body-metrics.csv`** — eleven columns. A missing value is an empty field between commas, not `null` or a dash. Notes containing a comma must be enclosed in double quotes:

```csv
2026-06-18,78.6,178,24.8,,,118,76,62,,"Morning, fasting"
```

Without quotes, the row is parsed as twelve fields and breaks parsing of the entire file.

---

## Why the contents are not version-controlled

The root `.gitignore` ignores all of `Data/**` and lists exceptions for the directory structure, templates, and system knowledge. This intentionally reverses the usual approach: hide everything and expose a few known files. A mistake then keeps a file out of Git instead of sending a medical record to a public repository.

Practical consequences:

- Working filenames (`profile.json`, `2026-06-18_cbc.json`, `patterns.md`) stay out of Git.
- The `.example` and `.demo` suffixes are **only for templates**. Do not use them for your own files: those files would be included in a commit.
- `.gitkeep` preserves each subdirectory because Git does not store empty directories.
- PDFs, DICOM files, and images are ignored by a separate rule: they contain raw protected health information (PHI), which survives deletion from the working directory if committed.

Before committing, check that nothing unintended is included:

```bash
git status --short
git check-ignore -v Data/profile.json    # should show the Data/** rule
```

---

## Where the schemas are defined

The single source of truth is **`.claude/shared/data-schemas.md`**. It lists each file's fields, types, required values, enums, duplicate keys, and invariants. Templates in this directory are derived from it.

If a template conflicts with that document, the document takes precedence. If the document conflicts with actual data on disk, the disk takes precedence and the document needs updating.

Related documents:

- `.claude/shared/critical-values.md` — critical-value thresholds checked before saving
- `.claude/shared/holistic-framework.md` — files every AI specialist must read
- `Dashboard/SPEC.md` — how the dashboard reads these files

### Invariants

Check these on every write. `.claude/shared/data-schemas.md` uses shorter versions assuming a directory containing only working files. Here templates live alongside them, so `.example.*`, `.demo.*`, and dotfiles are explicitly excluded from counts:

```bash
# The number of lab files equals the number of index entries
[ "$(ls Data/labs/*.json | grep -v '/_' | grep -vc '\.\(demo\|example\)\.')" \
  = "$(jq '.analyses|length' Data/labs/_index.json)" ] && echo "labs OK"

# The number of visits equals the index total
[ "$(ls Data/doctors/visits/ | grep -v '^[._]' | grep -vc '\.\(demo\|example\)\.')" \
  = "$(jq '.total' Data/doctors/visits/_index.json)" ] && echo "visits OK"

# The sum of tooth-chart status counters equals the number of known teeth
jq '([.summary | to_entries[] | select(.key != "total") | .value] | add) == (.teeth | length)' Data/dental/tooth-map.json

# Expenses agree with goals
[ "$(jq -s 'map(.cost_rub)|add' Data/costs/2026.jsonl)" \
  = "$(jq '.cost_summary.total_actual_rub' Data/goals/2026.json)" ] && echo "costs OK"
```

If you delete `.example.*` and `.demo.*` files after setup, the shorter forms in `data-schemas.md` also work.

Checking CSV width with `awk -F','` produces false positives for rows with quoted commas; validate such files with a proper CSV parser.

---

⚕️ Information in this directory is for reference only. Demo data is synthetic and is not a clinical example. Consult a doctor for treatment decisions.
