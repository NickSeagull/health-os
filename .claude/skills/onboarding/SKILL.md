---
name: onboarding
description: |
  Entry point to the health system. Discovery interview to collect medical records, current problems, doctors, medications, tests.
  Triggers: “health setup”, “health onboarding”, “collect a medical record”, “start with health”
---

# Health Onboarding - Discovery interview

> **Profile.** Before reading and writing, determine the active profile by
> `.claude/shared/profile-resolution.md`. Short path `Data/X` in this file
> means `Data/profiles/<active>/X` — never write to the literal shorthand path.
> Before recording, tell whose profile it goes to.

## Purpose

First launch of the health system. Structured discovery interview to collect all medical data and create a traction plan in health areas.

## Restart

**First thing is to determine the mode.** Read `Data/profile.json` and check the content arrays:

```
allergies[] is not empty OR chronic_conditions[] is not empty OR current_complaints[] is not empty
```

If at least one thing is true — the medical record is already populated; work in **addition mode**:
1. Read the current status of all files
2. Show filling status:
   - ✅ Completed: [list]
   - ⚠️ Partially: [list]
   - ❌ Empty: [list]
3. Offer to fill in the gaps - pointwise, in those blocks where there is no data
4. DO NOT re-do the full interview.

**`basic.full_name` is not an indicator.** It can be an empty string when the medical record is fully populated — the patient simply did not give a name to the system, which stores only their data. A gate on `full_name` would send the skill down the first-launch branch and destroy data accumulated over months.

### Prohibition of overwriting

Valid in both modes:

- **Do not overwrite existing data without explicit confirmation from the user.** Put a new value over a non-empty field only after asking “X is already written in the profile; replace it with Y?” and receiving “yes”
- Arrays (`allergies`, `chronic_conditions`, `current_complaints`, `medications`, `doctors`) are **added**, not recreated. Writing an entire array over an old one is prohibited
- Field `version` in each JSON is saved as is
- If the data contradicts each other, do not choose yourself, show both options to the user
- If you doubt whether this is the first launch or a repeat, consider it a repeat. The price of an extra question is lower than the price of a lost medical card

## First launch workflow

Conduct interviews in BLOCKS. After each block, save the data to the appropriate files.

The block timings below are approximate for understanding the scale of the conversation. Do not adjust the pace to them and do not rush the user.

### Block 1. Basic profile (~5 min)

Ask:
1. **Biological sex** - `male` / `female` / `intersex`. Ask neutrally and explain why: “Reference intervals and age-based screening recommendations depend on this.” This is more than a formality; without this information, the system cannot produce some conclusions.
2. Blood type (if you know)
3. Height and current weight
4. Allergies (drug, food, others) - for each: allergen, type, severity
5. Chronic diseases (if any) - what, since what year, status
6. Previous surgeries and hospitalizations
7. Family history - major diseases in close relatives

**About gender - three separate fields, not one:**

- `basic.sex` - biological sex. Determines references and screening
- `basic.gender_identity` - how a person identifies, if it differs from `sex` and they want to share it. **Do not ask as a separate question**: fill it only if the user raises the topic. It affects forms of address, not clinical interpretation
- `basic.hormone_therapy` - replacement therapy or hormonal contraception: type, drugs, from what year. Ask if the person mentioned it. Shifts expected values ​​of hormones, blood patterns and lipids

If the user does not want to answer about sex, write `not_specified`, do not insist, and warn that part of the analysis will be unavailable.

→ Save to `Data/profile.json` (basic, allergies, chronic_conditions, family_history)
→ Save to `Data/history.json` (operations, hospitalizations)

### Block 2. Current problems and directions (~10 min)

**Read `Data/goals/YYYY.json` → `directions[]`.** Then there are two branches.

**If the array is not empty** (a restart or previously entered directions) — follow it: for each direction, ask according to the scheme below. The list cannot be hardcoded: its composition changes, and a hardcoded list would silently miss new directions.

**If the array is empty**, this will be the case on the first installation, and this is normal. Directions are not asked from a list, but are **collected from responses**:

1. Ask an open-ended question: “What are your health concerns right now? List everything that comes to mind — then we’ll sort them into directions.”
2. Go through an indicative checklist of areas so that the person does not forget anything. Ask briefly, without pressure, skip if “does not bother”:

   general well-being and energy · sleep · Gastrointestinal tract · heart and blood pressure · hormones · kidneys and urination · nervous system and headaches · musculoskeletal system · skin · teeth · vision · ENT · mental health · reproductive health

3. From what the person names, form `directions[]` — one direction per area with a complaint. Do not create empty areas: a direction without content only clutters the goals.
4. Assign `kr` sequentially (`KR5.0`, `KR5.1`, ...), `area` - the name of the area, `status` - `not_started`.
5. Write to `Data/goals/YYYY.json`, where `YYYY` is the current year.

For each direction - one scheme:
- what worries you, when it started, did you see a doctor, diagnosis, current treatment

Adapt the wording to `area`: for “Dentistry” — “what needs treatment, have you seen a dentist, is there a plan”; for “Hormones” — “has this been checked, are there any complaints”; for “Mental Health” — use gentler wording without pressure.

If the patient is not concerned about the direction, mark it and move on, do not ask.

At the end there is an open question: “Is there anything else that worries you that didn’t make the list?” Write down a new complaint even if it does not fit in any of the directions.

→ Update `Data/profile.json` → `current_complaints[]`
→ For each complaint: `{ "area": "", "description": "", "since": "", "status": "investigating" }`

### Block 3. Doctors (~3 min)

Ask:
- Which doctors do you see?
- For everyone: full name, specialty, clinic, contact (if any)
- When was the last visit to each?

→ Save to `Data/doctors/contacts.json`

The complete scheme is `.claude/shared/data-schemas.md`. Real file format: `{version, doctors[]}` wrapper, the record is added to the `doctors[]` array, the `version` field is not touched.

```json
{
  "name": "",
  "specialty": "",
  "clinic": "",
  "period": "",
  "status": "active",
  "phone": ""
}
```

**Important:** Doctors do not have an `id` field — links are built using the composite key “name + specialty.” The fields `email` and `last_visit` are not in the schema either, so do not invent them. Acceptable statuses: `active`, `historical`, `rejected`.

### Block 4. Medicines and dietary supplements (~3 min)

Ask:
- What are you taking now? (name, dosage, frequency, time of administration)
- Who prescribed them?
- Dietary supplements/vitamins?

→ Save to `Data/medications/current.json`

The complete scheme is `.claude/shared/data-schemas.md`. There are **four arrays** in the file, and the entry is placed in the one that corresponds to:

| Array | What's there | Prefix id |
|--------|----------|-----------|
| `medications[]` | Prescription and Over-the-Counter Medicines | `med_` |
| `supplements[]` | Dietary supplements and vitamins | `sup_` |
| `topical[]` | External means: creams, ointments, drops | `top_` |
| `protocols[]` | Multicomponent treatment regimens | `prot_` |

```json
// medications[]
{ "id": "med_01", "name": "", "dosage": "", "frequency": "", "timing": ["morning"],
  "with_food": true, "reason": "", "doctor_id": null, "started": "", "until": null,
  "side_effects": [], "status": "active", "notes": "" }

// supplements[]
{ "id": "sup_01", "name": "", "brand": "", "dosage": "", "frequency": "",
  "timing": ["morning"], "reason": "", "started": "", "status": "active" }

// topical[]
{ "id": "top_01", "name": "", "type": "", "frequency": "", "reason": "", "status": "active" }
```

**Important:** `id` is incremental within its array, with leading zero to two digits. Before registering a new drug, check with `Data/profile.json` → `allergies[]` for contraindications.

### Block 5. Tests (~2 min)

Ask:
- Do you have test results on hand? (PDF, photo, paper)
- When did you last have tests done?
- What types of tests do you have?

→ DO NOT create records — make a checklist of documents for later upload
→ Output: “Put the files (PDFs, scans, photos) in the `Inbox/` directory and run `/inbox` — it will parse them and arrange them in `Data/`.”

`Inbox/` + `/inbox` is the only entry point for files. `/labs` works with already digitized results: interpretation, trends, and manual entry. Do not transfer PDFs to `/labs`.

