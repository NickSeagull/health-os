# Health-OS data schemas

> The only source of truth for the file structure in `Data/`.
> Mandatory document for the skills `/labs`, `/inbox`, `/doctor`, `/dental`, `/vaccines`, `/body`, `/mental`, `/meds`, `/goals`, `/lab-order`, `/status`, `/traction`.

---

## Why this document

Each skill kept its own copy of the schema, and all copies diverged from what was actually on disk. A skill following its own documentation failed to find data when reading and created an incompatible file when writing.

**Rule:** the schema is described once here. The skill refers to this file and does not rewrite the schema itself. If there is a discrepancy between the skill and this document, the document is correct; if there is a discrepancy between the document and the actual data on disk, the document must be updated.

The schemas below describe the formats that the system reads and writes. If there is a discrepancy between the document and the actual files on disk, the document must be updated to match the disk.

---

## Block 0. General recording rules

Applies to all files unless otherwise explicitly stated below.

### Dates

- Format - ISO 8601: `YYYY-MM-DD`. Timestamp - `YYYY-MM-DDTHH:MM:SS+03:00` (Moscow).
- **The date is not from the future.** If the parsed date is later than today’s, do not write it down, ask the user. Exception: planned fields (`next_visit`, `deadline`, revaccination date) - they should be in the future.
- **Unknown date** is `null`, not fictitious and not today. In `procedures.json`, the four entries with `date: null` are a valid condition, not an error.
- **Period instead of date** is only allowed in the visit file name: `2005-2012_cardio_childhood_hypertension.md`. The `date` field of the index contains the same period line - `"2005-2012"`. Sorting by such a field is performed by the first four characters.
- **Approximate date**—write down the most probable one and mark it in `notes`: “approximate date.”

### Field `version`

- Present in every JSON file and **preserved when overwritten**. Never delete or reset.
- Current values: `1` almost everywhere, `2` - for `Data/goals/YYYY.json`.
- Increase `version` only with a conscious migration of the structure, with the update of this document.

### Write to an array, not to the root

Almost all data files are wrapped with `{version, <array>}`. A new entry is added **to the array**, an object is not created at the root of the file. The error “put the procedure at the root instead of `procedures[]`” makes the record invisible to all reads.

Table “where to put it”:

| File | Array for new entry |
|------|-------------------------|
| `Data/labs/_index.json` | `analyses[]` |
| `Data/doctors/contacts.json` | `doctors[]` |
| `Data/doctors/visits/_index.json` | `visits[]` |
| `Data/dental/procedures.json` | `procedures[]` |
| `Data/vaccinations.json` | `vaccinations[]` or `tuberculin_tests[]` |
| `Data/medications/current.json` | `medications[]`, `supplements[]`, `topical[]` or `protocols[]` - see Unit 11 |
| `Data/hypotheses.json` | `hypotheses[]` |
| `Data/goals/YYYY.json` | `directions[]`, inside - `milestones[]` |

`Data/body-metrics.csv`, `Data/mental/journal.jsonl`, `Data/costs/YYYY.jsonl` - append-only, the line is appended to the end.

### Duplicate check

Before recording, check to see if there is already such a record. Duplicate key:

| File | Duplicate Key |
|------|----------------|
| Analysis | `date` + `type` |
| Visit | `date` + `specialty` |
| Vaccination | `date` + `vaccine` |
| Procedure | `date` + `type` + `teeth` |
| Metrics string | `date` |
| Consumption | `ts` + `type` + `description` |
| Doctor | `name` + `specialty` |

If a duplicate is found, do not write silently. Show the existing entry and ask whether to add to it, replace it, or cancel.

### Existing file with the same name

Names like `YYYY-MM-DD_[type].json` are not unique in themselves - for 2022-02-26 there are six files in `Data/labs/`, for 2026-03-15 - four.

Order for name collision:

1. Read an existing file.
2. If this is the same analysis, offer to supplement it, rather than create a second one.
3. If the analysis is different, clarify `[type]` so that the name becomes distinguishable: `2022-02-26_cbc.json` and `2022-02-26_biochemistry.json`, and not `..._1` and `..._2`.
4. Numeric suffix is a last resort, and only with an explanation in `notes`.

**Silently overwriting an existing file is prohibited.**

### Paths

- All data paths start with `Data/` - CLAUDE.md rule.
- The only exception is `pdf_path` inside analysis files: it is relative to `Data/labs/` (see Block 1). When outputting to the user, expand to full: `Data/labs/pdfs/...`.
- Links to files in the text - wikilinks: `[[Data/doctors/contacts]]`.

### Units of measurement

There are already conflicts in the data: testosterone is recorded in both ng/ml and nmol/l; cortisol - in mcg/dl and nmol/l; ferritin - in mcg/l and ng/ml; TSH - in mIU/l and µIU/ml.

- The unit is **always** written along with the value, the `unit` field is not omitted.
- **A trend for a marker with different units is not built** without explicit recalculation. The recalculated points are marked.
- The reference is the one indicated in the form of a specific laboratory, and not the “generally accepted” one.

### Plausibility of value

A simple check before recording so that the typo does not become part of the trend: weight 8.25 instead of 82.5, hemoglobin 15.8 instead of 158. If the value goes beyond rough physiological limits, ask again and do not write it down.

Separately: thresholds from `.claude/shared/critical-values.md` are checked **before** saving. A critical value stops processing.

---

## Block 1. `Data/labs/*.json` - laboratory results

**Three schemes coexist.** This is a cumulative effect: the format changed over time, old files were not rewritten. You need to read all three.

### Reading Rule (required)

Markers are always collected by combining all three sources:

```
markers[] + panels[].markers[] + studies[].markers[]
```

Reading one variant loses part of the history: flat `markers[]` prevails in old files, `panels[]` in new ones. Markers are collected by combining all three sources.

jq expression for collecting all markers of one file:

```bash
jq '[(.markers // []), ([(.panels // [])[].markers // []] | add // []), ([(.studies // [])[].markers // []] | add // [])] | add' file.json
```

### Recording rule

