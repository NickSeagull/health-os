---
name: consilium
description: |
  AI consilium: a three-round review by multiple physician agents. Round 1 produces independent blinded assessments; round 2 requires specialists to challenge each other's conclusions; round 3 resolves disputes and synthesizes a common root cause. Unresolved disagreements are recorded in the report rather than smoothed over.
  For one specialist's opinion, use /doctor-consult. For a review of daily routine and metrics, use /coach.
  Triggers: “consilium”, “assemble the doctors”, “what do the doctors think”, “review thoroughly”, “second opinion”
---

# Consilium — AI Specialist Orchestrator

> **Profile.** Before reading or writing, resolve the active profile using
> `.claude/shared/profile-resolution.md`. The shorthand `Data/X` in this file
> means `Data/profiles/<active>/X`; never write to the literal shorthand path.
> Before writing, announce whose profile will receive the record.

## Purpose

Launch specialist medical agents in parallel for a comprehensive review of the patient's medical data. Each specialist examines the data from their own perspective, and the orchestrator synthesizes cross-specialty findings.

## Principles

1. **Use Agents, not prompts**: launch each specialist as an Agent with separate context
2. **Read-only**: specialists only read data and return analysis. They never write files
3. **Independent first round**: specialists form blinded assessments without seeing one another's conclusions. This protects against anchoring: seeing another assessment first can stop a specialist from developing their own
4. **Debate is required**: in round two, specialists receive their colleagues' opinions and must challenge them on substance. Twelve monologues do not constitute a consilium
5. **Unresolved disagreement is more valuable than false agreement**: artificial consensus is prohibited. An unresolved dispute identifies exactly which investigation is needed next
6. **The holistic framework is required**: each specialist follows `.claude/shared/holistic-framework.md`, seeks root causes, and considers lifestyle, environment, and chronology
7. **Evidence is required**: each specialist follows `.claude/shared/evidence-base.md`, labels evidence levels (A/B/C/D/⚠️), and does not fabricate references

Read the full discussion rules in `.claude/shared/consilium-protocol.md` before starting.

## Available specialists

| Agent | Specialty | Key focus |
|-------|-----------|-----------|
| `hematologist` | Hematologist | CBC, lymphocytosis, polycythemia, anemia |
| `endocrinologist` | Endocrinologist | Thyroid, RAAS, adrenal glands, sex hormones |
| `urologist` | Urologist and nephrologist | Kidneys, urinary tract, and GFR for everyone; prostate in men |
| `gynecologist` | Gynecologist | Menstrual cycle, reproductive health, menopause, screening. **Only with `sex` = `female`** |
| `gastroenterologist` | Gastroenterologist | Gastrointestinal tract, liver, fecal occult blood, nutrition |
| `neurologist` | Neurologist | Migraine, intracranial pressure, cervical spine, autonomic function |
| `cardiologist` | Cardiologist | Arrhythmias, hypertension, lipids, cardiovascular risk |
| `dermatologist` | Dermatologist | Dermatoses, autoimmune skin conditions |
| `ent` | ENT specialist | Nose, tonsils, lymph nodes, OSA |
| `orthopedist` | Orthopedist | Spine, feet, biomechanics |
| `psychiatrist` | Psychiatrist | Depression, ADHD, fatigue, sleep |
| `dentist` | Dentist | Caries, implants, periodontium |
| `ophthalmologist` | Ophthalmologist | Refraction, intraocular pressure, fundus |

## Workflow

### 1. Parse the request

Determine the consilium's scope:

- **No arguments** (`/consilium`) → full review: all specialists with relevant data
- **Named specialties** (`/consilium hemato endo`) → targeted review: only the specified specialists
- **A question** (`/consilium why am I tired?`) → automatic selection of specialists relevant to the question

Read alias mappings and the topic-based selection table from `.claude/shared/specialty-aliases.md`; do not duplicate them here.

### 2. Load data

Read in the main context to prepare the agents' prompts:

- `Data/profile.json` — patient profile
- `Data/labs/_index.json` — lab index
- `Data/medications/current.json` — current medications
- `Data/specialists/cross-specialty-map.json` — cross-specialty patterns
- `Data/hypotheses.json` — current root-cause hypotheses and supporting evidence
- `Data/context/environment.json` — geography, climate, housing, work, stress, and social environment
- `Data/profile.json` → `lifestyle` — nutrition, substances, sleep, training, and work
- `MEMORY.md` — current context

### 3. Round 1 — independent assessments