### Block 6. Dentistry (~2 min)

Ask:
- General condition of teeth (in your own words)
- What was treated/removed/placed (crowns, implants, fillings)
- Is there a treatment plan for the dentist?
- When was the last time you visited a dentist?

→ Fill in `Data/dental/tooth-map.json` - if possible, using tooth numbers according to ISO 3950
→ Fill in `Data/dental/procedures.json` - known procedures

### Block 7. Vaccinations (~1 min)

Ask:
- What vaccinations do you remember? (COVID, flu, others)
- Is there a vaccination certificate?

→ Fill in `Data/vaccinations.json`

### Block 8. Fitness and body metrics (~2 min)

Ask:
- Current weight (if not mentioned in block 1), target weight
- Training: type, frequency, where you do it

**WHOOP** is an MCP server (`.mcp.json`), not an agent. If the server is connected, retrieve the latest metrics using its tools. If MCP is unavailable (the server is not running, authorization is missing, or the tools do not respond), do not block onboarding: record what the user reports, mark “WHOOP is not connected — recovery metrics were not collected,” and continue.

→ First entry in `Data/body-metrics.csv`
→ Update `Data/goals/YYYY.json` → fitness_target

### Block 9. Mental health (~2 min)

Ask:
- General stress level (1–10)
- Sleep quality is subjective (1–10)
- Is there anxiety or burnout?
- Do you see a psychologist?

→ First entry in `Data/mental/journal.jsonl`:
```json
{"ts":"<current date and time in ISO 8601 with offset +03:00>","mood":0,"energy":0,"stress":0,"sleep_quality":0,"notes":"onboarding — initial assessment","tags":["onboarding"]}
```

The value of `ts` is taken from the system time (`date +"%Y-%m-%dT%H:%M:%S%z"`), the numeric fields are taken from the user’s responses. Placeholders should not be written to the file: a line like `2026-XX-XXTXX:XX:XX` is invalid and breaks JSONL parsing.

### Block 9a. Reproductive health (~3 min, depends on biological sex)

The composition of questions is determined by the `basic.sex` field. The topic is sensitive: ask neutrally, without judgment; any question can be skipped. If a person does not want to answer, write it in `_needs_input[]` and move on.

Explain why you are asking: “This is the same level of context as nutrition and sleep. Without it, the system may look for rare causes when the explanation is in the available context.”

**If `sex` = `female`:**

1. Cycle: regular or not, duration, and date of last menstruation
2. Amount of blood loss: heavy menstruation or normal. **The question is required** — this is the most common cause of iron deficiency, and without it the system may look for a source in the gastrointestinal tract
3. Painful menstruation and impact on performance
4. Pregnant and history of childbirth
5. Contraception: type, from what year
6. Menopausal status, if relevant by age: hot flashes, changes cycle
7. When was the last time you had cervical cytology, HPV test, pelvic ultrasound, mammography?

**If `sex` = `male`:**

1. Urination: frequency, night rises, stream pressure
2. Have you ever had a PSA test, and when?
3. Reproductive concerns, if any

**If `sex` = `intersex` or `not_specified`:** ask which organs are present, then build the questions from that. Screening is determined by organ presence, not identity.

→ Write to `Data/profile.json` → block `reproductive`:

```json
// for female
{ "cycle_regular": null, "cycle_length_days": null, "last_period": null,
  "flow": null, "dysmenorrhea": null, "pregnancies": null, "births": null,
  "contraception": null, "menopause_status": null,
  "last_cervical_screening": null, "last_mammography": null, "_needs_input": [] }

// for male
{ "urinary_symptoms": null, "last_psa": null, "notes": null, "_needs_input": [] }
```

**Rules:**

- Heavy menstruation is not a “special characteristic” but a condition that affects iron metabolism. Record the fact without judgment
- Mark a missed screening as a blank, but do not push or intimidate
- Do not ask questions that do not follow from `sex`. A man doesn’t need a question about the menstrual cycle, and a woman doesn’t need a question about the prostate

### Block 10. Context of life and environment (~7 min)

This block is mandatory. The holistic framework (`.claude/shared/holistic-framework.md`) is built on this data and used by all 13 AI specialists and the consilium. Without it, specialists work blindly and search for rare causes when the answer is in lifestyle.