**Canon for new entries is v2 (`panels[]`).** Existing v1 and v3 files are not migrated or overwritten.

### v1 - flat `markers[]` (early format)

```json
{
 "version": 1,
 "date": "2025-02-17",
 "type": "CBC + iron + vitamins",
 "lab": "Hemotest",
 "source": "historical_scan",
 "scanned_date": "2026-03-11",
 "original_file": "Lab results.pdf",
 "summary": "Complete blood count is generally normal. Two deviations in the leukocyte differential...",
 "markers": [
  {
   "name": "Hemoglobin",
   "value": 158,
   "unit": "g/L",
   "reference_min": 132,
   "reference_max": 172,
   "status": "normal"
  }
 ]
}
```

Sample: `Data/labs/2025-02-17_cbc-iron-vitamins.json`.

| Field | Type | Obligation | Comment |
|------|-----|-------|-------------|
| `version` | number | yes | `1` |
| `date` | string | yes | collection date |
| `type` | string | yes | free text |
| `lab` | string | yes | in v1 the field is called `lab`, **not** `laboratory` |
| `source` | string | no | `historical_scan` (37), `historical_photo` (7), `emias_protocol` (5) |
| `scanned_date` | string | no | when digitized |
| `original_file` | string | no | name of the source file **before** transfer to Archive - historically not resolved, see Block 14 |
| `original_files` | string[] | no | instead of `original_file`, when there are several sources |
| `summary` | string \| null | no | **string** of connected text, not an object |
| `notes` | string | no | |
| `markers` | object[] | yes | see "Marker" below |

### v2 - `panels[]` (4 files, 2026-03-15) - canon for recording

```json
{
 "version": 1,
 "date": "2026-03-15",
 "analysis_date": "2026-03-16",
 "type": "cbc+thyroid+vitamins",
 "laboratory": "Hemotest (full legal name and branch address, as shown on the report)",
 "order_number": "0000000",
 "pdf_path": "pdfs/2026-03-15_full-report.pdf",
 "summary": { "total": 28, "normal": 26, "low": 1, "high": 1, "critical": 0 },
 "notes": "Second batch of results",
 "panels": [
  {
   "panel": null,
   "markers": [
    {
     "name": "Hemoglobin",
     "value": 154,
     "unit": "g/L",
     "reference_min": 132,
     "reference_max": 172,
     "status": "normal",
     "flag": null
    }
   ]
  }
 ],
 "deviations": ["Vitamin B12 elevated: 720 pg/mL (reference 191–663)"],
 "recommendations": ["B12 is elevated — discuss with a hematologist"]
}
```

Sample: `Data/labs/2026-03-15_cbc-thyroid-vitamins.json`.

| Field | Type | Obligation | Comment |
|------|-----|-------|-------------|
| `date` | string | yes | collection date |
| `analysis_date` | string | no | date of readiness of the result |
| `type` | string | yes | in v2 - Latin using `+`: `cbc+thyroid+vitamins` |
| `laboratory` | string | yes | in v2 the field is called `laboratory`, **not** `lab` |
| `order_number` | string | no | laboratory order number |
| `pdf_path` | string \| null | no | **base - `Data/labs/`**, that is, `pdfs/x.pdf` → `Data/labs/pdfs/x.pdf` |
| `summary` | object | no | in v2 - counter object `{total, normal, low, high, critical}` |
| `panels` | object[] | yes | element: `{panel: string\|null, markers: []}`. `panel` in all four files `null` - panel without name is allowed |
| `deviations` | string[] | no | human-readable wording of deviations |
| `recommendations` | string[] | no | |
| `notes` | string | no | |

> **Attention to `summary`.** The field type depends on the schema: string in v1, object in v2, sometimes `null` in files. When reading, check the type, when writing to v2 - the counter object, when adding a file to v1 - leave it as a string.

### v3 — `studies[]` (2 files, urology 2022)

For documents where the results are grouped according to studies with different materials and different performers.

```json
{
 "version": 1,
 "date": "2022-07-11",
 "result_date": "2022-07-14",
 "type": "urology",
 "subtype": "comprehensive examination (PCR, biochemistry, hormones, CBC, urinalysis)",
 "lab": "Central Research Institute of Epidemiology",
 "lpu": "MedExpert Plus LLC",
 "doctor": "Petr Petrov",
 "order": "DUM2723090",
 "source": "historical_scan",
 "scanned_date": "2026-03-11",
 "original_file": "DUM2723090.pdf",
 "summary": "Comprehensive urological examination…",
 "studies": [
  {
   "name": "PCR, urogenital infections",
   "material": "Urethral swab/discharge",
   "doctor": "N. Khromova",
   "markers": [
    { "name": "Chlamydia trachomatis DNA", "value": "Not detected", "status": "normal" }
   ]
  }
 ]
}
```

Sample: `Data/labs/2022-07-11_urology_comprehensive.json`. New files are not created in this scheme - if the document structure is similar, use v2, where `panel` = name of the study.

### Marker

A single object for all three schemes. Five actual keyset options:

The dashboard's canonical marker labels are: `Hemoglobin`, `White blood cells`, `Platelets`, `ESR`, `Glucose`, `Creatinine`, `ALT`, `AST`, `Total cholesterol`, `LDL`, `HDL`, `Triglycerides`, `TSH`, `Free T4`, `Total testosterone`, `Cortisol`, `Vitamin D`, `Vitamin B12`, `Ferritin`, and `Iron`.

The shared registry contains every UI canonical label and may include additional analytes. Identity-only entries omit unit metadata; preserve source laboratory units and verify them before comparison.

| Option | Keys | Meets |
|---------|-------|-------------|
| basic | `name, value, unit, reference_min, reference_max, status` | 307 |
| with flag | + `flag` | 54 (v2 only) |
| with note | + `note` | 22 |
| quality | `name, value_text, unit, reference_text, status` | 4 |
| with interpretation | + `interpretation` | 2 |

