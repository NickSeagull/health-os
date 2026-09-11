# Pediatric Framework

Required when the patient is under 18. Calculate age from `profile.json` → `basic.date_of_birth` **at the time of the request**.

Read alongside `specialist-contract.md`, `holistic-framework.md`, and `critical-values.md`, not instead of them.

---

## Block 1. Pediatric reference intervals are not adjusted adult intervals

Many markers in a growing body differ from adult values in **direction**, not merely degree. A value indicating disease in an adult may be physiologically normal in a child, and vice versa.

This is neither a subtle distinction nor a rare case. Errors cause two equally poor outcomes: anxiety and unnecessary examinations when nothing is wrong, or missed problems hidden by apparently “normal” adult values.

**Rule: never apply an adult reference interval to a child's lab result**, even as an approximation or with a qualification.

---

## Block 2. Where reference intervals come from

Follow this order strictly:

1. **The age-specific interval in the lab file itself.** Pediatric laboratories print intervals by age group; this is the only source tied to the method and equipment
2. If the file contains an adult interval or no interval, **say so explicitly** and do not interpret the value quantitatively
3. Reference values “from memory” are prohibited, as for adults, but the cost of error is higher: pediatric intervals are subdivided by age, vary more between laboratories, and depend on the method

Without numerical reference intervals, you may describe the direction of an abnormality, identify the age-specific characteristics in Block 3, and state which interval is needed.

---

## Block 3. How pediatric markers differ from adult markers

These qualitative patterns identify **what** to check. Obtain numerical values from the lab file, not this document.

| Marker | Difference in children | Reason |
|--------|------------------------|--------|
| **Alkaline phosphatase** | Substantially higher than adult levels; peaks during rapid growth and puberty | Osteoblast activity in growing bone. The adult upper limit is not useful here [evidence level B] |
| **Leukocyte differential** | Lymphocytes predominate over neutrophils from approximately 1 week to 4–5 years; two physiological crossover points | “Lymphocytosis” in a three-year-old is usually normal for age [evidence level B] |
| **Hemoglobin** | High at birth, with a physiological nadir around 2–3 months, then a slow rise toward adolescent values | Transition from fetal to adult hemoglobin [evidence level B] |
| **Creatinine** | Substantially lower than adult levels; rises with muscle mass | Adult GFR formulas do not apply; pediatric formulas are needed [evidence level B] |
| **Lymph nodes** | Small palpable cervical and inguinal nodes are common | Active immune system maturation [evidence level C] |
| **Heart rate and respiratory rate** | Substantially higher than adult rates; decline with age | Tachycardia thresholds must be age-specific [evidence level B] |
| **Blood pressure** | Normal values depend on age, sex, and **height**, not a fixed threshold | Percentile tables; the adult 140/90 threshold does not apply to children [evidence level B] |
| **TSH** | Higher than adult levels in the first weeks, then falls toward childhood values | Postnatal adaptation [evidence level B] |
| **Vitamin D, iron, B12** | Requirements and deficiency thresholds differ; stores deplete faster | Growth and smaller reserves [evidence level B] |

Evidence sources: pediatric society guidelines and standard reference atlases. **Specific values, DOIs, and article titles are intentionally omitted**; see `evidence-base.md`.

---

## Block 4. Height, weight, and development — percentiles only

A child's absolute height and weight values are not meaningful in isolation. Interpret them through age- and sex-specific percentiles or z-scores: WHO growth standards for 0–5 years and WHO references for 5–19 years [evidence level A].

What is informative:

- **Position on the curve**: the percentile band
- **Changes between bands**: crossing two or more percentile lines upward or downward matters more than the position alone. A child consistently at the 10th percentile is usually healthy; a child dropping from the 50th to the 10th requires attention [evidence level B]
- **Height-to-weight relationship and BMI for age**: interpret “BMI 17” in a child through percentiles only

Write to `body-metrics.csv` as usual, but interpret using percentiles. Without a date of birth, do not calculate a percentile: explain the missing information instead of applying adult logic.

---

## Block 5. Vaccinations

Schedules are tied to age rather than calendar dates and differ between countries. Use the national schedule for the country of residence recorded in `Data/context/environment.json`.

- A missed dose usually **does not require restarting the course**; catch-up schedules exist [evidence level A]
- Minimum intervals apply between doses; a dose given too early may not count
- A discrepancy between actual dates and the schedule is a reason to show the record to a doctor, not independently conclude that revaccination is needed

The system identifies and displays discrepancies. A doctor prescribes the catch-up schedule.

---

## Block 6. Pediatric red flags

Check **before** routine analysis, alongside `critical-values.md`:

- Fever in a child **under 3 months**: urgent, regardless of how well the child appears [evidence level A]
- Refusal to drink, no urine for more than 8–12 hours, or no tears when crying: signs of dehydration
- Lethargy, unusual sleepiness, or difficulty waking
- A rash that does not blanch under pressure
- Difficulty breathing: chest retractions, grunting on expiration, or nasal flaring
- Seizures
- Arrest or regression in weight gain or development
- Sudden refusal to bear weight on a leg or an antalgic gait

For any of these, display the finding in the first message and recommend urgent medical assessment. Do not continue the normal workflow.

---

## Block 7. What changes in reasoning

Apply the entire holistic framework, accounting for the child's different life context:

- **Sleep schedule**: sleep needs are higher and strongly age-dependent; insufficient sleep may manifest as hyperactivity rather than sleepiness [evidence level B]
- **School and workload**: academic stress, bullying, and screen time
- **Nutrition**: food selectivity and actual dietary composition
- **Family environment**: conflict, divorce, or a new sibling. Children more often express psychosocial stress through physical symptoms than words [evidence level B]
- **Infection exposure**: preschool and school. In a preschooler, 6–8 respiratory episodes per year do not in themselves indicate immunodeficiency [evidence level B]
- **Growth spurts**: may explain leg pain, fatigue, and appetite changes

A child's complaint almost always comes through an adult. It is a secondhand account, not direct speech: clarify exactly what was observed rather than the narrator's conclusion.

---

## Block 8. System limitations for child profiles

State these explicitly without waiting to be asked:

- Adult screening recommendations (USPSTF and similar) **do not apply to children**, who have their own preventive care programs
- Pediatric medication doses depend on body weight or surface area. The system **does not calculate or verify pediatric doses**; a doctor does this
- Many medications and supplements commonly used by adults are contraindicated in children or allowed only above a specified age
- Psychiatric scales validated in adults do not apply to children

---

## Block 9. Antipatterns

Each item is prohibited. Any occurrence means the analysis is incomplete:

1. Applying an adult reference interval to a child's lab result
2. Labeling physiological lymphocytosis in a preschooler as abnormal
3. Interpreting alkaline phosphatase in a growing child using adult intervals
4. Assessing height or weight by absolute values without percentiles
5. Applying an adult blood pressure threshold
6. Calculating or confirming a pediatric medication dose
7. Applying an adult screening recommendation
8. Dismissing fever in a child under 3 months as routine
9. Treating an adult's account as a direct description of the symptom
10. Interpreting a value quantitatively when the lab file contains an adult interval instead of explicitly identifying that limitation

⚕️ This information is for reference only. A doctor makes the diagnosis. If there are signs of a medical emergency, contact emergency services.
