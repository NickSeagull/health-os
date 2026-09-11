# Onboarding

> ⚠️ **Not a medical device. Not medical advice. Noncommercial project.**
> Provided “as is,” without warranties. Use at your own risk.
> All demo data is fictional. Full terms: [DISCLAIMER.md](../DISCLAIMER.md) (in the repository root).
> 🚨 In a medical emergency, contact emergency services.

Get started without becoming overwhelmed. Each stage delivers a working result on its own; the next can wait a week.

Filling everything in takes weeks, and that is normal. The system is useful after the first stage.

---

## Stage 0. Explore (15 minutes, without your own data)

Before entering personal information, explore the system with a fictional patient's demo data.

```bash
./setup.sh --demo
cd Dashboard && npm install && npm run dev
```

Open `http://127.0.0.1:3000`. Browse the sections to see how lab results and trends look.

Then try this in Claude Code:

```
/consilium why is the demo patient tired?
```

A three-round review will begin. Pay attention to “Unresolved disagreements”—that is what the system was built for.

**When you have finished exploring**, remove all deployed demo data; otherwise, the fictional patient will remain in your medical record:

```bash
find Data -type f ! -name '.gitkeep' ! -name 'README.md' \
  ! -name '_marker-aliases.json' ! -path '*specialists*' \
  ! -name '*.example.*' ! -name '*.demo.*' ! -name '*.reference.*' -delete
./setup.sh
```

This removes deployed files in every format, including `.md` visit notes, while preserving templates and reference files.

---

## Stage 1. Basic medical record (30–40 minutes)

The minimum needed to make the system useful.

```
/onboarding
```

The discovery interview collects:

- Height, date of birth, and blood type
- Allergies and chronic conditions
- Current symptoms that concern you
- Doctors you see
- Medications and supplements you currently take
- **Life context**: diet, sleep, movement, substances, work, and climate

The last item is tempting to skip. Do not skip it: the holistic framework depends on it. Without it, specialists may look for disease when the cause is your routine. A calorie deficit, hookah use, irregular sleep, and latitude can explain more abnormalities than rare diseases.

**Leave anything you do not know blank.** Missing information goes into `_needs_input` and will be revisited later. Invented values are worse than empty fields.

**Stage outcome:** `Data/profile.json` and `Data/context/environment.json` are populated. You can ask the specialists questions.

---

## Stage 2. First lab results (20 minutes per batch)

Place lab PDFs in `Inbox/` and run:

```
/inbox
```

Documents are recognized, organized into `Data/labs/`, and indexed. Originals move to `Archive/`.

Next:

```
/labs interpret the latest results
```

Start with recent results. Digitizing historical records can take months; recent results are useful immediately.

> **Different laboratories.** Reference intervals depend on the method, and some markers arrive in different units. The system flags incomparable points, but do not compare values across laboratories by eye.

**Stage outcome:** the specialists have data to work with.

---

## Stage 3. First consilium (10-minute wait)

```
/consilium why am I always tired?
```

Or name specialties explicitly: `/consilium hematologist endocrinologist`.

What happens:

1. Specialists produce independent opinions without seeing one another's work.
2. Those whose areas overlap challenge their colleagues' conclusions.
3. The orchestrator resolves disputes and builds a shared root-cause hypothesis.

The report is saved in `Data/consilium/`.

**Reading the report.** The most valuable material is in two sections beyond the findings:

- **“Unresolved disagreements”**: the system states what it does not know and identifies a test that could settle the disagreement.
- **“Data gaps”**: what is missing from the overall picture.

These provide a ready-made list of questions for a real doctor.

---

## Stage 4. Doctors and visits (as appointments happen)

After each appointment:

```
/doctor I saw a doctor
```

A visit note is recorded, the contact is updated, the expense is logged, and a follow-up task is created if needed.

Before an appointment:

```
/doctor prepare me for a neurologist appointment
```

This assembles a brief covering your concerns, lab findings, and questions to ask.

This may be the most underrated feature. A fifteen-minute appointment is much more productive when you arrive with a structured account of your symptoms.

---

## Stage 5. Routine use (a few minutes per week)

Keep the system current through brief check-ins.

| When | What |
|------|------|
| Start of a session | `/day` — context, alerts, and items needing attention |
| After weighing yourself | `/body` |
| When you have something to record about how you feel | `/mental` |
| Once a month | `/traction` — review progress across health areas |
| End of a session | `/wrap-up` — save state and commit |
| Once a month | `/wiki lint` — contradictions, orphan pages, and broken links |

---

## Stage 5a. Family members (when needed)

One installation can maintain records for several people.

```
/profiles create
```

The skill asks for an identifier, name, relationship, date of birth, and sex. Date of birth is required: it determines reference intervals, screening, and whether pediatric mode is enabled.

**Another person's profile is more than a technical matter.** An adult must know that their data is being entered here and sent to the model API. For a child, you must be their legal representative. The skill asks about this explicitly; declining to answer is a reason not to create the profile. See the third-party data section in [DISCLAIMER.md](../DISCLAIMER.md).

To switch:

```
/profiles switch to wife
```

The active profile appears in the dashboard header and is announced on the first line of `/day`. You can also read another profile once without switching: name the person in your request.

**A child's profile** enables pediatric workflows: age-specific reference intervals, height and weight percentiles, and an age-specific vaccination schedule. The pediatrician leads the review.

---

## Stage 5b. Relationship graph

Once you have accumulated lab results, visits, and hypotheses, build the wiki layer:

```
/wiki build
```

This creates linked entity pages and a “Relationship graph” section in the dashboard.

After that, regular checks matter more than the picture:

```
/wiki lint
```

This finds contradictions between sources, pages with no incoming links, and mentions without a record of their own. The result is a ready-made work list.

---

## Stage 6. Digitizing your history (optional, time-consuming)

Old lab results, childhood records, and discharge summaries: place batches in `Inbox/` and run `/inbox`.

This becomes valuable once you have several years of history for one marker: a trend says more than a single point. But it can take months, so do not postpone everything else while doing it.

---

## Frequently asked questions

**Can I skip life context and fill it in later?**
Yes, but the conclusions will be weaker. The system will not be able to distinguish disease from a third consecutive month in a calorie deficit.

**What if I have almost no data?**
The specialist will state what is missing and suggest where to start. That is useful too.

**Will the system diagnose me?**
No; this is a firm boundary. It proposes hypotheses, assesses their evidence, and suggests how to check them. A doctor makes the diagnosis.

**What should I do with a critical result?**
The system stops normal processing and shows the finding first. Next, contact a doctor rather than running another skill.

**How do I know whether a conclusion is reliable?**
Look at the evidence level beside the claim: **A** means systematic reviews and meta-analyses; **D** means mechanistic reasoning; **⚠️** means a hypothesis without direct evidence. Cross-specialty consilium hypotheses are always D or ⚠️ because they are based on comparison, not a study.

---

⚕️ The system does not diagnose conditions or replace a doctor. If you notice signs of a medical emergency, contact emergency services.