| Field | Type | Obligation | Comment |
|------|-----|-------|-------------|
| `name` | string | yes | as in the laboratory form |
| `value` | number\| string | yes | string for quality results: `"Not detected"`, `"C/T"` |
| `value_text` | string | no | instead of `value`, when the result is verbal and the reference is also verbal |
| `unit` | string | yes | do not omit even if the result is dimensionless - then `""` |
| `reference_min` / `reference_max` | number\| null | no | `null` if one-way reference |
| `reference_text` | string | no | verbal reference: `"Not detected"` |
| `status` | string | yes | enum - see below |
| `flag` | null | no | in v2 always `null`; fields lack meaning, do not enter new values ​​|
| `note` | string | no | explanation for a specific marker |
| `interpretation` | string | no | interpretation of the result from the form |

### Enum marker statuses

`normal` · `low` · `high` · `critical` · `variant` · `detected` · `deviation`

| Status | When | In data |
|--------|-------|----------|
| `normal` | in reference | 403 |
| `low` | below `reference_min` | 13 |
| `high` | above `reference_max` | 49 |
| `critical` | threshold from `critical-values.md` triggered | 0 - but the status is required |
| `variant` | genetic polymorphism: `C/T` | 1 |
| `detected` | qualitative test is positive where the norm is “not detected” | 2 |
| `deviation` | qualitative deviation without numerical reference: “moderate lecithin grains” | 3 |

Do not enter other values.

### File name

`Data/labs/YYYY-MM-DD_[type].json`, `[type]` - Latin, kebab-case.

Actually occurring `[type]` (in descending frequency): `inbody`, `cbc`, `biochemistry`, `hormones`, `comprehensive`, `covid-pcr`, `hiv`, `infection`, `serology`, `genetics`, `crp`, `aso`, `glucose`, `lipids`, `urinalysis`, `insulin`, `cortisol`, `acth`, `creatinine`, `urea`, `uric-acid`, `sodium`, `potassium`, `gfr`, `total-protein`, `microalbumin`, `vitamins`, `stool-analysis`, `protein-fractions`, `testosterone-vitd`, `rheumatoid-factor`, `hbsag`, `h-pylori-breath-test`, `covid-antibodies`, `covid-antigen`, `urology_comprehensive`, `urology_prostate-culture`.

Composite type - separated by a hyphen: `cbc-iron-vitamins`, `cbc-ast`, `biochemistry-hormones`, `cbc-thyroid-vitamins`.

---

## Block 2. `Data/labs/_index.json` - analysis index

```json
{
 "version": 1,
 "analyses": [
  {
   "date": "2026-03-15",
   "file": "2026-03-15_cbc-thyroid-vitamins.json",
   "type": "CBC + thyroid + vitamins + ferritin",
   "lab": "Hemotest",
   "markers_count": 28,
   "flags": ["Vitamin B12 high", "Segmented neutrophils % low"],
   "notes": "Second batch. Lymphocytes 47.4% / 3.33 absolute — formally normal"
  }
 ]
}
```

| Field | Type | Obligation | Comment |
|------|-----|-------|-------------|
| `date` | string | yes | matches `date` file |
| `file` | string | yes | **file name without path**, database - `Data/labs/` |
| `type` | string | yes | human readable name; there is more detail in the index than in the file itself |
| `lab` | string | yes | lab short name: `Hemotest`, `Invitro` |
| `markers_count` | number | no | total for all three sources of markers; missing from 2 entries |
| `flags` | string[] | no | lines like `"Marker status"` - only deviations; empty array if there are no deviations |
| `notes` | string | no | short conclusion; 4 entries have |

There are **no** top-level `generated` and `total` here, unlike `visits/_index.json`.

### Service files in `Data/labs/`

Files whose names begin with an underscore are **service, not analysis**, and are not included in the index:

| File | Destination |
|------|------------|
| `_index.json` | analysis index (this block) |
| `_marker-aliases.json` | dictionary of canonical marker names, synonyms and unit conversion factors |

**Invariant:** the number of entries in `analyses[]` is equal to the number of `*.json` in `Data/labs/` that do not begin with an underscore. Now it's 60/60. Check:

```bash
[ "$(ls Data/labs/*.json | grep -vc '/_')" = "$(jq '.analyses|length' Data/labs/_index.json)" ] && echo OK
```

Sorting is by `date` ascending.

---

## Block 3. `Data/labs/*_inbody.json` - body composition

Separate scheme, seven files, `type: "body_composition"`. Indexed in `labs/_index.json` with `type: "Body composition (InBody270)"`.

**Record owner is `/inbox` (import) and `/labs` (manual entry). `/body` reads only.** Duplicating these values ​​in `body-metrics.csv` is acceptable for a summary trend, but the CSV row is marked in `notes`: `InBody270. Score 80/100. Visceral fat 5. WHR 0.84`.

```json
{
 "version": 1,
 "date": "2025-10-31",
 "type": "body_composition",
 "device": "InBody270",
 "device_id": "0000000000",
 "subject": { "height_cm": 191, "age": 23, "sex": "male" },
 "composition": {
  "total_body_water_l": 50.6,
  "protein_kg": 13.6,
  "minerals_kg": 5.03,
  "body_fat_mass_kg": 13.0,
  "weight_kg": 82.2
 },
 "metrics": {
  "skeletal_muscle_mass_kg": 39.1,
  "bmi": 22.5,
  "body_fat_pct": 15.8,
  "inbody_score": 80,
  "visceral_fat_level": 5,
  "waist_hip_ratio": 0.84,
  "basal_metabolic_rate_kcal": 1864,
  "fat_free_mass_kg": 69.2,
  "degree_of_obesity_pct": 102,
  "icm_kg_m2": 8.4
 },
 "weight_control": {
  "ideal_weight_kg": 81.4,
  "weight_control_kg": -0.8,
  "fat_control_kg": -0.8,
  "muscle_control_kg": 0.0
 },
 "segmental_lean_mass": {
  "right_arm_kg": 3.72, "right_arm_pct": 96.7,
  "left_arm_kg": 3.76, "left_arm_pct": 97.8,
  "trunk_kg": 29.2, "trunk_pct": 95.3,
  "right_leg_kg": 11.56, "right_leg_pct": 108.2,
  "left_leg_kg": 11.48, "left_leg_pct": 107.5
 },
 "segmental_fat_mass": { "…": "same structure as segmental_lean_mass" },
 "recommended_calories_kcal": 3038
}
```

