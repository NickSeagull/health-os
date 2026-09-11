# Sex differences in analysis

> Mandatory document for all AI specialists. Read together with `holistic-framework.md` and `specialist-contract.md`.

---

## Why this document

Sex changes three things: what conditions are likely, what tests are indicated by age, and how the same numbers are read. A specialist who does not take this into account systematically misses half of the diagnostic field.

Case in point. Declining ferritin in a woman of childbearing age is primarily a question about menstrual blood loss, and only then about the gastrointestinal tract. A man of the same age does not have a menstrual reason, so finding the source of blood loss in the gastrointestinal tract becomes a priority, not a backup option. Same numbers, different next steps.

---

## Block 1. Three different fields, not one

Three independent fields live in `Data/profile.json` → `basic`. They cannot be mixed.

| Field | Values ​​| What is affected by |
|------|----------|---------------|
| `sex` | `male` / `female` / `intersex` / `not_specified` | Reference intervals, screening programs, anatomical hypotheses |
| `gender_identity` | free text or `null` | Addressing a person. Does not affect the interpretation of laboratory results |
| `hormone_therapy` | object or `null` | **Shifts interpretation** - see Unit 5 |

**Why are they divided?** References and screening are tied to biology: whether there is a prostate or not, the risk of cervical cancer exists or not. Identity has nothing to do with this and serves another purpose - respectful treatment. To mix them into one field means either to give incorrect medical conclusions, or to address the person differently than he claims to be. Both errors are unnecessary.

**If `sex` is not specified** - do not guess. Say directly that some conclusions are impossible without this information, and list which ones. Silently assuming a man is how the system worked before, and this is a defect.

---

## Block 2. Screening by sex and age

Use international guidelines (USPSTF, WHO, and specialty societies). Specify intervals according to the current edition and national program.

### For everyone

> **About the designations.** The "USPSTF Recommendation" column contains the letters **USPSTF** scales, not the evidence scales of this project from `evidence-base.md`. These are different systems and should not be confused: in the USPSTF scale **grade D means “recommended not to be carried out”**, while in our grade D it means “mechanistic reasoning”. Own levels of evidence are always written with the words: “level of evidence B”.

| What | When | USPSTF Recommendation |
|-----|-------|---------------------|
| Blood pressure | from 18 years old, regularly | A - recommended |
| Lipid profile | from 20–35 years old by risk factors | B - recommended |
| Glucose or HbA1c | from 35 years old or overweight | B - recommended |
| Colorectal screening | from 45 years old | A - recommended |
| Hepatitis C | once in adulthood | B - recommended |
| HIV | once between ages 15 and 65 | A - recommended |

### Specific for women

| What | When | USPSTF Recommendation |
|-----|-------|---------------------|
| Cervical cytology | from 21 years old, every 3 years | A - recommended |
| Cytology + HPV | from 30 years old, every 5 years | A - recommended |
| Mammography | from 40–50 years, every 1–2 years | B - recommended |
| Densitometry | from 65 years of age or earlier with risk factors | B - recommended |
| Ferritin and iron for heavy menstruation | at any age | off USPSTF scale, level of evidence B |
| Thyroid function during pregnancy planning | — | off USPSTF scale, level of evidence B |

### Specific for men

| What | When | USPSTF Recommendation |
|-----|-------|---------------------|
| PSA | discussion from 50 years old, from 45 with family history | C - the decision is made individually together with the doctor |
| Abdominal aortic aneurysm | once at 65–75 years of age with smoking history | B - recommended |
| Screening for testicular cancer in asymptomatic individuals | — | **D - it is recommended NOT to carry out.** Not to be confused with contacting a doctor if a formation is detected: this is not a screening, but a diagnosis based on a symptom |

---

## Block 3. What differs in interpretation

**Reference intervals are taken from the analysis form** - the laboratory prints them according to the patient’s sex. Standards “from memory” are prohibited by the specialist’s contract. Below are not the values, but an understanding of why they diverge.

| Marker | The essence of the difference |
|--------|---------------|
| Hemoglobin, hematocrit, red blood cells | In men it is higher due to androgenic stimulation of erythropoiesis |
| Ferritin | In women of childbearing age it is lower due to regular blood loss. For them, the “lower limit of normal” often means a hidden deficiency |
| Creatinine, GFR | Depends on muscle mass, so calculation formulas take into account sex |
| Uric acid | In men it is higher; increases in women after menopause |
| Alkaline phosphatase | Rises during pregnancy due to the placental fraction |
| TSH | Target range during pregnancy is narrower than usual |
| Testosterone, estradiol, LH, FSH | Interpreted only in conjunction with sex, age and cycle phase |

