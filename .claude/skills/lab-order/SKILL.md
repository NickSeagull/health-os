---
name: lab-order
description: |
  Where to get tested: route through compulsory medical insurance, comparison of prices of laboratories (Hemotest, Invitro), links for ordering. Deciphering the results is in /labs.
  Triggers: “find tests”, “where to take tests”, “compare prices”, “lab order”, “how much does the test cost”, “is it available under compulsory medical insurance”
---

# Lab Order - search and comparison of laboratories

> **Profile.** Before reading and writing, determine the active profile by
> `.claude/shared/profile-resolution.md`. Short path `Data/X` in this file
> means `Data/profiles/<active>/X` — never write to the literal shorthand path.
> Before recording, tell whose profile it goes to.

## Purpose

Find specific tests: where to take them and how much. Check the compulsory medical insurance route, compare prices of private laboratories (Hemotest, Invitro, etc.), provide direct links for ordering. Automatically update a task in Todoist with a summary and links.

**Skill limits:** `/lab-order` - before testing (where to go, how much it costs, how to prepare). `/labs` - after testing (interpreting results, marker trends, dynamics, impact on hypotheses). Result files are loaded through `Inbox/` + `/inbox`.

## User request

$ARGUMENTS

## Workflow

### 1. Determine the list of tests

From the user request or from the context:
- If a goal is specified (for example, “before hematologist”) → generate a list based on `Data/goals/YYYY.json` milestones and medical context
- If specific tests are indicated → use them
- If a milestone is specified → take the milestone description

If the list is compiled not according to the doctor’s prescription, but according to the purpose, say this directly: “The list is compiled according to the purpose, and not according to the doctor’s direction. The doctor may prescribe otherwise.” Don’t expand the list “just in case”: every extra marker is money and an extra reason to worry about a borderline result.

### 2. Compulsory medical insurance route (check first)

Compulsory medical insurance priority is a fixed user rule. Before comparing prices of private laboratories, check whether the analysis is free.

Read `Data/context/environment.json` → `healthcare_access` (insurance, VHI).

Check in `Data/goals/YYYY.json`: the associated milestone may have `oms_available: true` — then the paid path is obviously not the only one.

WebSearch: `[test name] under OMS [city] referral outpatient clinic`

Replace placeholders with the requested specialty, service, and location.

Find out for each analysis from the list:
- Is compulsory health insurance included in the state guarantee program?
- Do you need a referral (form 057/u), and from which doctor — a primary care physician or a specialist?
- Where testing is done: the assigned clinic or a centralized laboratory
- Timing: how long to wait for the direction and how long for the result
- Limitations: frequency per year, indications only, or certain groups only

**Show the compulsory medical insurance path first, before the price table.** Even if the user asked “how much does it cost” - first the line “some of this is free under compulsory medical insurance”, then the prices.

Block format:

```markdown
### Compulsory Medical Insurance Path

| Analysis | According to compulsory medical insurance | What you need |
|--------|--------|-----------|
| [Analysis 1] | ✅ yes | Referral from a primary care physician, assigned clinic, ~[term] |
| [Analysis 2] | ⚠️ according to indications | [what indications] |
| [Analysis 3] | ❌ no | Paid only |

You can close for free: [N of M] analyses.
What will remain paid: [list]
```

If everything is available under compulsory medical insurance, write so and do not expand the comparison of paid prices without a separate request.

If there is VHI (`healthcare_access.dms: true`) - add a third way: what is covered under `dms_details`.

Do not discourage the paid route: it is faster and often more convenient. The goal is to show both options and let the user choose, rather than decide for them.

### 3. Search by laboratories

**IMPORTANT: two-step price verification!**

For EACH analysis:

**Step 1 - WebSearch** (find analysis page URL):
- `site:gemotest.ru [test name] price [city]`
- `site:invitro.ru [test name] price [city]`
- From the results - extract the URL of the analysis page

**Stage 2 - WebFetch** (check actual price on page):
- For EVERY URL found → `WebFetch(url, "Find the exact test price in rubles")`
- Use ONLY the price from the page, NOT from the search snippet
- Search snippets often show incorrect prices (old, from another region, advertising)

**Complexes** - search separately:
- `site:gemotest.ru [keywords] panel promotion`
- `site:invitro.ru [keywords] panel profile`
- Also check via WebFetch!

**Other labs** (on request): Helix, KDL, Citylab - similar

**Blood drawing** is a separate service, paid once per visit and included in the total. Check its price in the same way as the price of analysis: WebSearch → WebFetch laboratory pages. It changes and differs by region and branch.

There is not a single price in this file and there should not be. Any number in the final table is from the verified laboratory page for today's date. If the page does not give the price, write “clarify” rather than insert the remembered value.

### 4. Search for complexes

The key optimization is to find ready-made packages where several tests together are cheaper:
- Search by target keywords: “anemia”, “hormones”, “examination”, etc.
- Compare the price of the complex vs the amount per piece
- Calculate savings

### 5. Show to user

Show comparison table in chat:

```
## Price comparison - [target]
Search Date: YYYY-MM-DD

First, the “Compulsory Medical Insurance Path” block from step 2, then this table for what remains to be paid.

| Analysis | Hemotest | Invitro |
|--------|----------|---------|
| UAC expanded | [price] ₽ | [price] ₽ |
| ... | | |
| **Total per piece** | **[amount] ₽** | **[amount] ₽** |
| **Blood drawing** | **[price from page] ₽** | **[price from page] ₽** |
| **TOTAL** | **[amount] ₽** | **[amount] ₽** |

### Complexes
- [Name] - [price] ₽ (vs [piece amount] ₽, savings [X] ₽)
  [link]

### Recommendation
Cheaper in [lab]: [amount] ₽ (saving [X] ₽ vs [other lab])
```

All cells are placeholders. Substitute only values checked via WebFetch; mark unverified values as “clarify”.

### 6. Update a task in Todoist

**If there is a related task** (find by text or by todoist_task_id from milestone):

#### 6a. Update task description - summary

Via MCP `update-tasks` update the task description:

```markdown
## List of tests

**Required:**
- [ ] [Analysis 1]
- [ ] [Analysis 2]
...

**Preferred:**
- [ ] [Analysis N]

## Where to get tested

**Recommendation: [Laboratory]** (~[amount] ₽)

| Analysis | Price |
|--------|------|
| [Analysis 1] | [price] ₽ |
| ... | |
| Blood draw | [price] ₽ |
| **Total** | **[amount] ₽** |

💡 Complex “[name]” – [price] ₽ (saving [X] ₽)

## Preparation
- On an empty stomach (8–12 hours)
- In the morning until 10:00
- Do not train the day before
- Passport (for compulsory medical insurance - also a policy and direction)
```

#### 6b. Add a comment - detailed links

Via MCP `add-comments` add a comment to the task:

```markdown
## Links to tests (search [date])

### Hemotest (total ~[amount] ₽)
- [Analysis 1]([link]) — [price] ₽
- [Analysis 2]([link]) - [price] ₽
...
💡 Complex: [Name]([link]) - [price] ₽

### Invitro (total ~[amount] ₽)
- [Analysis 1]([link]) — [price] ₽
- [Analysis 2]([link]) - [price] ₽
...
💡 Complex: [Name]([link]) - [price] ₽

### Comparison
Cheaper: [laboratory] at [X] ₽

> Prices from search on [date]. May vary - check on the website.
```

### 7. Update milestone (if any)

If tests are associated with a milestone in `Data/goals/YYYY.json`:
- Add todoist_task_id if not already linked
- Update `cost_estimate_rub` based on the prices found

### 8. Record expense (after testing)

After the user reports that they completed the tests:
- Ask: how much they paid, which laboratory, and whether it was OMS or private
- Append in one line to `Data/costs/YYYY.jsonl`
- Update `cost_actual_rub` for the associated milestone

**Record schema is in `.claude/shared/data-schemas.md`, section about `Data/costs/YYYY.jsonl`.** Do not invent your own set of fields: the file is aggregated by `/traction` and `/status`, and a record with other keys breaks the cost breakdown.

Required fields: `ts`, `kr`, `type`, `description`, `payment`, `cost_rub`, `clinic`, `visit_ref`.

For tests: `type` - `lab`, `clinic` - laboratory name, `payment` - `oms` for free testing (then `cost_rub` - `0`) or `private`. OMS testing is recorded too: the zero-cost line shows that the referral worked and distinguishes “free” from “not completed.”

## Related skills

| Skill | When |
|-------|-------|
| `/lab-order` | Before testing: where to go, whether OMS covers it, cost, preparation |
| `/labs` | After testing: interpretation, deviations, marker trends, impact on hypotheses |
| `/inbox` | Uploading files with results - PDF, scans, photos from `Inbox/` |

If the user asks to interpret a result, it is `/labs`, not this skill. If they ask where to repeat a test that has already been interpreted, come here again.

## Rules

- **OMS first** - show the free route before comparing paid prices, even if the user asks only about price
- Not a single price built into the skill. Each number is from a verified laboratory page, with the date of verification
- Prices may differ from current ones. Always indicate search date
- If the complex is cheaper than individual tests, recommend the complex and calculate the total with the complex
- Do not recommend the laboratory based on quality - only on price and convenience
- Links - only direct ones from laboratory sites (from WebSearch)
- Always add the cost of blood drawing to the total - at the verified price
- Write expenses according to the scheme from `.claude/shared/data-schemas.md`, including zero entries for compulsory medical insurance
- In Todoist: description - brief summary + checklist, comment - detailed links

**Completion criterion:** The OMS path is checked and shown first; for each test, state whether it is covered for free and what is required; every price in the results comes from WebFetch of the laboratory page or is marked “clarify”; blood collection is included in the total; the search date is stated; when recording an expense, the line contains all eight schema fields and the file remains valid JSONL.

⚕️ *Information is for reference only. Consult your physician for treatment decisions.*
