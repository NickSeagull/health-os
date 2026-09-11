# Health-OS

A personal health management system built on Claude Code. Medical records, lab results, visits, medications, and goals live in local files and are reviewed by a panel of AI specialists capable of challenging one another.

This repository is a personally maintained fork, distributed under the [MIT license](LICENSE).

---

> ## ⚠️ Read before installing
>
> **This is not a medical device.** The software is not registered or certified and has not undergone clinical trials. It does not diagnose, treat, or prevent disease.
>
> **This is not medical advice.** The system is built on a language model. Models make mistakes, confidently state falsehoods, and lack your clinical context. A physician must make all diagnostic and treatment decisions.
>
> **Noncommercial project.** Distributed free of charge under the MIT license, developed voluntarily, unrelated to the provision of medical services, without advertising or monetization.
>
> **Provided “as is,” without warranties.** You use the software **entirely at your own risk**. The authors are not liable for harm to health, incorrect conclusions, or the loss or disclosure of data.
>
> **All demonstration data is fictional.** The demo dataset describes a nonexistent person. Any resemblance is coincidental.
>
> **You are responsible for your data.** The project has no backend service, and the authors cannot access your files. Protecting those files—disk encryption, backups, access restrictions, and compliance with your jurisdiction’s laws—is entirely your responsibility.
>
> **Data is sent to the language model API.** Otherwise, the system could not analyze it. This is the main channel through which data leaves your device; the model provider, not this project, determines the processing terms.
>
> Full terms: **[DISCLAIMER.md](DISCLAIMER.md)**. Installing the software constitutes acceptance of them.
>
> 🚨 **If you notice signs of a medical emergency, contact emergency services.** This software is not a monitoring system and cannot call for help.

---

![Health-OS dashboard with demonstration data](docs/img/dashboard-overview.png)

<p align="center"><sub>The dashboard with the demo dataset. The screenshots show the English interface. All data is fictional; the screenshot contains no real health information.</sub></p>

---

## Why this exists

A person’s medical information is scattered across a dozen places: lab PDFs, notes from doctors, a fitness tracker app, and memory. Meanwhile, each medical specialist focuses on their own area—and the cause of a symptom often lies outside it.

Health-OS addresses two needs:

1. **Collect everything in one place**, in a structured form that makes it possible to compare data from five years ago with yesterday’s results.
2. **Make the system reason holistically**: look for root causes rather than merely describe abnormalities, and consider lifestyle and environment alongside lab results.

---

## What is included

### 15 AI specialists

A cardiologist, hematologist, endocrinologist, neurologist, gastroenterologist, urologist, gynecologist, pediatrician, dermatologist, ENT specialist, orthopedist, psychiatrist, dentist, ophthalmologist, and health coach. Each is a separate agent with its own clinical scope and isolated context.

The central principle: **a specialist’s prompt contains no patient facts.** The specialist builds the clinical picture by reading the data. A prompt is a methodology, not a medical record; otherwise, it inevitably becomes outdated and starts asserting things that newer results have already disproved.

### A specialist panel with genuine debate

Running specialists in parallel does not, by itself, create a panel review. It creates a collection of monologues in which a weak hypothesis sounds just as convincing as a strong one. Here, there are three rounds:

| Round | What happens |
|-------|--------------|
| **1** | Independent, **blinded** assessments: specialists cannot see one another’s conclusions, preventing anchoring on the first opinion |
| **2** | Cross-critique: specialists whose areas overlap must challenge their colleagues on substantive grounds |
| **3** | Disputes are resolved according to the strength of the evidence, followed by synthesis of a shared root-cause hypothesis |

**Artificial consensus is prohibited.** Unresolved disagreements appear in the report with both positions intact: they identify precisely which investigation is needed next. Smoothing over the wording destroys that information.

**What this does not provide—stated plainly.** All fifteen agents use the same language model, so their errors are correlated: a systematic misconception can recur in every role, including the devil’s advocate. Agreement means the model is consistent, not that its conclusion is correct. These are not fifteen independent opinions or independent confirmation of a diagnosis.

The report’s value lies in its “Unresolved disagreements” and “Data gaps” sections. They describe what the system does not know, making them its most dependable part.

### Accounting for sex

Sex affects which conditions are likely, which age-based screenings are indicated, and how the same numbers are interpreted. The profile has three independent fields: `sex` for medical reasoning, `gender_identity` for addressing the person, and `hormone_therapy` for accounting for treatment. They must not be conflated in either direction.

Falling ferritin is an illustrative example. In a woman of reproductive age, the first question concerns menstrual blood loss; in a man, it is an indication for endoscopy. The same numbers lead to different first steps in investigation. Without a sex field, the system could pursue the wrong direction without acknowledging it.

If sex is unspecified, the specialist explicitly states which conclusions cannot be drawn rather than silently making an assumption.

