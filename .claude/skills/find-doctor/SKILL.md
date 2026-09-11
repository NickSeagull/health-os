---
name: find-doctor
description: |
  Search for a doctor or medical service - analysis of reviews, ratings, prices, distance. Comparison and recommendation.
  Triggers: “find a doctor”, “find [specialty]”, “where they see patients”, “find a good primary care physician”, “search for a doctor”, “find doctor”, “where to go for [specialty]”
---

# Find Doctor - search for a doctor and medical services

## Purpose

Find the best doctor for the desired specialty or medical service: aggregate data from review platforms, compare by rating, price, distance and accessibility. Offer the best option.

## User request

$ARGUMENTS

## Location and access to medicine

**Read from `Data/context/environment.json`, not from this file.** The address and insurance in the skill text become outdated the first time you move and are inconsistent with the data.

| What you need | Where to get it |
|-----------|--------------|
| City, district, street, nearest metro | `location.city`, `location.district`, `location.street`, `location.nearest_metro` |
| Insurance | `healthcare_access.insurance` |
| Is there voluntary health insurance and what kind | `healthcare_access.dms`, `healthcare_access.dms_details` |
| Ready to ride | `healthcare_access.travel_readiness`, `healthcare_access.max_travel_time_min` |
| Transport | `healthcare_access.preferred_transport` |

Below in the text `[metro]`, `[district]`, and `[city]` are substitutions from these fields.

If the file is missing or the required fields are empty, ask the user once, use the answer in the current search and offer to write it in `Data/context/environment.json` so as not to ask again.

## Workflow

### 1. Clarify the request

From the user message determine:
- **Specialty** (required) - primary care physician, orthopedist, gastroenterologist, etc.
- **Purpose of visit** (if specified) - specific complaint, examination, second opinion
- **Urgency** - planned / needed quickly
- **Budget** - if there are restrictions
- **Preferences**—doctor’s gender, age, specific clinic

If the specialty is unclear → ask. The rest is optional, do not interrogate.

### 2. Check existing contacts

Read `Data/doctors/contacts.json` → `doctors[]`.

**Doctor statuses:**

| Status | Meaning |
|--------|----------|
| `active` | Currently seeing the doctor or ready to return |
| `historical` | Was in the past: another city, childhood, one-time visit. Not discarding is the patient's experience |
| `rejected` | Refused to go again. Do not offer again |

Records without the `status` field are considered `historical`.

Search for doctors of the required specialty **any status except `rejected`**, and sort by case:

- **There is `active`** → “You already have [full name] at [clinic]. Are we looking for something new or joining him?”
- **There is only `historical`** → mention it and explain why it is not a ready-made option: “There was [full name] at [clinic] during [period] — [city, if not current]. Should we continue looking for someone new?”
- **There is `rejected`** → do not offer in search results; if the same doctor comes up in search results, tag “🚩 past refusal”
- **Nothing** → move on in silence

Filtering only by `active` is not suitable: now all records have the status `historical`, and such a step would never work.

Match specialties by substring rather than exact equality: the data contains “traumatologist-orthopedist, Ph.D.,” “neurophysiologist (EEG, REG),” and “pediatrician (local).”

Read `Data/doctors/visits/_index.json`:
- Have there been any visits to doctors of this specialty?
- If there were any → briefly: “Last visit: [date] with [full name] at [clinic].”

### 3. Two ways - compulsory medical insurance and private

**Always show both options:**

#### 3a. OMS path (priority)

WebSearch: `[specialty] under OMS [city] EMIAS appointment`

Replace placeholders with the requested specialty, service, and location.

Find out:
- Is this specialty available directly under compulsory medical insurance, or do you need a referral from a primary care physician?
- How to sign up through EMIAS / State Services
- The nearest clinics to `[metro]` with this specialist
- Approximate waiting times

If `healthcare_access.dms` contains `true`, add a third way: what is covered by VHI under `dms_details`.

#### 3b. Private path