Call specialists **directly by agent name**. Do not read `.claude/agents/[name].md` and paste it into the prompt: agents are registered as subagent types and their system prompts load automatically.

**Do not share colleagues' assessments** in the first round; it is blinded.

```
Agent(
  subagent_type="neurologist",
  name="neurologist-r1",
  prompt="Analyze the patient's data. Focus question: [question]. [Additional context, if available]

In addition to the standard format, add:
### Confidence and vulnerability
- Confidence: high / medium / low
- Weakest point of my assessment: [what is easiest to challenge]
- What would change my mind: [specific result or observation]

Propose at least two competing hypotheses in your specialty and state what distinguishes them.",
  run_in_background=true
)
```

**Important:**

- Launch all agents in **one message**, in parallel, with `run_in_background=true`
- Use `name` to identify the specialist in the report
- Each agent reads its instructions, holistic framework, evidence base, and specialist contract independently; do not duplicate them in the prompt

### Panel limits

- **Maximum 8 specialists per run.** If automatic selection yields more, show the list, explain the choice, and ask for confirmation
- A full consilium of all 12 runs only at the user's explicit request
- **Filter the panel by biological sex.** Read `Data/profile.json` → `basic.sex` before assembling it. Include `gynecologist` only for `female`, or for `intersex` when the relevant organs are present. Include this specialist when a woman of reproductive age reports fatigue: menstrual blood loss is the most common cause of iron deficiency, and otherwise that hypothesis may be missed. If `sex` is unspecified, ask rather than guessing
- **`health-coach` does not participate in the consilium.** It is not a diagnostic specialist and has write access, which violates the read-only principle. Use `/coach` separately to review daily routine and metrics

### Waiting and handling failures

- Wait for all launched agents before synthesis
- **Partial success is acceptable:** synthesize the assessments received, explicitly listing nonresponding specialists and the resulting gaps
- Exclude **empty or unusable responses** from synthesis and mark them as failures
- If no specialist responds, tell the user and do not create a report

**Available agents** (`.claude/agents/`):
`hematologist`, `endocrinologist`, `urologist`, `gynecologist`, `gastroenterologist`, `neurologist`, `cardiologist`, `dermatologist`, `ent`, `orthopedist`, `psychiatrist`, `dentist`, `ophthalmologist`

### 4. Round 2 — cross-critique

Full rules: Block 3 of `.claude/shared/consilium-protocol.md`.

**Who to launch:** only specialists with a substantive disagreement:

- Two or more addressed the same marker, organ, or cross-specialty axis
- Hypotheses contradict one another or explain the same symptom differently
- One specialist flagged an issue for another
- One called a finding significant and another did not
- A pattern in `cross-specialty-map.json` was triggered and involves several specialists

If there are no overlaps, skip the round and state this in the report.

```
Agent(
  subagent_type="cardiologist",
  name="cardiologist-r2",
  prompt="You provided an assessment in round one. Read your colleagues' conclusions on the disputed topic and challenge them on substance.

COLLEAGUES' ASSESSMENTS:
[assessments from specialists whose areas overlap with yours]

YOUR FIRST-ROUND ASSESSMENT:
[text]

Read .claude/shared/consilium-protocol.md, Block 3, and use its exact response format: what you agree with, what you disagree with, and what your colleagues overlooked.

Base objections on data, not opinion. A specialist's authority is not an argument. Challenge the strongest version of the claim, not a simplified version. If an honest check reveals no objection, say so and specify what you checked.

Revising your own first-round conclusion when a colleague's data refutes it is normal and encouraged.",
  run_in_background=true
)
```

**Devil's advocate:** for the leading hypothesis—the one explaining the most findings—assign the participant whose area is least associated with it to try to refute it.

### 5. Round 3 — dispute resolution

The orchestrator resolves disputes in the main context without launching agents. Verdict rules: Block 4 of `consilium-protocol.md`.

For each dispute:

| Situation | Verdict |
|-----------|---------|
| Evidence levels differ | The higher level prevails; record the disagreement |
| Equal evidence levels, but only one position is falsifiable | The falsifiable position prevails because it can be tested |
| Equal evidence levels with no distinguishing data | **Unresolved disagreement**; identify an investigation that could settle it |
| Dispute stems from different units or laboratories | An artifact: normalize using `_marker-aliases.json` and reassess |
| One position uses data older than 24 months and another uses recent data | Recent data prevails |
| A position relies on a prompt assertion rather than `Data/` | Reject it: prompts contain no patient facts |