#### 10a. Habits and behavior → `Data/profile.json` → `lifestyle`

Ask:
- **Nutrition:** do you count calories, what is the current phase (deficit / maintenance / surplus), typical food intake, weight history
- **Water:** how many liters per day
- **Caffeine:** how much coffee, tea, energy drinks per day and what time is the last dose?
- **Alcohol:** how often, how much
- **Nicotine:** cigarettes, vape, hookah, chewing - what and how often
- **Sleep:** what time do you go to bed and get up on weekdays, what time on weekends, how many hours do you sleep, and at what duration do you start to feel unwell?
- **Screens and light:** screen time per day, what time do you turn off screens in the evening, how much daylight in the morning
- **Workouts:** type, frequency, where you do it
- **Work:** sphere, sedentary or not

Separately about regular sleep: an irregular sleep schedule has a stronger impact on health than a short sleep duration, so ask the actual time of falling asleep and getting up, and not the desired one.

→ Write to `Data/profile.json` → `lifestyle`: subobjects `nutrition`, `hydration`, `caffeine`, `alcohol`, `smoking`, `sleep`, `sleep_regularity`, `screen_and_light`, `exercise`, `work`
→ List everything that the user did not answer in `lifestyle._needs_input[]` with the line “field - what exactly to ask and why it is important”

#### 10b. Environment and circumstances → `Data/context/environment.json`

Ask:
- **Geography:** city, district, nearest metro, since what year you have lived here, where you lived before
- **Healthcare access:** compulsory medical insurance, voluntary medical insurance (if any - which one), willingness to travel, maximum travel time
- **Housing:** type, floor, humidifier or air purifier, dampness and mold, animals, darkness and silence in the bedroom, temperature
- **Work and workload:** remote work or office, schedule, hours at a screen, cognitive load, deadline pressure, commute
- **Circadian:** morning light, evening screens, time outside, shift schedule, jet lag
- **Stress and support:** main stressors, financial and work stress, is there anyone to lean on, significant events over the past year
- **Chronological anchors:** moves, job changes, losses, operations, long-term illnesses - with dates. Needed to correlate onset of symptoms with life events

→ Write to `Data/context/environment.json`: `location`, `healthcare_access`, `housing`, `work`, `circadian_context`, and `stress_context` (including `chronology_anchors`); update `updated`
→ Fill `climate` from `location`: latitude, daylight length, heating season, and pressure changes. This is derived from geography; do not ask for it
→ `air_and_water` — air quality, proximity to a highway, water source and hardness
→ Put blank fields in `_needs_input[]`

Both files may be partially filled — this is normal. An empty field honestly marked in `_needs_input` is better than an invented value. Do not fill in anything on the user’s behalf.

### Block 11. Goals and traction plan (~3 min)

1. Show current KR from O5 and collected data
2. Ask: “Is everything correct? What should I adjust?”
3. Set priorities: what to treat first?
4. Next actions in each direction

→ Update `Data/goals/YYYY.json` — `goal`, `next_action`, and `deadline` for each direction
→ Update `Goals/health-goals.md`
→ Create tasks in Todoist (follow-up visits, tests) — via the Todoist MCP `add-tasks`
→ Create events in Google Calendar (if there are specific dates)

## Final

After all blocks:

1. **Summary** - what is filled in, what needs to be conveyed:
   ```
   ✅ Profile is complete
   ✅ 3 doctors added
   ✅ 2 medications recorded
   ✅ Life and environmental context collected (gaps: caffeine, housing)
   ⚠️ Tests: put PDFs in Inbox/ and run /inbox
   ⚠️ Teeth: confirm the tooth numbers at your next visit
   ```

2. **Traction table** — rows for all directions from `Data/goals/YYYY.json` → `directions[]`, rather than a fixed list:
   ```
   | Direction | Status | Next step | Deadline |
   |-------------|--------|---------------|---------|
   | [area from directions[0]] | — | — | — |
   | [area from directions[1]] | — | — | — |
   | ... | | | |
   ```
   There are as many lines as there are directions in the file.