Proceed to steps 4-7 below.

### 4. Search for doctors on platforms

**IMPORTANT: three-step verification!**

**Search radius:**
- Default: `[district]` + neighboring areas. Neighbors are determined by the map, not by the list in this file
- If the user is ready to travel further (`healthcare_access.travel_readiness`) → expand to the entire city. Add queries without reference to the metro: `[specialty] [city] ratings reviews`, `best [specialty] [city]`
- If the user is searching by price → be sure to search throughout the city: cheap options may not be nearby

**Stage 1 - WebSearch** (find candidates):

Parallel queries:

Replace placeholders with the requested specialty, service, and location.

- `site:prodoctorov.ru [specialty] [metro] [city] ratings`
- `site:prodoctorov.ru [specialty] [district] ratings`
- `site:docdoc.ru [specialty] metro [metro]`
- `site:napopravku.ru [specialty] [metro]`
- If the goal is specific: `best [specialty] [city] [goal] reviews`

From the results - collect 5-8 candidates with the URL of their profiles.

**Stage 2 - WebFetch aggregators** (ratings and reviews, NOT prices):

For each candidate → `WebFetch(profile_url)`:
- Rating (number + number of reviews)
- Work experience
- Clinic and address
- Nearest entry (if available on the page)
- Key reviews - patterns: what they praise, what they complain about
- **Name of the clinic and its domain** - will be needed for stage 3

⚠️ **DO NOT take prices from aggregators** - they are often outdated and misleading.

**Stage 3 - WebFetch official sites** (prices - ground truth):

For each top candidate (top 5):
1. WebSearch: `site:[clinic-domain] price-list` or `site:[clinic-domain] prices [specialty]`
2. WebFetch clinic price pages
3. Find the price of initial and repeat appointments

This is the **ONLY** authoritative price source. If the official website does not provide prices (timeout, no price list, price for the service not found) → write “⚠️ check by phone” in the table. **Do not substitute** the price from the aggregator.

**If a candidate is mentioned as “top” on several platforms** – increase priority.

#### Rules for working with prices

- **Aggregators** - ONLY for ratings and reviews. Their prices are often outdated. The list is in the “Search Platforms” section below, it is the only one. Any aggregator site not listed there is subject to the same rule
- **The official website of the clinic** is the ONLY source of prices. Search page "price" / "prices" / "cost"
- **Always distinguish the type of price:** for 1 tooth, for 1 jaw, complex (both jaws), per appointment, etc. Please indicate price TYPE in the table
- If the price is not found on the clinic’s website → write “check by phone”, DO NOT substitute the price from the aggregator
- When searching for a service (cleaning, MRI, etc.) - look for the price page of a specific service: `site:[clinic-domain] price-list [service]`

### 5. Analysis and scoring

For each candidate, calculate the conditional score:

**Base weights (default):**

| Factor | Weight | How to evaluate |
|--------|-----|---------------|
| Rating | 25% | Normalize to 5.0, take into account the number of reviews (>50 is more reliable) |
| Reviews (quality) | 25% | Patterns: attentiveness, accurate diagnoses, treatment result |
| Price | 20% | Normalize: cheaper = better (but not dumping) |
| Distance | 20% | Minutes from `[metro]` (metro/car) |
| Availability | 10% | Nearest appointment: faster is better |

**Adaptation of weights:** if the user has explicitly indicated a priority (for example, “price is the main thing,” “the main thing is close,” “the best specialist is needed”), redistribute the weights:
- Priority factor → 40%
- The remaining factors divide the remaining 60% in proportion to the base weights
- Example: user said “price is the main thing” → Price 40%, Rating 15%, Reviews 15%, Distance 15%, Access 15%

**Adjustments:**
- Few reviews (<10) → downgrade certainty, mark “⚠️ few reviews”
- Negative patterns in reviews (rudeness, mistakes) → red flag 🚩
- A doctor from a clinic where there are already other user doctors → bonus “convenience of one place”