### Family member profiles

One installation manages records for several people: the owner, a spouse, children, or older parents. Each profile is isolated; one person’s data is not used when reviewing another person. The only channel for hereditary information is the patient’s own `family_history` field, filled in deliberately rather than by automatically reading someone else’s records.

There is **one active profile for the entire system**: the dashboard and Claude Code read the same pointer. They cannot diverge and display different people’s data.

Working in the wrong profile is the most costly error in this subsystem, so the current person is always visible in the dashboard header, announced on the first line of `/day`, and checked by the integrity validator, which rejects data written outside a profile.

**A child profile activates pediatric handling.** Adult reference intervals must not be applied to children’s lab results: alkaline phosphatase in a growing child can normally be several times the adult upper limit; lymphocytes physiologically predominate in the differential count until age 4–5; and height and weight are interpreted as age-based percentiles rather than absolute values. Applying adult intervals would label normal findings as pathological. The pediatrician leads the child’s case and reviews the other specialists’ assessments.

Create another adult’s profile only with their knowledge; see the third-party data section in [DISCLAIMER.md](DISCLAIMER.md).

### Relationship graph

JSON files store values: markers, dates, and doses. They are precise but disconnected. The wiki layer stores **relationships and judgments**: why a marker matters, which hypothesis explains it, and what each doctor said.

The approach adapts [Andrej Karpathy’s LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) to medical records. The key difference: **numbers are not copied onto pages.** Karpathy’s sources are unstructured, making Markdown an improvement. Here, values already live in JSON and power trends and validation. A page links to a record rather than copying it; a copy inevitably drifts from the original.

The practical value is not the visualization, but three checks that people tire of performing and agents do not:

| Check | What it finds in the medical record |
|-------|-------------------------------------|
| **Contradictions** | A cardiologist and a neurologist said different things. A hypothesis says “the marker is stable,” but a new result shows a decline |
| **Orphans** | An uploaded result nobody interpreted. A hypothesis without a next step. A forgotten doctor’s instruction |
| **Broken links** | A medication mentioned in a visit note but absent from the medication list |

Contradictions are not resolved automatically: both positions are shown, along with what would settle the issue. The discrepancy between sources is itself the finding.

### Holistic framework

Mandatory for every specialist. This is not simply an instruction to “think more broadly,” but a concrete mechanism:

- A five-level **causal ladder**: signal → organ → regulation → root cause → life context. Stopping at the second level counts as an incomplete analysis
- **13 cross-cutting axes**—autonomic, HPA, thyroid, inflammation, circadian rhythms, oxygenation, and others—with the specialties each intersects
- A **life-context matrix**: geography, climate, housing, work, nutrition, sleep, movement, substances, and social environment
- A **priority rule**: investigate a modifiable everyday factor before a rare disease

The methodological foundations are Engel’s biopsychosocial model, allostatic load, and the exposome paradigm. This is systems medicine, not alternative medicine.

### Evidence base

Every substantive claim is labeled **A/B/C/D/⚠️**. International sources take priority: Cochrane, PubMed, NICE, USPSTF, WHO, and specialty society guidelines.

A separate strict rule: **references must be verified, not invented.** Specialists have a narrow, domain-allowlisted web channel for one purpose: checking that a cited guideline exists and says what is attributed to it. Specifics—DOI, author, or guideline number—are permitted only with an accessible URL whose page the agent has opened. Without a URL, the fallback remains the issuing body and topic, without specifics.

**Patient data must not appear in search queries.** Queries are formulated as de-identified literature questions and shown to you before submission. Every query is logged; otherwise, the privacy claim would be unverifiable. See `.claude/shared/source-verification.md` for details.

### Responding to critical findings

Emergency thresholds stop the normal workflow: laboratory panic values, hypertensive crises, and mental-health red flags, with emergency contact information displayed immediately.

### 24 skills and a dashboard

Skills cover the full cycle: document intake, lab interpretation, visits, medications, dental care, vaccinations, body metrics, mood, goals, and finding doctors and tests. The Next.js dashboard displays trends and cards. It is mostly read-oriented, but some routes write to `Data/`; paths are resolved through `resolveWithin()` and input is validated. It is bound to `127.0.0.1`. For CSRF protection and its limitations, see [docs/SECURITY.md](docs/SECURITY.md).

![Lab results section](docs/img/dashboard-labs.png)

<p align="center"><sub>The lab results section with demo data: marker trends, abnormalities, and key indicators.</sub></p>

---

## What it is—and is not—suitable for

The distinction is direct, without softening. It matches the conclusions of external reviewers and is worth stating upfront.