Sample: `Data/labs/2025-10-31_inbody.json`. `notes` - optional (5 out of 7 have it). InBody has no markers in the sense of Block 1 - `markers_count` is not in the index.

Correspondence between InBody fields and `body-metrics.csv` columns: `composition.weight_kg` → `weight_kg`, `subject.height_cm` → `height_cm`, `metrics.bmi` → `bmi`, `metrics.body_fat_pct` → `body_fat_pct`, `metrics.skeletal_muscle_mass_kg` → `muscle_mass_kg`.

---

## Block 4. `Data/doctors/contacts.json` - doctors

```json
{
 "version": 1,
 "doctors": [
  {
 "name": "Ivanov Ivan Ivanovich",
 "specialty": "orthopedic traumatologist, MD",
 "clinic": "City Rehabilitation Center, 1 Example Street",
   "phone": "+7 (900) 000-00-00",
   "period": "2010",
   "status": "historical"
  }
 ]
}
```

| Field | Type | Obligation | Comment |
|------|-----|-------|-------------|
| `name` | string | yes | Full name as in the document |
| `specialty` | string | yes | free text, with a degree if available |
| `clinic` | string | yes | name and address |
| `phone` | string | no | 2 out of 7 have it |
| `period` | string | yes | year or range: `"2010"`, `"2001-2003"` |
| `status` | string | yes | all seven have `historical`. For an active doctor - `active` |

### Doctor Identification - Composite Key

**The `id` field is not in the data** for any of the seven doctors. The `doc_XX` link is not resolved anywhere.

**Solution: doctor identifier - pair `name + specialty`.** Does not require data migration.

- Skills refer to the doctor by this pair, and not by `id`.
- The `doctor_id` field is found in `Data/dental/procedures.json` and `Data/medications/current.json` - everywhere `null`. It is **not filled in**. If it is necessary to associate a record with a doctor, a pair of fields `doctor` (full name string) and, if necessary, `specialty` are used - as has already been done in `visits/_index.json` and in JSON visits.
- There is no field `last_visit` in `contacts.json` and there is no need to create it: the last visit is calculated from `Data/doctors/visits/_index.json` - the maximum `date` among records with this `doctor`.

The file `Data/doctors/_index.json` **does not exist**. The role of the directory is performed by `contacts.json`, the role of the visit index is `visits/_index.json`.

---

## Block 5. `Data/doctors/visits/` - visits

### `_index.json`

```json
{
 "version": 1,
 "generated": "2026-03-14",
 "total": 65,
 "visits": [
  {
   "date": "2010-06-10",
   "file": "2010-06-10_orthopedist.json",
   "format": "json",
   "specialty": "orthopedic traumatologist",
   "doctor": "Ivanov Ivan Ivanovich, MD",
   "clinic": "City Rehabilitation Center LLC, 1 Example Street",
   "brief": "Orthopedist consultation: scoliosis, cervicogenic headache, flat feet; prescribed therapeutic exercise, massage, and physical therapy"
  }
 ]
}
```

All 65 records have exactly the set `date, file, format, specialty, doctor, clinic, brief` - all seven are required. `doctor` may be `null` (the doctor is not specified in the document), but the key is present.

| Field | Type | Comment |
|------|-----|-------------|
| `date` | string | ISO date or period `"2005-2012"` |
| `file` | string | file name without path, base - `Data/doctors/visits/` |
| `format` | string | `md` (61) or `json` (4) - must match the extension `file` |
| `specialty` | string | free text; compound allowed: `"cardiology / neurology"` |
| `doctor` | string \| null | Full name; it is allowed to list several |
| `clinic` | string | |
| `brief` | string | one sentence about the essence of the visit |

Top-level `generated` (index rebuild date) and `total` are **required**, `total` is equal to the length of `visits[]`. Now 65/65.

### File naming convention

`YYYY-MM-DD_[specialty][_type].(md|json)`

- `[specialty]` - Latin, kebab-case: `cardio`, `neuro`, `therapist`, `urology`, `ent`, `gastro`, `dermatology`, `endocrinology`, `ophthalmologist`, `orthopedist`, `nephrology`, `coloproctology`, `physiotherapy`.
- `[_type]` - optional, document type: `consultation`, `ecg`, `echokg`, `smad`, `holter`, `eeg`, `mri-brain`, `ct-brain`, `xray-cervical`, `xray_sinuses`, `duplex-bca`, `ultrasound_thyroid`, `ultrasound_abdominal`, `fgds`, `preexam`, `summary`.
- **Both extensions are legitimate.** `.md` - for eye-readable protocols and linked wikilinks (61 files). `.json` - for structured imports. The “visits only in Markdown” rule **cancelled** - the `format` field in the index exists precisely because there are two formats. New visits are to `.md`, unless there is a reason to do otherwise.
- **Unknown date:** if only the year is known - `YYYY_[specialty].md`; if the period is known - `YYYY-YYYY_[specialty]_[description].md` (sample: `2005-2012_cardio_childhood_hypertension.md`). Do not invent a date or substitute today’s date. The index contains the same string as in the file name.

### JSON visit schema

```json
{
 "version": 1,
 "date": "2014-03-20",
 "type": "consultation",
 "specialty": "otolaryngologist",
 "doctor": null,
 "clinic": "City Polyclinic No. 1",
 "card_number": "000000",
 "reason": "frequent sore throats",
 "findings": ["Hyperemia of the posterior pharyngeal wall"],
 "diagnosis": ["Chronic compensated tonsillitis"],
 "prescriptions": [
  { "drug": "Imudon", "dose": "1 tablet six times daily, dissolve in the mouth", "duration": "20 days" }
 ],
 "follow_up": null,
 "source": "Inbox/IMG_2392-2393 (Cache/inbox-batches/batch-11.md)"
}
```

`card_number` - optional. `findings` and `diagnosis` are arrays of strings. `prescriptions[]` - objects with mandatory `drug`, optional `dose` and `duration`.