### 6. Show to user

```markdown
## Search — [specialty] (search date: YYYY-MM-DD)

### Compulsory Medical Insurance Path
- [How to get in for free - directions, EMIAS, deadlines]
- Nearest clinic: [name, address]

### Private path - top candidates

| # | Doctor | Clinic | Rating | Reviews | Price (source) | Road | Score |
|---|------|---------|---------|--------|-----------------|--------|------|
| 1 | [full name] | [clinic] | ⭐ 4.8 (120) | ✅ good | 3,500 ₽ primary (website) | 15 min | 87 |
| 2 | [full name] | [clinic] | ⭐ 4.6 (230) | ✅ excellent | 5,000 ₽ complex (website) | 25 min | 82 |
| 3 | [full name] | [clinic] | ⭐ 4.9 (45) | ⚠️ little | clarify | 10 min | 78 |

### Details by candidate

#### 1. [full name] - [clinic]
- **Experience:** X years
- **Address:** [address], [how to get there from `[metro]`]
- **Price:** primary - X ₽, repeated - Y ₽
- **Record:** nearest [date] / [link to record]
- **What they praise:** [patterns from reviews]
- **What they are complaining about:** [if any]
- **Links:** [ProDoctors] [DocDoc]

#### 2. ...

### Recommendation
[Who to choose and why - taking into account the balance of price/quality/distance]
```

### 7. Actions after selection

When the user selects a doctor:

#### 7a. Save to contacts

The `Data/doctors/contacts.json` file is a wrapper object, not an array:

```json
{
  "version": 1,
  "doctors": [ … ]
}
```

**Add a new entry (append) to the `doctors[]` array. Do not touch the `version` field. Do not overwrite existing records.** Writing a doctor object to the root of the file will destroy both the wrapper and all 7 existing contacts.

Required fields are the same as for existing records:

```json
{
  "name": "[full name]",
  "specialty": "[specialty]",
  "clinic": "[clinic]",
  "period": "[YYYY - present]",
  "status": "active",
  "phone": "[if found]"
}
```

Additional fields that this skill adds (optional, old records do not have them - this is normal):

```json
{
  "address": "[address]",
  "source": "find-doctor",
  "found_date": "YYYY-MM-DD",
  "checked_date": "YYYY-MM-DD",
  "rating": { "prodoctorov": 0.0, "reviews_count": 0 },
  "price_initial": 0,
  "notes": "[brief notes]"
}
```

There is no `id` field in the file - don’t invent it. The doctor is identified by the pair `name` + `specialty`.

Before making an appointment, check if this doctor is already in `doctors[]`. If there is one, update its entry (`status`, `checked_date`, `price_initial`, `rating`), and not create a duplicate.

#### 7b. Create a task in Todoist
```
Task: “Make an appointment with [specialty] - [full name]”
Description:
  - Clinic: [name], [address]
  - Price: ~X ₽ (primary)
  - Record: [link or phone]
  - Purpose of visit: [if specified]
Priority: p3 (or p2 if urgent)
Due: [if the user specified a due date]
```

#### 7c. Link to milestone (if any)
If the search is related to the direction in `Data/goals/YYYY.json`:
- Update `cost_estimate_rub` based on doctor price
- Bind `todoist_task_id`

### 8. Search for a service (not a doctor)

If the user is looking not for a doctor, but for a service (MRI, ultrasound, procedure):

Adapt workflow:
- Instead of doctor profiles → look for clinics/centers with the service
- WebSearch: `[service] price [city] [metro]`, `site:prodoctorov.ru [service] ratings`
- Additional requests for prices:
  - `[service] [city] price price-list affordable [current year]`
  - `[service] [city] clinic ratings price comparison`
- For each found clinic - WebSearch price pages: `site:[clinic-domain] price-list [service]` or `site:[domain] prices [service]`
- Compare by: price (from the official website!), equipment (for MRI - Tesla), clinic rating, distance
- Compulsory medical insurance route: is the compulsory medical insurance service available, is a referral needed?
- Prices - only from the official websites of clinics (see “Rules for working with prices” in section 4)