**Artificial consensus is prohibited.** Preserve both positions in unresolved disagreements. Do not smooth the wording, conceal a losing position, or declare agreement where none exists; doing so destroys information about the next investigation needed.

### 6. Synthesize results

After resolving disputes:

**A. Sort by severity:**

- Gather all findings and sort: critical → high → medium → low → stable

**B. Resolve cross-specialty flags:**

- If the hematologist wrote “→ Cardiology: tachycardia may result from anemia,” check what the cardiologist said about tachycardia
- Compare each specialist's flags with the others' findings
- Identify agreement and contradictions

**C. Apply cross-specialty patterns:**

- Load `Data/specialists/cross-specialty-map.json`
- Check for activated patterns (renin↑ + tachycardia + kidney findings, etc.)
- Note new patterns not already covered

**D. Detect conflicts:**

- Do specialists give opposing recommendations?
- Do medications prescribed for one condition interfere with treatment of another?

**E. Synthesize cross-specialty hypotheses:**

- Formulate hypotheses that no individual specialist would propose alone
- This is the consilium's main value

**F. Assess a common root cause:**

- Collect every specialist's L4 hypotheses (framework Block 2)
- Check whether separate findings reduce to one systemic process or several independent processes
- Identify cross-specialty axes named by multiple specialists (framework Block 3); overlapping axes suggest a common root
- Build a timeline: do different conditions begin at the same time?
- Summarize lifestyle and environmental contributions in one table, identifying modifiable factors with the greatest effect for the least intervention

**G. Revalidate earlier consilia:**

- Read `Data/consilium/_sessions.json` and reports predating the latest lab batch
- Check whether their key conclusions relied on data subsequently refuted
- List outdated conclusions separately, with the file, date, and lab result that invalidated them
- **Do not edit earlier reports**: they remain historical snapshots. Record refutations in the new report

**H. Update hypotheses:**

- Compare the consilium's conclusions with `Data/hypotheses.json`
- Identify strengthened, weakened, or refuted hypotheses and the reasons
- Offer to update the file; do not write without confirmation

### 7. Generate the report

```markdown
## Consilium — [YYYY-MM-DD] — [scope: full / targeted / question]

### Participants
- [Specialty]: [severity of findings]
- ...

### Discussion progress
- **Round 1:** [specialists and hypotheses proposed]
- **Round 2:** [who challenged whom and on what; or “no overlaps, round skipped”]
- **No response:** [who, and the resulting gaps]

### CRITICAL / HIGH findings
1. **[Cross-specialty finding]** ([specialties])
   - What: [description]
   - Why it matters: [rationale]
   - Action: [what to do]

### MEDIUM findings
1. ...

### Cross-specialty synthesis
> Findings an individual specialist would not have identified alone

1. **[Hypothesis]**
   - Basis: [marker A from specialist X] + [marker B from specialist Y]
   - Mechanism: [explanation]
   - Verification: [investigations needed]

### Resolved disputes

| Disputed issue | Position A (who) | Position B (who) | Verdict | Basis |
|----------------|------------------|------------------|---------|-------|

### Unresolved disagreements
> Preserve disagreement. This section shows what we do not know.

1. **[Issue]**
   - Position A: [...] — [specialty], evidence level [X]
   - Position B: [...] — [specialty], evidence level [X]
   - Why unresolved: [missing data / equal evidence levels / adjudicating test needed]
   - **What could settle it:** [specific investigation]

### Testing the leading hypothesis
- **Hypothesis:** [...]
- **Opponent:** [specialty]
- **Arguments against:** [...]
- **Withstood challenge:** yes / no / partially
- **Final confidence:** increased / unchanged / decreased

### Rejected hypotheses

| Hypothesis | Proposed by | Reason for rejection |
|------------|-------------|----------------------|

### Common root cause
> Does the picture reduce to one process or several independent processes?

- **Verdict:** [single process / multiple independent processes / partly related]
- **Shared axes:** [axes named by multiple specialists]
- **Most likely root cause (L4):** [...]
- **Competing explanation:** [...]
- **What distinguishes the hypotheses:** [specific investigation or observation]

### Timeline

| Year | Event or symptom onset | Coinciding events |
|------|------------------------|-------------------|

### Lifestyle and environmental contributions

| Factor | Current value | What it affects | Modifiable | Priority |
|--------|---------------|-----------------|------------|----------|

### Impact on existing hypotheses

| Hypothesis | Previous status | New status | Basis |
|------------|-----------------|------------|-------|

### Invalidated conclusions from earlier consilia
> Derived documents do not update themselves. State when new lab results refute the data underlying an earlier report.

| Report | Date | Invalidated conclusion | Refuting evidence |
|--------|------|------------------------|-------------------|

### Conflicts and interactions
- [Conflict 1]: specialist A recommends X, specialist B recommends Y
  - Resolution: [proposal]

### Drug interactions
- [If any]

### Action plan (prioritized)
1. **[URGENT]** [Action] — [Why] — [Which specialist]
2. **[WITHIN A MONTH]** ...
3. **[ROUTINE]** ...

### Questions for real doctors
**Hematologist:**
- [Question]

**Endocrinologist:**
- [Question]

### Data gaps
- [What is missing from the overall picture]

⚕️ This information is for reference only. Consult a doctor for treatment decisions.
```

