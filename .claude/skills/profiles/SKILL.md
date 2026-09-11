---
name: profiles
description: |
  Family member profiles: create, switch, list, delete.
  Triggers: “profiles”, “switch to”, “wife profile”, “add profile”, “whose profile”, “switch profile”
---

# Profiles - manage profiles of family members

## Purpose

The system maintains medical records for several people. This skill creates profiles,
switches the active profile, and shows whose data is currently in use.

Frame: `.claude/shared/profile-resolution.md` - read first.

---

## Workflow

### Show list

Read `Data/profiles/_active.json` and `Data/profiles/*/` catalogs.
For everyone, read `profile.json` → name, age, biological sex, and relationship.

```
Profiles:

  ▶ owner Owner M, 34 years old active
    wife Spouse F, 32 years old
    son Son M, 8 years old pediatric regimen

Switch: /profiles switch to wife
```

Age is calculated from `date_of_birth` at the time of access and is not stored.

---

### Switch active profile

1. Check that the profile exists. If it does not, show the list and stop
2. **Confirm with the user**: “I am switching the active profile to “Spouse.”
   All subsequent readings and writes will go to her card. Should I continue?
3. Update `Data/profiles/_active.json`: field `active`, `switched_at`,
   add an entry to `history[]`
4. Confirm the changed state:

```
Active profile: Spouse
  F, 32 years · 4 tests · 2 visits · last entry 07/12/2026
```

Never switch silently: the user must know whose record will receive the next entry.

---

### One-time access without switching

For “Show your son’s tests” when the owner’s profile is active, read the data
from profile `son`, **without changing the active profile**. State this explicitly:

```
I look at my son’s profile (the owner remains active)
```

One-time access is read-only. Any **write** requires either switching profiles
or explicitly confirming the target profile.

---

### Create a profile

Ask in turn:

1. **Identifier** - Latin, numbers, hyphen, 2–32 characters.
   Suggest based on the relationship: `wife`, `son`, `daughter`, `mother`, `father`.
   **Do not put a last name or full name in the identifier** - it appears in file
   paths and output. Check that the identifier is unused
2. **Display name** - how to address the person
3. **Relationship** - `self` · `spouse` · `child` · `parent` · `other`
4. **Date of birth** - ISO 8601. Mandatory: references depend on it,
   screening and pediatric regimen
5. **Biological sex** - according to `.claude/shared/sex-specific.md`: use `sex`
   for clinical reasoning; if relevant, also record `gender_identity` and `hormone_therapy`
6. **Basis for maintaining a profile** - see below

Then create a directory `Data/profiles/<id>/` with the structure from Block 5
of the framework and expand the templates. Do not change the active profile;
suggest switching in a separate step.

#### Base (`consent`)

For a profile other than the owner, the field is required:

| Relationship | `basis` | What is confirmed |
|-------|---------|--------------------|
| Self | `self` | — |
| Adult family member | `informed` | A person knows that his medical data is maintained in this system |
| Child or legally incapacitated person | `legal_guardian` | Are you the legal representative? |

Ask directly, without ceremony:

> A profile for another person is not merely a technical question. Does your
> spouse know that their test results will be stored and analyzed here? For a child,
> are you the legal representative?

Refusal to answer - do not create a profile. The field proves nothing
legally; it exists so that the question can be asked consciously.

Write down:

```json
"consent": {
  "basis": "informed",
  "recorded_at": "2026-08-06",
  "note": "spouse notified, maintained at her request"
}
```

#### If the profile is for children

If the person is under 18, say directly that pediatric mode is enabled
and explain how it differs:

```
Children’s profile — pediatric mode is enabled.

  Reference ranges are age-specific rather than adult ranges: in a growing child,
  alkaline phosphatase can be three times the adult norm, and that can be normal.
  Height and weight are interpreted by percentiles; vaccinations follow the age-based calendar.

  A pediatrician leads the assessment; other specialists may be involved, but
  adult reference intervals are not applied to test results.
```

---

### Delete profile

Deletion is irreversible and destroys the person’s entire medical record.

1. Show what exactly will be deleted: the number of tests, visits,
   protocols, directory size
2. Require the user to enter the profile ID manually; this is not a simple “yes”
3. Offer to first make a copy of the catalog and **wait for confirmation,
   that a copy has been made**
4. Do not delete the active profile; switch to another profile first
5. The owner's profile cannot be deleted

---

## Format `_active.json`

```json
{
  "version": 1,
  "active": "owner",
  "switched_at": "2026-08-06T10:00:00",
  "history": [
    { "profile": "wife", "at": "2026-08-05T18:20:00" },
    { "profile": "owner", "at": "2026-08-06T10:00:00" }
  ]
}
```

`history[]` stores the last 20 switches. It allows the system to determine which
profile received an entry if an error is discovered later.

---

## Rules

- **The frame `profile-resolution.md` is read before everything else**
- Switching - only with confirmation, never silently
- One-time access to someone else’s profile - read only, and always with a reservation
- Identifier without a last name or full name
- Date of birth is required: without it, reference ranges and screening do not work
- `consent` is required for all profiles except the owner
- Profile data is not mixed: hereditary data goes through
  `family_history`, and not through reading other people's cards
- Deletion - with manual entry of the identifier and the offer of a copy
- Completion criterion: `_active.json` is valid, each profile has
  `profile.json` with date of birth and biological sex, and `check-integrity.py` passes

⚕️ *Information is for reference only. Consult your physician for treatment decisions.*
