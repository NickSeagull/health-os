---
name: doctor-consult
description: |
  A single AI specialist consultation — launch a specific doctor agent to analyze data.
  Triggers: “ask [specialty]”, “what does [doctor] think”, “consultation [doctor]”
---

# Doctor Consult — single specialist consultation

> **Profile.** Before reading or writing, resolve the active profile using
> `.claude/shared/profile-resolution.md`. The shorthand path `Data/X` in this file
> means `Data/profiles/<active>/X` — never write to the literal shorthand path.
> Before writing, state whose profile the data will be written to.

## Purpose

Launch one specialized doctor agent to analyze the patient’s medical data. A quick consultation without a full case conference.

## Workflow

### 1. Parse the specialty

Determine the specialty from the skill arguments. Alias mapping is in `.claude/shared/specialty-aliases.md`; read it there rather than duplicating it here.

If the specialty is not recognized, show the available list and ask.

If text follows the alias, it is the specialist’s focus question.
Example: `/doctor-consult hemato why are the lymphocytes increasing?` → the `hematologist` agent with that focus question.

### 2. Launch the agent

```
Agent(subagent_type="[specialty]"): “Analyze the patient’s data. [Focus question: ...]. Read all required files and provide the answer in the standard format.

REQUIRED: read `.claude/shared/holistic-framework.md` and `.claude/shared/evidence-base.md` and follow them. Label every substantive claim with an evidence level (A/B/C/D/⚠️). Do not fabricate references, DOIs, authors, or article titles. The conclusion must contain the sections “Systemic picture”, “Root-cause hypothesis”, “Contribution of lifestyle and environment”, and “Timeline”. Check life and environmental context from `Data/profile.json` → `lifestyle` and `Data/context/environment.json` before looking for rare pathology.”
```

### 3. Output the result

Show the specialist’s answer to the user **as is** (without additional processing). The agent already follows the standard format.

## Rules

- **The holistic framework is mandatory** — a conclusion without the sections “Systemic picture”, “Root-cause hypothesis”, “Contribution of lifestyle and environment”, and “Timeline” is incomplete. If the agent omitted them, request an addition rather than publishing as is
- **The evidence base is mandatory** — claims without an evidence level (A/B/C/D/⚠️) are considered incomplete. If fabricated references (a specific DOI, author, or article title) appear in the agent’s answer, remove them and downgrade the claim to D
- Do NOT modify the agent’s answer; output it directly (except for removing fabricated references as above)
- Do NOT save a report (unlike a case conference); this is a quick consultation
- If the user wants a full case conference, suggest `/consilium`
- A disclaimer is mandatory (the agent adds it)
