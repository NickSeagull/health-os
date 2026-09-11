# Source Verification

Required framework for any internet access. Read it **before the first search query**.

Previously, agents worked entirely offline. The rule allowed references to an organization or guideline but prohibited invented DOIs and article titles. The rule was sound, but costly: a system centered on evidence levels A–D could not verify whether a cited guideline was still in effect.

Specialists now have a narrow network channel. It exists for one purpose: **verifying a source**, not broadly searching for information about a disease.

---

## Block 1. Patient data must not enter queries

This is the primary restriction, with no exceptions.

A search query is **a question about the literature**, not about a person. It uses anonymized clinical terms and goes to third parties: the search engine and the website opened. No project privacy setting covers this channel.

### Prohibited query content

- First name, last name, initials, date of birth, or age precise to the day
- Medical record, insurance policy, or order number; phone number or email address
- Clinic, laboratory, or department name; the doctor's last name
- City and residential address
- **The patient's exact marker values**: combined with other details, they can make a query identifiable
- A rare combination of conditions that could identify the person

### How to rephrase

| Not allowed | Allowed |
|-------------|---------|
| `ferritin 23 male 34 fatigue Gemotest` | `ferritin deficiency without anemia adult male fatigue` |
| `dermoscopy for a patient with HPV and moles` | `dermoscopy indications atypical nevi guideline` |
| `TSH 5.4 subclinical hypothyroidism treat?` | `subclinical hypothyroidism treatment threshold guideline` |

A range instead of an exact value is acceptable if it comes from a guideline rather than the patient's lab result: `ferritin 15-30 ng/mL threshold` asks about a threshold, not a person.

### Show the query before sending

Before the first query in a session, show the user exactly what will leave the device and proceed only after confirmation. Subsequent queries on the same topic in that session need no repeated question, but must be logged.

---

## Block 2. Domain allowlist

Search is restricted to the domains below. **The restriction mechanism differs between the two tools, and the difference matters.**

| Tool | Restriction | Meaning |
|------|-------------|---------|
| `WebFetch` | `WebFetch(domain:…)` rules in `.claude/settings.json` | **Mechanically enforced.** If the domain is absent from the list, the page cannot be opened, regardless of the model's decision |
| `WebSearch` | The `allowed_domains` parameter in the call itself | **Instruction-based.** Search has no domain rules in permission settings; the model supplies the list by following this document |

This document previously called the restriction “mechanical, not a preference.” That is true for fetching pages, but not for search. If the model omits `allowed_domains`, the search covers the whole web. This is why the query log in Block 5 is mandatory: without it, the claim cannot be checked.

If that level of assurance is insufficient, disable search entirely by adding `WebSearch` to the permissions `deny` list. Specialists will still be able to open allowlisted pages through direct links, but will no longer search.

**Systematic reviews and databases:**
`cochranelibrary.com`, `pubmed.ncbi.nlm.nih.gov`, `ncbi.nlm.nih.gov`

**Guidelines and recommendations:**
`nice.org.uk`, `uspreventiveservicestaskforce.org`, `who.int`, `cdc.gov`,
`nih.gov`, `ema.europa.eu`, `fda.gov`

**Specialty societies:** society websites listed by specialty in `evidence-base.md`, including cardiology, endocrinology, hematology, and others.

The restriction has a practical reason. A naive symptom search often prioritizes clinic and aggregator SEO articles: they look authoritative, omit evidence levels, and are often written to sell a service. A poor source is worse than no source because it creates false confidence.

**Russian sources** are allowed only for regulatory matters: compulsory medical insurance (OMS), care pathways, and the national vaccination schedule. Explicitly label them as local rules rather than international clinical evidence.

---

## Block 3. What counts as verification

A finding supports a claim only if all of the following hold:

1. The page was actually opened and read, rather than merely appearing first in search results
2. Its domain is on the allowlist
3. The page's statement **matches** the agent's intended claim, rather than merely containing the same words
4. There is an **accessible URL** the user can check independently

If no supporting source is found, say so. “Could not verify” is a valid outcome, not a reason to leave a claim unmarked.

### Citation format after verification

```
[NICE, iron-deficiency anemia, guideline NG8, evidence level A]
https://www.nice.org.uk/guidance/ng8
```

Without a URL, keep the previous citation format: organization and topic, without specifics.

---

## Block 4. The ban on fabrication is strengthened, not removed

The original rule remains fully in force: **never invent a DOI, author, article title, or page number.**

There is now an additional requirement: specific details must have a URL that was opened. Specifics without a URL are still fabrication; lack of access is no longer an excuse.

A fabricated reference in a medical system is worse than no reference: it creates trust even when the reader does not check it.

---

## Block 5. Query log

Log every query in `Cache/research-queries.jsonl`:

```json
{"ts":"2026-08-06T12:00:00","skill":"consilium","agent":"hematologist",
 "query":"ferritin deficiency without anemia adult male","domains":["nice.org.uk"],
 "found":true,"url":"https://www.nice.org.uk/guidance/ng8"}
```

The log allows a later check of exactly what left the device. Without it, the statement “patient data does not enter searches” is unverifiable and therefore meaningless.

The log lives in `Cache/`, protected by `.gitignore`.

---

## Block 6. When not to access the internet

- **First consilium round.** Blinded opinions must be independent and reproducible. Search introduces differences between runs and gives all specialists a common source of anchoring. Verify sources in round two and during synthesis
- **Emergency finding.** Display a critical value immediately. Searching the literature while the user waits to learn about a panic value is harmful
- **The question is not about literature.** “What is my ferritin?” requires reading a file, not searching
- **Network unavailable.** Say so and continue offline, labeling claims in the previous manner. Lack of network access is not a reason to stop the review

---

## Block 7. Antipatterns

Every item is explicitly prohibited:

1. Including a patient's marker value, name, age, city, clinic, or laboratory in a query
2. Searching outside the domain allowlist
3. Citing a page that was not opened
4. Providing specifics—a DOI, author, or title—without an accessible URL
5. Treating keyword overlap as verification of a claim
6. Searching during the first consilium round
7. Delaying a critical-value alert to search
8. Failing to log a query
9. Failing to disclose that verification was unsuccessful