### Structure of a Markdown visit

Title, then list metadata, then sections. The actual sample is `Data/doctors/visits/2021-08-14_cardio_consultation.md`:

```markdown
# Cardiologist's findings - August 2021

## Initial appointment - 2021-08-14

- **Date:** 2021-08-14
- **Doctor:** Sidorov Sergey Sergeevich
- **Clinic:** LLC “Treatment and Diagnostic Center”
- **Card number:** 000000
- **Visit type:** initial

### Clinical diagnosis
### Examination plan
### Prescriptions
### Recommendations
```

One file can contain several appointments of one specialist for close dates - then each appointment is a separate section of the second level.

### `Data/doctors/prep/` — preparation for an appointment

**Actual convention: `Data/doctors/prep/[specialty].md` - no date.** On disk `hematologist.md` and `neurologist.md`.

Reason: the preparation file is a working document for the next visit, and not an archival record. The previous convention with a date has been rejected by practice.

**Rewrite rule:** when preparing again for the same specialist, the file is **rewritten** entirely, with current data. There is no need to save the previous version - the visit history remains in `visits/`. Before overwriting, inform the user that the previous preparation will be replaced.

`[specialty]` - in Latin, kebab-case, matches the name of the specialist agent from `.claude/agents/` where one exists.

---

## Block 6. `Data/dental/tooth-map.json` - teeth map

```json
{
 "version": 1,
 "dentist_id": "",
 "next_visit": null,
 "teeth": {
  "16": { "status": "extracted", "notes": "Extracted during the first course of braces" },
  "26": { "status": "extracted", "notes": "Extracted during the first course of braces" }
 },
 "summary": {
  "total": 32, "healthy": 0, "filled": 0, "crowned": 0,
  "implant": 0, "extracted": 2, "needs_treatment": 0, "root_canal": 0
 },
 "imaging": [
  {
   "type": "CBCT (cone-beam CT)",
   "date": "2023-09-29",
   "format": "DICOM",
   "files": 478,
   "size_mb": 607,
   "location": "Archive/processed/dental/YYYY-MM-DD_ct_jaws_dicom",
   "viewer": "SimpleViewerLite (Windows)",
   "notes": "FOV 10x8.5"
  }
 ],
 "notes": "Braces twice. One tooth needs a crown…"
}
```

| Field | Type | Obligation | Comment |
|------|-----|-------|-------------|
| `dentist_id` | string | no | empty string, legacy. **Do not fill in** - identification of the doctor by pair `name + specialty`, Block 4 |
| `next_visit` | string \| null | yes | ISO date of planned visit |
| `teeth` | object | yes | **sparse** - keys only for teeth with non-empty status |
| `summary` | object | yes | eight counters, formula below |
| `imaging` | object[] | no | snapshots: `type, date, format, files, size_mb, location, viewer, notes` |
| `notes` | string | no | free text about the status |

### `teeth` sparse

The key is the tooth number in a line according to ISO 3950 (FDI). The **only** teeth with known abnormal status are present: currently `16` and `26`. The absence of a key means **"status unknown"**, not "healthy".

When rendering the map, a tooth without a key is shown as `❔` (unknown), not as `✅`. Eights (18, 28, 38, 48) have been removed - this is fixed in `notes`, but not in `teeth`; When updating the card for the first time, they should be entered explicitly with the status `extracted`.

Tooth statuses: `healthy` · `filled` · `crowned` · `implant` · `extracted` · `needs_treatment` · `root_canal`.

### Formula `summary`

```
summary.total = 32 — constant, the number of positions in the dental formula
summary.<status> = number of keys in teeth with value status == <status>
summary.healthy = number of keys with healthy status (NOT 32 minus the rest)
```

Invariant: the sum of all status counters is equal to `len(teeth)`, and **not** `total`. Now `extracted: 2` with `len(teeth) == 2` is correct. Difference `total − Σ statuses` = number of teeth with unknown status; display it in a separate line: “Status unknown: 30.”

Recalculation is performed after each change to `teeth`.

---

## Block 7. `Data/dental/procedures.json` - procedures

```json
{
 "version": 1,
 "procedures": [
  {
   "date": null,
   "teeth": ["16", "26"],
   "type": "extraction",
   "description": "Removal of two sixes during the first orthodontic treatment",
   "doctor_id": null,
   "notes": "Unsuccessful treatment — gaps developed"
  }
 ]
}
```

| Field | Type | Obligation | Comment |
|------|-----|-------|-------------|
| `date` | string \| null | yes | `null` is acceptable - the date is unknown, so all four records have |
| `teeth` | string[] | yes | FDI numbers in strings; empty array if the procedure is not tied to teeth (braces) |
| `type` | string | yes | enum below |
| `description` | string | yes | what exactly did they do |
| `doctor_id` | null | yes | the key is present, the value is `null`. **Leave blank**, see Unit 4 |
| `notes` | string | yes | empty string allowed |

**Field `type` - enum:** `filling` · `extraction` · `crown` · `implant` · `cleaning` · `root_canal` · `whitening` · `orthodontics`

`orthodontics` is used in two of the four entries - brackets. Omitting it in enum resulted in an entry with a non-existent type.

**There is no field `cost` and there is no need to create it.** Dental expenses go to `Data/costs/YYYY.jsonl` with `type: "dental"` - a single accounting with all other expenses, Block 10.

Duplicate: `date` + `type` + `teeth`.

---

## Block 8. `Data/vaccinations.json` - vaccinations

```json
{
 "version": 1,
 "vaccinations": [
  {
   "date": "2021-10-08",
   "vaccine": "COVID-19",
   "dose": "Stage I",
   "clinic": "City Polyclinic No. 1",
   "doctor": "I. Ivanova",
 "notes": "0.5 mL"
  }
 ],
 "tuberculin_tests": [
  { "date": "2016-04-19", "type": "Diaskintest", "result": "negative" }
 ],
 "schedule": [],
 "source": "Vaccination certificate (form 156/u-93), COVID protocols, child medical record"
}
```

### `vaccinations[]` - 31 entries