---

## Block 4. Menstrual cycle phase changes the result

In women of childbearing age without hormonal contraception, a number of indicators depend on the day of the cycle. An analysis taken in the wrong phase cannot be interpreted.

| Indicator | When to take |
|------------|---------------|
| FSH, LH, estradiol | Days 2–5 of the cycle |
| Progesterone | Days 19–23, to confirm ovulation |
| Prolactin | 2–5 days, in the morning, at rest |
| Ferritin, iron | outside of menstruation |
| Hemoglobin | outside of menstruation or with appropriate adjustment |

**Rule:** if the day of the cycle is unknown, and the indicator depends on it, say so directly and do not draw conclusions. This is the same class of error as comparing values ​​from different laboratories without normalization.

---

## Block 5. Hormone therapy

The `hormone_therapy` field contains the type, duration, and drugs. It **changes expected values** and cannot be ignored.

| Situation | What's going on |
|----------|----------------|
| Estrogen therapy | Hemoglobin and hematocrit shift to female values; the risk of thrombosis increases; lipid profile changes |
| Testosterone Therapy | Hemoglobin and hematocrit increase until erythrocytosis; control required |
| Combined contraception | Affects SHBG, lipids, coagulation; masks the natural cycle |
| Menopausal Therapy | Shifts lipids, bone density, risk of thrombosis |

**Important about screening:** it is determined by the presence of an organ, not by hormonal status or identity. If the organ is in place, appropriate screening is indicated. If removed, not shown. This is the only correct criterion.

---

## Block 6. Typical reasons by sex

The most common explanations are listed - the one that is checked first, and not the only possible one.

### Iron deficiency

| In women of childbearing age | In men and women in menopause |
|-------------------------------|-------------------------------|
| **Menstrual blood loss is the number one reason.** Heavy or prolonged periods, fibroids, adenomyosis | **Gastrointestinal bleeding until proven otherwise.** Erosions, ulcers, polyps, tumors - endoscopy required |
| History of pregnancy and lactation | Malabsorption: celiac disease, atrophic gastritis, PPI use |
| Next - insufficient intake, malabsorption | Donation, taking anticoagulants |

**Practical consequence.** The question about the volume of menstrual blood loss is mandatory in case of iron deficiency in a woman of childbearing age, and is asked before referral for endoscopy. For a man, the situation is the opposite: the absence of a menstrual cause makes the search in the gastrointestinal tract a priority.

### Other common discrepancies

| State | Comment |
|-----------|-------------|
| Fatigue | Women are more likely to have iron deficiency and thyroid disorders; in men - sleep apnea and testosterone deficiency |
| Cardiovascular risk | In women it grows after menopause; symptoms of a heart attack are often atypical - nausea, shortness of breath, back pain instead of the classic chest pain |
| Osteoporosis | In women, earlier and more often due to a drop in estrogen; men are underdiagnosed |
| Autoimmune diseases | Significantly more often in women |
| Depression and Anxiety | More often diagnosed in women; in men they are often masked by irritability, alcohol, and somatic complaints |
| Urinary infections | In women they are common and usually uncomplicated; in men are rare and require a search for the cause |

---

## Block 7. Areas of responsibility

| Agent | Men | Women |
|-------|---------|---------|
| `urologist` | Kidneys, urinary tract, prostate, men's health | Kidneys and urinary tract. No prostate |
| `gynecologist` | Not applicable | Cycle, reproductive health, menopause, cervical and breast screening |
| `endocrinologist` | Testosterone, gynecomastia | Estrogens, PCOS, cycle-associated disorders - together with a gynecologist |

**Flag rule.** The flag is set only to an existing agent. If the required specialist is not in the system, say so in the “Data Gaps” section, rather than throwing a flag into the void.

---

## Block 8. Antipatterns

| Antipattern | Why is it prohibited |
|-------------|-----------------|
| Assume sex if not specified | This is exactly how the system worked before, and it's a defect |
| Deduce sex from name | A name does not define biology or identity |
| Use `gender_identity` to select references | References are tied to biology |
| Use `sex` to address a person | For this there is `gender_identity` |
| Ignore `hormone_therapy` when analyzing hormones and blood | Expected values ​​are biased, output will be incorrect |
| Interpret cycle-dependent indicators without cycle day | Same class of error as comparing different laboratories without normalization |
| Look for the source of iron deficiency in a woman’s gastrointestinal tract without asking about menstruation | The most common cause is missed |
| Cancel screening due to hormone therapy or identity | Screening is determined by organ availability |

---

⚕️ The information is for reference only. Consult your doctor for treatment decisions.
