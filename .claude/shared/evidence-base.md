# Evidence base - register of sources

> A mandatory document for all Health-OS AI specialists. Read before any analysis begins along with `holistic-framework.md`.

---

## Why this document

Medicine is a data-driven discipline. A statement without a source and without specifying the strength of the evidence in a medical context is no different from a guess, but it appears as a fact. This is more dangerous than a straight “I don’t know.”

The document asks where to get evidence, how to evaluate its strength, how to formalize a link, and what is strictly prohibited.

**Priority - international English-language sources.** Russian ones are acceptable only in specified cases (Block 6) and always with an explicit marking.

---

## Block 1. Hierarchy of sources

Look for evidence from top to bottom. I have dropped to a lower level - I must note this.

| Level | Source type | When to use |
|---------|---------------|--------------------|
| **1** | Systematic reviews, meta-analyses, clinical guidelines | Basic level for any recommendation |
| **2** | Guides of specialized international societies | When there is no systematic review on the issue |
| **3** | Selected RCTs, large cohort studies | When guidelines do not cover a question |
| **4** | Observational studies, case series | For hypothesis formulation only, not for recommendation |
| **5** | Mechanistic Reasoning, Expert Opinion, Extrapolation | Acceptable only if explicitly marked "Level D" |

---

## Block 2. Levels of evidence

Each meaningful statement is marked with a level. No marking means the claim has not been verified.

| Level | What's behind it | How to formulate |
|---------|------------------|-------------------|
| **A** | Systematic reviews and meta-analyses of RCTs, class I guidelines | “Proven”, “recommended by management” |
| **B** | Selected RCTs, large prospective cohorts | "Demonstrated in studies" |
| **C** | Observational, case-control, small series | “There is evidence that”, “associated with” |
| **D** | Expert opinion, mechanistic reasoning, extrapolation from another population | “Presumably”, “mechanistically expected” |
| **⚠️** | Own hypothesis without direct evidence base | “Hypothesis without direct evidence base” |

**Downgrade rule:** if the data were obtained from a different population (different age, sex, comorbidities), lower the level by one step and indicate the reason.

---

## Block 3. International general purpose sources

| Source | Domain | What to look for there |
|----------|-------|----------------|
| **Cochrane Library** | cochranelibrary.com | Systematic reviews are the gold standard |
| **PubMed/MEDLINE** | pubmed.ncbi.nlm.nih.gov | Primary literature, search by topic |
| **Europe PMC** | europepmc.org | Open access to full texts |
| **UpToDate** | uptodate.com | Clinical reviews (paid, but reputable) |
| **BMJ Best Practice** | bestpractice.bmj.com | Clinical management algorithms |
| **NICE Guidance** | nice.org.uk | UK guidelines including screening thresholds |
| **USPSTF** | uspreventiveservicestaskforce.org | Screening and prevention, with explicit levels of recommendations |
| **WHO Guidelines** | who.int/publications | Global guidelines, physical activity, nutrition |
| **StatPearls (NCBI Bookshelf)** | ncbi.nlm.nih.gov/books | Free peer-reviewed nosology reviews |
| **ClinicalTrials.gov** | clinicaltrials.gov | Ongoing studies, evidence status |
| **medRxiv** | medrxiv.org | Preprints - ⚠️ not peer-reviewed, grade C or better |

---

## Block 4. Sources by specialty

Each specialist must know his or her specialized guidelines and rely on them first.

| Specialty | Specialty sources |
|---------------|---------------------|
| **Cardiology** | ACC/AHA Guidelines, ESC Guidelines (escardio.org), SCORE2 (risk), ESH (hypertension) |
| **Endocrinology** | Endocrine Society Clinical Practice Guidelines, American Thyroid Association (ATA), ADA Standards of Care (diabetes), European Society of Endocrinology |
| **Hematology** | American Society of Hematology (ASH), British Society for Haematology (BSH), NCCN Guidelines (oncohematology), WHO Classification of Haematolymphoid Tumors |
| **Gastroenterology** | ACG, AGA, United European Gastroenterology (UEG), Rome IV Criteria (functional disorders), Maastricht Consensus (H. pylori) |
| **Neurology** | American Academy of Neurology (AAN), European Academy of Neurology (EAN), ICHD-3 (classification of headaches, ihs-headache.org) |
| **Urology** | American Urological Association (AUA), European Association of Urology (uroweb.org) |
| **Dermatology** | American Academy of Dermatology (AAD), EADV, British Association of Dermatologists (BAD) |
| **ENT** | AAO-HNS (entnet.org), American Academy of Sleep Medicine (AASM) - Apnea and UARS |
| **Orthopedics** | AAOS (orthoinfo.aaos.org), Scoliosis Research Society (SRS), SOSORT (Conservative Treatment of Scoliosis) |
| **Psychiatry** | APA Practice Guidelines, DSM-5-TR, ICD-11, NICE Mental Health Guidelines |
| **Dentistry** | American Dental Association (ADA), European Federation of Periodontology (EFP), FDI World Dental Federation |
| **Ophthalmology** | American Academy of Ophthalmology (AAO) Preferred Practice Patterns, IMI (myopia) |
| **Health coach** | ACSM (sports medicine), WHO Physical Activity Guidelines, AASM (sleep), EFSA/NIH ODS (nutrients) |

