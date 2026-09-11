# Path resolution and active profile

Mandatory frame. Read **before any read or write** of patient data -
all skills and all agents.

The system stores medical data of several people: owner, spouse, children,
elderly parents. Each person has a separate profile with completely
isolated data set.

---

## Block 1. Main rule

Instructions for skills and agents are written in short ways like `Data/labs/`,
`Data/profile.json`, `Data/hypotheses.json`. This path **always means data
active profile**:

```
Data/X → Data/profiles/<active-id>/X
```

Examples:

| Written in the instructions | Is actually read and written |
|-----------------------|----------------------------------|
| `Data/profile.json` | `Data/profiles/owner/profile.json` |
| `Data/labs/_index.json` | `Data/profiles/owner/labs/_index.json` |
| `Data/doctors/visits/2026-06-25_therapist.md` | `Data/profiles/owner/doctors/visits/2026-06-25_therapist.md` |
| `Data/hypotheses.json` | `Data/profiles/owner/hypotheses.json` |

The short form was kept intentionally because it is easier to read and did not need to be
rewritten in hundreds of places. But **never write using the literal shorthand path** -
the file would land outside the profile, and the integrity check would reject it.

---

## Block 2. What is NOT forwarded

Three categories of paths are system-wide and do not belong to the profile. They are taken as
written:

**System reference data** is the same for all people:

- `Data/labs/_marker-aliases.json` — marker synonyms and unit conversion factors
- `Data/specialists/` — areas of responsibility for specialties and cross-specialty maps

**General wiki** - knowledge not tied to a person:

- `Data/wiki/source/` - source pages: guides, research
- `Data/wiki/marker/` — marker reference pages: what it means, what it is regulated by

Literature is universal. Research found for one family member,
works for everyone - duplicating it across profiles is pointless.

The **Personal** part of the wiki is redirected as normal data:
`Data/wiki/condition/`, `hypothesis/`, `symptom/`, `synthesis/` live
in `Data/profiles/<id>/wiki/`.

**Templates** - files with suffixes `.example.`, `.demo.`, `.reference.`
These are installer templates and format samples, not someone else's data.

---

## Block 3. Defining the active profile

Index: `Data/profiles/_active.json`

```json
{
  "version": 1,
  "active": "owner",
  "switched_at": "2026-08-06T10:00:00",
  "history": [
    { "profile": "owner", "at": "2026-08-06T10:00:00" }
  ]
}
```

Determination order:

1. The user named the profile explicitly in the request (“show my daughter’s tests”) -
   it is taken, but the switching **is not saved**: this is a one-time request,
   and the next command again applies to the active profile
2. Otherwise - `active` from `_active.json`
3. The file does not exist or the profile does not exist in it - **stop and ask**.
   Don't guess, don't take the first one you come across

---

## Block 4. Profile announcement - required

Working with the wrong profile is the most likely and most expensive mistake in this
subsystem. An analysis of a child that ends up in the father’s chart spoils both charts and
distorts all subsequent conclusions.

Therefore:

- `/day` and `/status` declare the active profile as **first line**
- Any **record** of data is preceded by an indication of whose profile the record is being made
- When accessing an inactive profile, this is called explicitly:
  “Looking at my daughter’s profile (active - owner)”
- If the request contains signs of another person - name, “wife”, “son”,
  childhood age in context - but another profile is active, **ask again
  before recording**, not after

---

## Block 5. Profile structure

```
Data/
├── profiles/
│   ├── _active.json
│   ├── owner/
│ │ ├── profile.json ← sex, date of birth, allergies, chronic conditions
│   │   ├── hypotheses.json
│   │   ├── history.json
│   │   ├── vaccinations.json
│   │   ├── body-metrics.csv
│   │   ├── context/
│   │   ├── labs/
│   │   ├── doctors/
│   │   ├── dental/
│   │   ├── medications/
│   │   ├── mental/
│   │   ├── goals/
│   │   ├── costs/
│   │   ├── traction/
│   │   ├── consilium/
│ │ └── wiki/ ← personal pages
│ └── <other profiles>/
│
├── wiki/ ← general knowledge
│   ├── source/
│   └── marker/
├── labs/_marker-aliases.json ← system-wide reference
└── specialists/ ← system-wide directory
```

Profile ID: lowercase Latin, numbers and hyphen, from 2 to 32
characters. Serves as the name of the directory, so it is checked strictly - dots, slashes and
spaces are rejected.

**The ID must not contain a surname or full name.** It falls
in file paths, in output, and in error messages. `wife`, `son`, `mother` —
enough; `ivanova-maria` is redundant.

---

## Block 6. Profile insulation

**Data from one profile does not fall into the conclusions of another.** Specialist,
analyzing his son's tests, does not read his father's chart.

The only exception is **family history**, and it works by obvious
rules:

- only diagnoses and conditions of first-degree relatives are taken,
  listed in `profile.json` → `family_history`
- this is a **separate profile field**, and not reading other people's cards directly.
  If the father has a diagnosis in his chart that is significant for his son, it is deliberately
  entered into the son’s `family_history`, rather than being pulled in automatically
- in conclusion, family history is called as such

Automatic reading of one person's card while analyzing another is prohibited:
this is also clinically incorrect (random coincidences are passed off as heredity),
and is unacceptable from a consent perspective.

---

## Block 7. Age and pediatrics

Age is calculated from `profile.json` → `basic.date_of_birth` **at the time
of the request**, is not taken from the text and is not hardcoded.

If you are under 18 years of age, the pediatric mode is activated -
`.claude/shared/pediatric-references.md`. Adult reference intervals
**do not apply to children's tests**: the discrepancy is fundamental, not
a matter of adjustment.

---

## Block 8. Consent and legality

The profile of another adult is created only with his knowledge.
The child’s profile is maintained by the legal representative.

In `profile.json` of each profile, except the owner, the following field is required:

```json
"consent": {
  "basis": "self" | "informed" | "legal_guardian",
  "recorded_at": "2026-08-06",
  "note": "who maintains this profile and on what basis"
}
```

The field is not a legal document and does not prove anything - it
exists so that the question is asked consciously, and not passed silently.
Responsibility for the legality of processing other people's data lies with the installation
owner: see DISCLAIMER, section “Third Party Data”.

---

## Block 9. Antipatterns

Each point is a direct prohibition:

1. Write patient data using the short path `Data/X` literally
2. Guess the profile when the pointer is missing or broken
3. Write something down without naming your profile
4. Read one person’s chart while reading another
5. Substitute adult references for a child’s profile
6. Put last name or full name in the profile identifier
7. Create a profile for another adult without filling out `consent`
8. Switch active profile silently, without confirmation