| Task | Verdict |
|------|---------|
| Keep documents, lab results, and history in one place | **Yes**—the main use case |
| Track indicators over years | **Yes**, provided extracted numbers are checked against the originals |
| Find contradictions between sources and missed instructions | **Yes**—work that people tire of doing |
| Prepare a summary and questions for an appointment | **Yes**—perhaps the most underrated use case |
| Obtain a second informational opinion | **With caution**—only with verifiable sources and as input for a discussion with a physician |
| Find a “root cause” | **No**—a system-generated hypothesis is not an established cause |
| Diagnose or rule out disease | **No**—explicitly prohibited |
| Change medications, doses, or an investigation plan | **No**—only after consulting a physician |
| Assess a medical emergency | **No**—if you suspect one, call emergency services |

The reasons for these limits: the project has no clinical trials, no test set with reference diagnoses, no measured sensitivity or specificity, and no independent physician validation. Until those exist, every system output remains a hypothesis, not a clinical conclusion.

## Privacy

The project is designed around the premise that **medical data should not leave the device for storage**. Analysis still sends data to the model API, as explained above.

| Mechanism | How it works |
|-----------|--------------|
| Local git | A repository without remotes: there is nowhere to push by design |
| Inverted `.gitignore` | All of `Data/` is ignored, with explicitly named exceptions. Mistakes cause a file to be omitted from git rather than leaked |
| Originals outside version control | PDFs and scans contain raw PHI and survive deletion in git history |
| Loopback-only dashboard | `127.0.0.1`, inaccessible from the local network. Some routes write to `Data/`, so loopback binding is the primary boundary |
| PII-free prompts | No agent contains patient data |
| Profile isolation | One family member’s data is not read when reviewing another; integrity checks reject writes outside profiles |
| Searches without patient data | Web queries are de-identified literature questions, displayed before submission and logged |

See [docs/SECURITY.md](docs/SECURITY.md) for details.

---

## Quick start

### First, explore the demo

Before entering your own information, deploy the fictional patient dataset and look around:

```bash
git clone <repository> health-os && cd health-os
./setup.sh --demo
cd Dashboard && npm install && npm run dev
```

The dashboard is available at `http://127.0.0.1:3000`.

### Then, set up your own installation

Demo and live data **must not be mixed**: clear `Data/` before switching, or indexes will no longer match the files. The cleanup command is in [INSTALL.md](INSTALL.md#block-6b-switching-from-demo-to-your-own-data).

```bash
./setup.sh
```

Then open the project in Claude Code and run:

```
/onboarding
```

The skill conducts a discovery interview and creates your initial medical record.

Detailed installation: [INSTALL.md](INSTALL.md). Step-by-step onboarding: [docs/ONBOARDING.md](docs/ONBOARDING.md).

---

## Requirements

- **macOS or Linux.** On Windows, use WSL2: installation and hooks are written in Bash
- [Claude Code](https://claude.com/claude-code)
- Python 3.10+ for the integrity-checking script
- `jq` for session hooks
- Node.js 20+ and npm for the dashboard only; the system works without it

Optional: MCP servers for WHOOP, Todoist, and Google Calendar.

---

## Documentation

| File | Contents |
|------|----------|
| **[DISCLAIMER.md](DISCLAIMER.md)** | **Terms of use and disclaimer—read first** |
| [INSTALL.md](INSTALL.md) | Step-by-step installation |
| [docs/ONBOARDING.md](docs/ONBOARDING.md) | Your first days with the system |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Internal design |
| [docs/SECURITY.md](docs/SECURITY.md) | Threat model and rules |
| [CLAUDE.md](CLAUDE.md) | Instructions for Claude Code |
| [.claude/shared/](.claude/shared/) | Reasoning frameworks and data schemas |

---

## Development checks

From the repository root, run `python3 .claude/scripts/check-english.py` to detect Cyrillic text or filenames in tracked and non-ignored source files. Binary assets require visual review. Keep documentation, interface text, and bundled data in English.

For the dashboard, run `npm test`, `npm run check:english`, and `npm run build` from `Dashboard/`. The regression tests cover English visit metadata, marker aliases and units, medication timing, specialty colors, and crisis wording.

---

## Limitations to know upfront

- **The system does not replace a physician** and is not intended for self-diagnosis
- **Web access is narrow and purpose-limited**: specialists can verify sources on allowlisted domains (Cochrane, PubMed, NICE, USPSTF, WHO), but cannot browse freely. Patient data must not enter queries
- **The quality of conclusions depends on data completeness.** An empty medical record produces an empty analysis
- **The project targets the Russian context** for compulsory medical insurance (OMS), laboratories, and care navigation, but its clinical framework is universal
- **This is a personal tool**, not a medical information system: it has no multi-user access controls, access audit, or certification

---

## License

MIT—see [LICENSE](LICENSE).

The license covers the code and prompts. Your medical data belongs to you and is stored on your device.

---

⚕️ Information produced by the system is for reference only. Consult a physician before making treatment decisions. If you notice signs of a medical emergency, call emergency services.