---

## Block 5. Reference and reference databases

| Base | Destination |
|------|-----------|
| **LOINC** | loinc.org - Uniform Laboratory Test Codes |
| **Testing.com (formerly Lab Tests Online)** | Reference intervals and clinical significance of markers |
| **NIH Office of Dietary Supplements** | ods.od.nih.gov - vitamins, minerals, dosages, interactions |
| **DrugBank / Drugs.com Interaction Checker** | Drug interactions |
| **MedlinePlus** | medlineplus.gov - Help |
| **Orphanet** | orpha.net - rare diseases |
| **OMIM** | omim.org - hereditary diseases and genes |

---

## Block 6. Russian sources - when acceptable

Used **only** in three cases and always marked “Russian source”:

1. **Regulatory and organizational issues** - referral procedure, compulsory medical insurance, benefits, patient routing. Here Russian documents are the only ones applicable.
2. **Reference intervals of a specific laboratory** - if the analysis was carried out in Hemotest or Invitro, the standards are taken from their methodology, because they depend on the measurement method.
3. **Lack of international equivalent** on a narrow issue.

| Source | Destination |
|----------|-----------|
| Rubricator of clinical recommendations of the Ministry of Health of the Russian Federation (cr.minzdrav.gov.ru) | Official Russian clinical guidelines |
| Laboratory manuals (Hemotest, Invitro, KDL) | Reference intervals for a specific method |

**Prohibition:** do not use Russian sources to substantiate therapeutic hypotheses if there is international guidance on the topic. If there is a discrepancy between Russian and international recommendations, indicate both and clearly name the discrepancy.

---

## Block 7. Link format

The link is placed immediately after the statement, in square brackets.

```
[organ or base, topic, year or range, level X]
```

Examples of correct formatting:

- `[ATA Guidelines, management of euthyroid autoimmune thyroiditis, level B]`
- `[Cochrane, selenium for autoimmune thyroiditis, level A — effect on antibody titer, but not on clinical outcomes]`
- `[ESC Guidelines, sinus tachycardia, level A]`
- `[mechanistic reasoning, level D]`
- `[⚠️ hypothesis without direct evidence base]`

**Required elements:** organ or base, topic, level. Year - if you know for sure.

---

## Block 8. Prohibition on link fabrication

This is the most important rule of the document.

**Specific details are only acceptable in conjunction with the URL from which you opened the page.**

You have a narrow channel to the network - a white list of domains from
`.claude/shared/source-verification.md`. It exists for one purpose:
confirm that the cited manual exists and states exactly what it says
what are you going to write.

This leads to a fork:

- **Source confirmed** - provide specifics and be sure to have a URL next to it
- **Did not check or could not check** - the previous mode is in effect:
  body and subject, without DOI, authors, page numbers and article titles

There is no third option. Specificity without a URL is fiction, and now he has
there is no excuse for lack of access.

This leads to strict restrictions:

| Prohibited | Allowed |
|-----------|-----------|
| Come up with article titles | Title - if the page is open, next to the URL |
| Indicate a DOI that you have not seen | DOI from the page you opened, along with the URL |
| Indicate page and volume numbers | Indicate year or range if sure |
| Name authors from memory | Referring to an authority and topic without specifics |
| Give an exact figure from a “research” if you are not sure | Giving a range and marking uncertainty |

**Rule of uncertainty:** if you are not sure that the source exists or that the data is current, write directly: “requires verification against a current source” and lower the level to D.

A fictitious link in the medical system is worse than no link: it creates false trust and can influence the real decision about treatment.

---

## Block 9. Rules of application

1. **Each recommendation has a level.** A statement without a level is considered unformed.
2. **Separate established knowledge from your own conclusion.** The crossover hypothesis you synthesize from the patient's data is always level D or ⚠️, even if every brick of it is level A.
3. **Point out the inconsistency.** If the evidence is controversial, say so, rather than choosing a convenient side.
4. **Celebrate obsolescence.** Medicine is changing. If you know that an area has been actively revised, note the need for reconciliation.
5. **Distinguish between statistical and clinical significance.** An effect can be significant and yet be useless in practice.
6. **Check applicability to the patient.** Data obtained in another age group, another sex or another population does not automatically transfer - lower the level and state the reason. Calculate the patient's age from `date_of_birth` to `Data/profile.json`.
7. **For laboratory norms, always indicate the source of the interval** - norms depend on the method and laboratory.
8. **Don't argue with Level A without reason.** If you propose a deviation from the guideline, justify why the particular case is out of scope.

---

## Block 10. Antipatterns

| Antipattern | Why is it prohibited |
|-------------|-----------------|
| Statement without level of evidence | The reader cannot distinguish fact from guesswork |
| Fictitious link, DOI, author or article title | Direct misinformation in a medical context |
| Passing Level D for Level A | Substitution of the strength of evidence |
| Russian source instead of an existing international guideline | Violates the priority of sources |
| Link to preprint not marked as not peer-reviewed | Increases confidence in unverified data |
| Transferring data from another population without downgrading | False applicability |
| Silence about conflicting evidence | Distorting the picture in favor of a convenient conclusion |
| Reference interval without specifying laboratory and method | The norm is not universal |

---

⚕️ The information is for reference only. Consult your doctor for treatment decisions.