| Field | Type | Obligation | Available in data |
|------|-----|-------|---------------|
| `date` | string | yes | 31/31 |
| `vaccine` | string | yes | 31/31 - name of the vaccine or drug together: `"Flu (Sovigripp)"`, `"Meningococcal (Menactra)"` |
| `dose` | string | yes | 31/31 - free text: `"primary"`, `"booster"`, `"revaccination"`, `"seasonal"`, `"Stage I"`, `"Stage II"`, `"1"`, `"2"`, `"3"` |
| `clinic` | string | no | 3/31 |
| `notes` | string | no | 14/31 |
| `doctor` | string | no | 2/31 |

**Fields `product`, `batch`, `revaccination_date` are not in the data.** Do not enter: the drug is written inside `vaccine` in parentheses, the series was not recorded, the revaccination period is calculated and not stored (Block 8.1).

`"Unidentified"` — legitimate value of `vaccine`, when the vaccine cannot be identified from the document (2 entries); details - in `notes`.

### `tuberculin_tests[]` - 9 entries

| Field | Type | Obligation | Comment |
|------|-----|-------|-------------|
| `date` | string | yes | |
| `type` | string | yes | `"Mantoux test"` (8) or `"Diaskintest"` (1) |
| `result` | string | yes | `"negative"`, `"2 mm"`, `"illegible"` |

These are **not vaccinations**, but diagnostic tests. Do not mix in the vaccination table, show it in a separate section.

### `schedule[]` and `source`

- `schedule[]` - **empty**. Designed as a list of scheduled revaccinations with tasks in Todoist. Filled only with what the user has confirmed; The calculated deadlines are not automatically written there.
- `source` — string where the data is taken from. Required, updated when a new source is added.

### Sorting

The array in the file is **grouped by vaccine**, and not sorted by date: DTP 1–3, then polio 1–3, influenza 2006/2008/2024 in a row. Keep the order in the file as it is - reordering the array gives nothing but noisy diff.

**When outputting to the user, always sort by `date` in descending order** (newest on top). Grouping by vaccine should only be used where it is explicitly requested.

---

## Block 9. `Data/body-metrics.csv` - body metrics

Eleven columns, UTF-8, header on first line, 20 lines of data.

```csv
date,weight_kg,height_cm,bmi,body_fat_pct,muscle_mass_kg,systolic,diastolic,heart_rate,waist_cm,notes
2025-10-31,82.2,191,22.5,15.8,39.1,,,,,InBody270. Score 80/100. Visceral fat 5. WHR 0.84
2026-03-11,84,191,23.0,,,,,,,Onboarding. Weight gain (surplus since September 2025)
```

| Column | Type | Comment |
|---------|-----|-------------|
| `date` | ISO date | row key |
| `weight_kg` | number | |
| `height_cm` | number | take from `Data/profile.json` → `basic.height_cm` (191), rather than leave empty |
| `bmi` | number | `weight_kg / (height_cm/100)²`, round to one digit |
| `body_fat_pct` | number | usually only in lines from InBody |
| `muscle_mass_kg` | number | same |
| `systolic` / `diastolic` | number | pressure |
| `heart_rate` | number | pulse |
| `waist_cm` | number | |
| `notes` | string | free text |

An empty value is **empty field between commas**, not `null` or `-`.

### Escape commas

In `notes` the comma appears frequently. Rule: **if the value contains a comma, a quotation mark or a newline, wrap it in double quotes**, double the inner quotes (RFC 4180).

```csv
2026-03-21,82.5,191,22.6,,,120,80,65,,"Morning, fasting"
```

A line without escaping gives 12 fields with 11 columns and breaks parsing of the entire file.

> ⚠️ **The invariant is already broken.** Line 2 of the file contains an unquoted comma in the note and is parsed as 12 fields:
> ```
> 1990-01-01,3.7,55,,,,,,,,,Birth. Maternity hospital No. 1, city
> ```
> The fix is to wrap the note in quotes: `…,,"Birth. Maternity hospital No. 1, city"`. The values ​​do not change.

**Check after recording:** all lines have the same number of fields.

```bash
awk -F',' 'NF!=11 {print NR": "NF" fields: "$0}' Data/body-metrics.csv
```

It shouldn't output anything. Lines with quoted fields will be counted incorrectly by `awk` delimiter - they should be checked by the CSV parser, not by this command.

The order of the lines is `date` in ascending order, a new line is appended to the end.

---

## Block 10. `Data/costs/YYYY.jsonl` - expenses

Append-only JSONL, one expense per line. **The file is now empty (0 bytes) with 65 recorded visits** - no records were kept. The workflow lived only inside `/doctor`; here it is specified as the only source, and it is referenced by `/doctor`, `/dental`, `/lab-order`, `/status`, and `/traction`.

```jsonl
{"ts":"2026-03-20","kr":"KR5.5","type":"visit","description":"Hematologist — initial appointment","payment":"private","cost_rub":4500,"clinic":"Hemotest","visit_ref":"2026-03-20_hematology.md"}
{"ts":"2026-03-15","kr":"KR5.0","type":"lab","description":"CBC + thyroid gland + vitamins, 28 markers","payment":"private","cost_rub":7800,"clinic":"Hemotest","visit_ref":"2026-03-15_cbc-thyroid-vitamins.json"}
```

| Field | Type | Obligation | Comment |
|------|-----|-------|-------------|
| `ts` | string | yes | ISO spend date |
| `kr` | string \| null | yes | `KR5.X` - taken from `Data/goals/YYYY.json` → `directions[].kr` of the direction to which the spending relates. If the direction is not determined - `null`, not the fictitious KR |
| `type` | string | yes | `visit` · `lab` · `imaging` · `procedure` · `dental` · `medication` · `supplement` · `other` |
| `description` | string | yes | what exactly was paid |
| `payment` | string | yes | `oms` (free with policy) or `private` |
| `cost_rub` | number | yes | whole, rubles. For `oms` - `0` |
| `clinic` | string | yes | where paid |
| `visit_ref` | string \| null | no | visit or analysis file name without path |

### How to determine `kr`