3. **About saving data.** Committing the contents of `Data/` is neither necessary nor possible: the entire directory is covered by `.gitignore`. This safeguard makes it impossible to accidentally publish your medical record, even by running `git add -A`.

   Tell the user directly, in one phrase: “The data is written to files on your disk. They are deliberately not under version control, so they cannot be accidentally published. The backup is your copy of the directory, not git.”

   If files outside `Data/` changed during onboarding — for example `MEMORY.md` — they can be committed in the usual way after showing the list with `git status --short` and asking for confirmation. Do not push: the project has no remote by design.

4. **Hand off to the ongoing work rhythm.** Onboarding is a one-time event; afterward the system runs through brief sessions. Do not end the conversation at the commit: the person has just filled out a medical record and does not know what to do tomorrow. Show the rhythm explicitly:

   ```
   The medical record is set up. From here, the system works like this:

     Start of session   /day        — what changed, what requires attention
     During a task     /labs, /doctor, /body, /mental, /inbox
     End of session    /wrap-up    — save context, update memory, make a commit

   /wrap-up is the only way not to lose what you have gained between sessions.
   It writes a log, updates the active context and commits changes to git.
   Without it, the next session will start almost from scratch.

   The next step: put test PDFs in Inbox/ and run /inbox.
   The remaining stages are in docs/ONBOARDING.md.
   ```

   If there are unfilled blocks, name them here and say that you can return at any time: `/profile` for spot editing, or repeated `/onboarding`, which will enter the addition mode and will not repeat what has been completed.

## Pause and resume

The interview is long and multi-step, interruption is a normal situation. Keep progress in `Cache/checkpoint.yml` (see `.claude/rules/active-context.md`).

**At the beginning of the interview** write down:
```yaml
active: true
task_id: "onboarding-YYYY-MM-DD"
task_title: "Health onboarding — discovery interview"
skill: "onboarding"
current_step: "block_1"
total_steps: 11
started_at: "<ISO 8601 from system time>"
last_updated: "<ISO 8601 from system time>"
context:
  blocks_done: []
  blocks_remaining: ["block_1", ..., "block_11"]
  notes: ""
```

**After each block** update `current_step`, `blocks_done`, `blocks_remaining`, `last_updated`.

**If the user asks to pause** — save the current block’s data, update the checkpoint, and tell the user where you stopped and how to continue:
```
We stopped at block N of 11 ([name]).
Continue with /onboarding — it will pick up from here.
```

**When resuming** — read `Cache/checkpoint.yml`; if `active: true` and `skill: onboarding`, start from `current_step`, not from the beginning. Do not ask questions about completed blocks.

**After block 11** - `active: false`, reset the fields.

## Rules

- Ask questions in BLOCKS, not all at once
- After each block — confirm “Is everything correct? Shall we continue?”
- If the user does not know the answer, skip it and mark it as a blank in `_needs_input[]`. Do not invent a value
- **Do not overwrite existing data without explicit confirmation** - see “Prohibition of overwriting” above
- Read lists of directions and specialists from the data (`Data/goals/YYYY.json`), do not hardcode
- Files (PDFs, scans, photos) — only through `Inbox/` + `/inbox`. Not via `/labs`
- Disclaimer when collecting data: “This data is stored locally and in git. Treatment decisions are made only with a physician.”
- Do not rush — block timings are approximate; when the user asks to pause, record progress in the checkpoint
- **Medical data does not leave the project directory** — recording PHI anywhere outside is prohibited. If external exchange is needed at all, only aggregates go outside: quantities, statuses, metrics. No medication names, diagnoses, allergens, full names, or dates of birth

**Completion criterion:** mode (first launch / addition) is determined by the content arrays of the profile; all 11 blocks have been completed or the missing ones are clearly marked; `Data/profile.json` (including `lifestyle`) and `Data/context/environment.json` are written, the empty ones are listed in `_needs_input[]`; no non-empty fields are overwritten without user confirmation; traction table covers all directions from `directions[]`; `Cache/checkpoint.yml` deactivated; the commit is made after the list of files is shown and the user agrees; the user is shown the rhythm of further work (/day → tasks → /wrap-up) and the next step is named.