### 8. Check before saving

Do not save until every required section is present:

- [ ] Discussion progress
- [ ] Resolved disputes, or an explicit “no disputes arose” with an explanation
- [ ] Unresolved disagreements, or an explicit “all disputes resolved”
- [ ] Testing the leading hypothesis
- [ ] Common root cause
- [ ] Timeline
- [ ] Lifestyle and environmental contributions
- [ ] Impact on existing hypotheses
- [ ] Data gaps
- [ ] Disclaimer

Separately check for fabricated references: specific DOIs, authors, or article titles. Remove any found and downgrade the claim's evidence level to D.

Fill in missing sections rather than removing them from the template. An empty mandatory section means an incomplete consilium.

### 9. Save

1. Save the report to `Data/consilium/YYYY-MM-DD_[scope].md`
   - Scope examples: `full`, `targeted-hemato-endo`, `question-fatigue`
2. Append to `sessions[]` in `Data/consilium/_sessions.json`. Preserve the `{version, sessions[]}` wrapper and leave `version` unchanged:
   ```json
   {
     "date": "YYYY-MM-DD",
     "scope": "full|targeted|question",
     "specialists": ["hematologist", "endocrinologist"],
     "question": "question text or null",
     "file": "YYYY-MM-DD_full.md",
     "rounds": 3,
     "disputes_total": 0,
     "disputes_unresolved": 0,
     "critical_count": 0,
     "high_count": 2,
     "medium_count": 5
   }
   ```

## Child profile

For an active profile under 18, `pediatrician` is a **required participant and reviewer**, regardless of the question's topic.

In round two, the pediatrician checks the others' assessments for inappropriate use of adult reference intervals, blood pressure thresholds, screening recommendations, and dose calculations.

Such objections are **substantive, not procedural**. A hematologist labeling physiological lymphocytosis in a four-year-old as abnormal has made a substantive error; reject that conclusion rather than softening its wording.

---

## Rules

- **Include a disclaimer** in every report
- **Never diagnose**: provide hypotheses and investigation recommendations only
- **Prioritize actions** from urgent to routine
- **Avoid duplication**: combine identical recommendations from multiple specialists
- **State conflicts explicitly**; do not conceal contradictions
- Even without specialty-specific data, a specialist may identify cross-specialty connections
- **Require the holistic framework**: assessments missing “Systemic picture,” “Root-cause hypothesis,” “Lifestyle and environmental contributions,” or “Timeline” are incomplete
- **Check life context before rare disease**: substances, routine, nutrition, and environment often explain findings more simply
- **Include a common root-cause hypothesis**; isolated specialist opinions do not constitute a consilium
- **Label evidence levels** (A/B/C/D/⚠️) for every substantive claim according to `.claude/shared/evidence-base.md`
- **Fabricated references are prohibited.** No searching in round one: blinded assessments must be independent and reproducible. Verify sources in round two and synthesis. References to an organization or guideline are acceptable; unverified specific DOIs, authors, or article titles are not. Remove fabricated references from agent responses and downgrade the claim to D
- **Cross-specialty synthesis is always evidence level D or ⚠️** because it derives from comparison rather than direct research
- **Debate is required**: no objections in round two warrants checking whether there was truly no disagreement or merely superficial agreement
- **Artificial consensus is prohibited**: preserve both positions and identify the investigation that could settle an unresolved dispute
- **Base objections on data**, not a specialist's opinion or authority
- **Include rejected hypotheses** and reasons so the next review does not needlessly propose them again
- **Completion requires** every section in step 8, an entry in `sessions[]`, and no fabricated references