## Search platforms

A unified list of aggregators is this one. It is referred to in the “Rules for working with prices” in section 4.

| Platform | URL | What do we take |
|-----------|-----|-----------|
| ProDoctors | prodoctorov.ru | Rating, reviews, experience, entry |
| DocDoc | docdoc.ru | Recording, reviews, rating |
| On the Correction | napopravku.ru | Reviews, rating |
| Yandex Maps | yandex.ru/maps | Clinic rating, reviews, distance |
| Dentistry.rf / stom-firms.ru | stom-firms.ru | Specialty aggregator for dentistry — clinic ratings and reviews |

From everyone - only ratings and reviews. Do not take prices from any of the platforms.

## If the network is unavailable

WebSearch or WebFetch may not work - there is no connection, the tool is unavailable, the site is closed to the agent.

- **WebSearch does not work** → search is not possible. Say this directly, do not invent candidates and do not substitute clinics from memory. Show what is available offline: doctors from `Data/doctors/contacts.json` in the required specialty and the general compulsory medical insurance route (referral from a primary care physician, registration via EMIAS). Suggest searching again later
- **WebFetch does not work with live WebSearch** → work on search results: candidates and their clinics - yes, ratings - marked “from search results, not verified”, prices - **no**. In the price column write “⚠️ check by phone.”
- **Some of the candidates did not open** → do not discard them silently, show them with the mark “page unavailable”
- Add the line “⚠️ Search incomplete: [what exactly didn’t work]” to the result header

Never fill a gap with a plausible fiction: a non-existent clinic with a fictitious price is worse than an honest “I couldn’t find it.”

## Freshness of saved data

`rating`, `price_initial` and `checked_date` in `contacts.json` are a snapshot on the date of inspection, and not a permanent property of the doctor.

| Post age | What to do |
|----------------|------------|
| Up to 3 months | Use as is, indicating the date of review |
| 3–12 months | Show with the note “data as of [date], may have changed.” Double-check the price on the clinic’s website if it influences the decision |
| More than 12 months | Consider obsolete. Do not show it as a fact - double-check or write “clarify” |

After rechecking, update `checked_date`, `price_initial` and `rating` in the existing record, rather than adding a new doctor.

Prices in `Data/goals/YYYY.json` → `cost_estimate_rub`, entered from the old search, also double-check when planning a visit older than 6 months.

## Rules

- **OMS first** — always show the free path, even if the user asks about a private one
- **Three-step verification** - ratings from aggregators (WebFetch), prices ONLY from the official websites of clinics. Aggregator prices are often out of date and misleading
- **Price - ground truth from the clinic’s website** - if the price is not found on the official website, write “check by phone”, do not enter aggregator data
- **Do not recommend unconditionally** - show facts, offer choice
- **Few reviews = low confidence** - always mark
- **Relevance** — indicate the search date, warn that prices may change. TTL of saved prices and ratings — see “Freshness of saved data”
- **Location - from data** - `Data/context/environment.json`, and not from the text of this file
- **Record in contacts - append to `doctors[]`** - do not touch the wrapper and `version`, do not overwrite existing entries
- **No data - just write it** - if the network is inaccessible, do not fill in the gaps with guesses
- **Do not call or record** - only find and suggest, record - user action

**Completion criterion:** The compulsory health insurance route is shown first and contains specifics (whether a referral is needed, how to sign up, deadlines); Each candidate has a price source indicated in the table or an honest “check by phone”; not a single price is taken from an aggregator; location is substituted from `environment.json`; if the doctor is saved, he is added to the `doctors[]` array with `checked_date`, and the file after recording remains valid JSON with the same `version`; all network failures are reflected in the result header.

⚕️ *Information is for reference only. Consult your physician for treatment decisions.*