By specialty or type of service, find in `Data/goals/YYYY.json` → `directions[]` an entry with a suitable `area`. Each direction has `kr` of the form `KR5.0`…`KR5.N`. If the waste does not fall into any of them - `kr: null`.

### What to update with the entry

1. String in `2026.jsonl`.
2. If the spending closes a milestone - `milestones[].cost_actual_rub` in `goals/YYYY.json`.
3. Recalculate `directions[].cost_actual_rub` — the sum of `cost_actual_rub` its milestones.
4. Recalculate `cost_summary.total_actual_rub` and `cost_summary.by_phase[*].actual`.

Duplicate: `ts` + `type` + `description`.

---

## Block 11. `Data/medications/current.json` - medications, dietary supplements, external, protocols

**Four independent arrays.** Array selection error is the most common one when writing from `/inbox`.

```json
{
 "version": 1,
 "medications": [],
 "supplements": [],
 "topical": [],
 "protocols": []
}
```

| Array | What do we put | Prefix `id` | Now |
|--------|-----------|--------------|--------|
| `medications[]` | prescription and over-the-counter medications by mouth | `med_NN` | 1 |
| `supplements[]` | Dietary supplements, vitamins, minerals | `sup_NN` | 5 |
| `topical[]` | external: creams, ointments, sprays, drops, gels | `top_NN` | 1 |
| `protocols[]` | multi-drug treatment regimens with stages | `prot_NN` | 0 |

`id` - incremental within its array, with leading zero: `med_01`, `sup_02`.

### `medications[]`

```json
{
 "id": "med_01",
 "name": "Next (ibuprofen + paracetamol)",
 "dosage": "standard",
 "frequency": "once a week",
 "timing": [],
 "with_food": true,
 "reason": "Headache (migraine)",
 "doctor_id": null,
 "started": null,
 "until": null,
 "side_effects": [],
 "status": "active",
 "notes": "Self-prescribed"
}
```

All thirteen keys are present. `timing[]` uses `"morning"`, `"day"`, `"evening"`, and `"night"`. `doctor_id` is always `null`; do not fill it in (Block 4). Put the prescribing doctor in `notes`. `started` / `until` are ISO dates, `null`, or an approximate form such as `"~2026-02"`.

### `supplements[]`

```json
{
 "id": "sup_01",
 "name": "Magnesium glycinate",
 "brand": "NOW",
 "dosage": "2 tablets/day",
 "frequency": "daily",
 "timing": ["day"],
 "reason": "general health, nervous system",
 "started": "~2026-02",
 "status": "active",
 "notes": "optional"
}
```

Ten keys, `notes` is optional (1 out of 5 has them). `brand` is required, `null` is allowed.

### `topical[]`

```json
{
 "id": "top_01",
 "name": "Face cream",
 "type": "cream",
 "frequency": "once every 2 weeks, during flares",
 "reason": "dermatitis/psoriasis on the face",
 "status": "as_needed"
}
```

Six keys. `type` is `cream`, `ointment`, `spray`, `drops`, `gel`, or the generic `topical` value when the form is unspecified.

### `status` - general enum

`active` · `as_needed` · `paused` · `finished`

Completed courses are transferred to `Data/medications/history.json` using the same structure.

**Rule `/inbox`:** A recipe from a document is never added silently. First, confirmation from the user, then a record - with an explicit indication of which of the four arrays we are putting in.

---

## Block 12. `Data/mental/journal.jsonl` - status log

Append-only JSONL, one record - one line.

```jsonl
{"ts":"2026-03-14T12:00:00+03:00","mood":6,"energy":5,"stress":5,"sleep_quality":8,"notes":"Persistent anxiety about the future. Chronically tired","tags":["onboarding"]}
```

| Field | Type | Obligation | Comment |
|------|-----|-------|-------------|
| `ts` | string | yes | timestamp with zone `+03:00`, not just date |
| `mood` | number | yes | 1–10 |
| `energy` | number | yes | 1–10 |
| `stress` | number | yes | 1–10, where 10 is maximum stress |
| `sleep_quality` | number | yes | 1–10 |
| `notes` | string | yes | free text, empty line allowed |
| `tags` | string[] | yes | empty array allowed |

**The `notes` field is always read for red flags** according to Block 4 of the `.claude/shared/critical-values.md` document - before any analysis of correlations. This is not an optional check.

Several records are allowed in one day - the key is `ts`, not the date.

---

## Block 13. `Data/goals/YYYY.json` and `Data/hypotheses.json`

### `goals/YYYY.json` — `version: 2`

```json
{
 "version": 2,
 "okr_ref": "O5",
 "phases": [
  { "id": "phase_1", "name": "Urgent", "period": "2026-Q1–Q2 (March–May)",
   "priority": "high", "directions": ["KR5.0", "KR5.1", "KR5.5", "KR5.3"] }
 ],
 "directions": [
  {
   "area": "General well-being",
   "kr": "KR5.0",
   "phase": "phase_1",
   "status": "investigating",
   "goal": "Find the cause of chronic fatigue",
   "last_activity": "2025-04-02",
   "cost_estimate_rub": 5000,
   "cost_actual_rub": 0,
   "milestones": [
    {
     "id": "kr5.0_m1",
     "title": "Referral from a general practitioner to a hematologist (OMS)",
     "type": "visit",
     "status": "not_started",
     "deadline": "2026-04-01",
     "oms_available": true,
     "cost_estimate_rub": 0,
     "cost_actual_rub": null,
     "todoist_task_id": "6g93Pp8PQW7hfQ35",
     "depends_on": [],
     "notes": "Primary care physician issues a referral"
    }
   ],
   "related_visits": [],
   "related_labs": ["2025-04-02_cbc-ast.json"]
  }
 ],
 "fitness_target": {
  "workouts_per_month": 12,
  "target_weight_kg": null,
  "target_body_fat_pct": null,
  "current_mode": "cutting",
  "training_type": "functional-strength",
  "training_frequency": "~8-10/month"
 },
 "cost_summary": {
  "total_estimate_rub": 50000,
  "total_actual_rub": 0,
  "by_phase": { "phase_1": { "estimate": 20000, "actual": 0 } },
  "oms_savings_estimate_rub": null
 }
}
```

All directions have the same set of eleven keys. Phases define the order of work: urgent, planned, deferred.

- `milestones[].type` — `visit` · `lab` · `procedure` · `imaging` · `decision`.
- `milestones[].status` — `not_started` · `in_progress` · `completed` · `blocked` · `cancelled`.
- `directions[].status` — `investigating` · `in_progress` · `monitoring` · `resolved` · `not_started`.
- `related_labs[]` and `related_visits[]` - **file names without path**, bases `Data/labs/` and `Data/doctors/visits/` respectively.
- `todoist_task_id` — string task ID or `null`.
- `depends_on[]` is an array of `milestones[].id` inside the same direction.
- `fitness_target.target_weight_kg` = `null` - the target is not specified. With `null` **do not invent a target weight**: show a trend without a goal and offer to set it.

**Milestone linkage** after recording an analysis or visit: find the direction for `area`/specialty, find the milestone of the desired `type` with the status not `completed`, offer to close, upon confirmation, update `status`, `last_activity`, `related_labs[]` / `related_visits[]`, `cost_actual_rub` and recalculate `cost_summary`.

### `hypotheses.json`

```json
{
 "version": 1,
 "updated": "2026-03-20",
 "context": "…",
 "primary_complaint": "…",
 "hypotheses": [
  {
   "id": "H1",
   "title": "AIT → chronic immune activation → fatigue + lymphocytosis",
   "status": "strong",
   "confidence": "high",
   "evidence_for": ["Anti-TPO 27.3 (reference <10) — confirmed autoimmune thyroiditis"],
   "evidence_against": ["Anti-TPO 27.3 — low titer"],
   "next_steps": ["Repeat anti-TPO — assess the trend"],
   "related_kr": ["KR5.5"]
  }
 ]
}
```

`id` - `H1`, `H2`, ... `status` - `strong` · `moderate` · `weak` · `refuted` · `confirmed`. `confidence` - `high` · `medium-high` · `medium` · `low`. `related_kr[]` - values ​​of `directions[].kr`.

The `updated` field is updated whenever the array changes.

---

## Block 14. Links to source documents

### Problem

`original_file` stores the name **before** transfer to Archive. `/inbox` renames the file when transferred, the backlink is not updated. Result: some of the values ​​of `original_file` are not resolved into any file in `Archive/`.

### Rule

When transferring the original to Archive, the **final path** is written in JSON:

| Field | What contains | Base |
|------|--------------|------|
| `original_file` | file name as the user gave it - for identification | no base, this is a historical label |
| `archive_path` | **actual path after transfer** | project root |

```json
{
 "original_file": "Lab results.pdf",
 "archive_path": "Archive/processed/labs/2025-02-17_lab-results.pdf"
}
```

`archive_path` is required for all new records created by `/inbox`. Existing records are not overwritten retroactively without a separate task.

### Backlinks

When moving or renaming a file, **check and update links to it in `Data/**`**. Known case: `Data/dental/tooth-map.json` → `imaging[0].location` pointed to `Inbox/dental/ct_jaws/`, while a DICOM series of 479 files lies in `Archive/processed/dental/YYYY-MM-DD_ct_jaws_dicom`.

Search for links before transferring:

```bash
grep -rl "file-name-or-path" Data/
```

### Archive Directories

`Archive/processed/` is divided into categories: `labs` (47), `visits` (31), `_duplicates` (25), `cardiology` (13), `imaging` (13), `body-composition` (7), `covid` (3), `dental` (2), `dispensary` (2), `neurology` (1), `historical` (1), `misc` (0).

`Archive/childhood/` and `Archive/past-labs/` - source codes for the “digitize history” mode, are now empty.

`Data/labs/pdfs/` is a separate repository: PDFs referenced by `pdf_path` from v2 files are **here**, not in `Archive/`. This is an exception to `/inbox` routing, it is deliberate: the laboratory report is tied to the analysis record, and not to the archive.

`Data/labs/archive/` is an empty directory with no destination. Do not use.

---

## Block 15. Invariants

They are checked for any entry into the corresponding area.

| Invariant | Check | State |
|-----------|----------|-----------|
| `labs/_index.json` is full | `ls Data/labs/*.json \| grep -vc '/_'` = `jq '.analyses\|length' Data/labs/_index.json` | 60/60 ✅ |
| `visits/_index.json` is full | number of files in `Data/doctors/visits/` minus `_index.json` = `.total` = `len(.visits)` | 65/65 ✅ |
| `visits/_index.json` agreed | `.total` == `len(.visits)`; `.format` of each element matches the extension `.file` | ✅ |
| CSV is homogeneous | `awk -F',' 'NF!=11 {print NR}' Data/body-metrics.csv` → empty | ⚠️ violated by line 2, Unit 9 |
| `tooth-map.summary` | Σ status counters == `len(teeth)`; `total` == 32 | ✅ |
| `goals.cost_summary` | `total_actual_rub` == Σ `directions[].cost_actual_rub` == Σ lines `costs/YYYY.jsonl` | ✅ (all zeros, `costs` is empty) |
| `version` saved | no JSON lost `version` field | ✅ |
| Dates not from the future | except `next_visit`, `deadline` and planned revaccination dates | ✅ |

Checking all invariants at once:

```bash
[ "$(ls Data/labs/*.json | grep -vc '/_')" = "$(jq '.analyses|length' Data/labs/_index.json)" ] && echo "labs ✅" || echo "labs ⚠️"
[ "$(ls Data/doctors/visits/ | grep -vc _index)" = "$(jq '.total' Data/doctors/visits/_index.json)" ] && echo "visits ✅" || echo "visits ⚠️"
awk -F',' 'NF!=11 {print "CSV ⚠️ line "NR}' Data/body-metrics.csv
jq '([.summary | to_entries[] | select(.key != "total") |.value] | add) == (.teeth | length)' Data/dental/tooth-map.json
```

---

⚕️ The document describes the storage structure, not the medical content of the data. Consult your doctor for treatment decisions.
