# Critical values and red flags

> Mandatory for `/labs`, `/inbox`, `/body`, `/mental`, and all AI specialists.

---

## Why this document exists

The system had a `critical` status and a rule to «recommend seeing a doctor for critical findings», but no criteria were defined anywhere. Emergency response had been declared but could not be implemented: a critical result found while processing a document would have been silently saved as an ordinary abnormality.

This document defines thresholds that stop the normal workflow.

**Important qualifications:**

1. Health-OS **is not a monitoring system** and does not replace emergency care. The thresholds below help avoid missing danger; they are not a diagnostic tool.
2. Thresholds **depend on the laboratory and method**. Always check the reference interval in the test file itself. The values below are commonly accepted adult guideposts.
3. Both the absolute value and the **rate of change** matter. A sudden hemoglobin drop of 30 g/L in a week is more concerning than a stable low value.
4. When in doubt, **escalate**. A false alarm costs little; a missed critical value does not.

---

## Block 1. What to do when a critical value is found

This sequence is mandatory and overrides any current workflow.

1. **Stop batch processing.** If processing multiple documents, interrupt the queue.
2. **Report the critical finding in the first message**, before any other results, tables, or summaries.
3. **Be specific:** name the marker, value, laboratory reference interval, and how far the threshold is exceeded.
4. **State the action directly:** see a doctor today or call emergency medical services, according to the tables below.
5. **Record an alert** in `Cache/alerts/YYYY-MM-DD.json` with `severity: "critical"`, using the schema in Block 5.
6. **Do not interpret or reassure.** Do not offer explanations such as «perhaps a laboratory error» — that is for a doctor to decide, not the system.

---

## Block 2. Critical laboratory values

Adult guideposts. Always check the specific laboratory's reference interval.

### Require emergency care

| Marker | Threshold | Why |
|--------|-------|--------|
| Potassium | < 2.5 or > 6.5 mmol/L | Life-threatening arrhythmias |
| Sodium | < 120 or > 160 mmol/L | Cerebral edema, seizures |
| Glucose | < 2.8 or > 22 mmol/L | Hypoglycemia, ketoacidosis |
| Total calcium | < 1.6 or > 3.5 mmol/L | Seizures, arrhythmias |
| Hemoglobin | < 70 g/L | Severe anemia, tissue hypoxia |
| Platelets | < 30 ×10⁹/L | Risk of spontaneous bleeding |
| Absolute neutrophil count | < 0.5 ×10⁹/L | Agranulocytosis, risk of sepsis |
| Troponin | above the laboratory threshold | Myocardial injury |
| INR | > 5 | Bleeding risk |
| Magnesium | < 0.4 mmol/L | Arrhythmias, seizures |

### Require seeing a doctor within 24 hours

| Marker | Threshold | Why |
|--------|-------|--------|
| Potassium | 2.5–3.0 or 6.0–6.5 mmol/L | Arrhythmogenic potential |
| Hemoglobin | 70–90 g/L | Significant anemia |
| Platelets | 30–50 ×10⁹/L or > 1000 ×10⁹/L | Hemostasis |
| White blood cells | < 1.5 or > 50 ×10⁹/L | Immunodeficiency or leukemoid reaction |
| Creatinine | > 400 µmol/L or twice the previous value | Acute kidney injury |
| ALT or AST | > 10 times the upper limit of normal | Acute liver injury |
| Total bilirubin | > 100 µmol/L | Jaundice, cholestasis |
| TSH | < 0.01 or > 100 mU/L | Thyrotoxicosis or myxedema |
| CRP | > 100 mg/L | Severe inflammation, sepsis |
| Ferritin | > 1000 µg/L | Iron overload, hyperferritinemia |
| Vitamin D | > 100 ng/mL | Risk of hypercalcemia from overdose |

### Qualitative critical results

| Finding | Action |
|---------|----------|
| Positive HIV, hepatitis B or C, or syphilis result | See a doctor. Do not interpret independently; confirmatory testing is mandatory |
| Pathogen growth from a sterile site (blood, cerebrospinal fluid) | Emergency care |
| Blast cells detected on a smear | Urgent hematology assessment |
| M-spike in protein fractions | See a hematologist within a week |
| C. difficile toxins | See a doctor; risk of pseudomembranous colitis |

---

## Block 3. Vital signs

| Measurement | Emergency care | See a doctor within 24 hours |
|------------|-----------|-------------------------|
| Blood pressure | ≥ 180/120 mmHg — **hypertensive crisis** | persistently 160–179 / 100–119 |
| Blood pressure | < 90/60 with fainting, confusion, or cold sweats | newly observed < 90/60 without symptoms |
| Resting heart rate | < 40 or > 150 bpm | persistently < 50 or > 120 |
| SpO₂ | < 90% | persistently 90–93% |
| Temperature | > 39.5 °C with altered consciousness or a rash | > 38.5 °C for more than three days |
| Weight | unintentional loss of > 5% of body weight in a month | loss of > 10% in six months |

**Important note on blood pressure:** a hypertensive crisis ≥180/120 is not merely «elevated blood pressure» but an emergency. With accompanying chest pain, shortness of breath, impaired vision or speech, or facial asymmetry, call emergency medical services immediately — these indicate target-organ damage.

---

## Block 4. Mental health red flags

This block has absolute priority. When triggered, the normal `/mental` workflow stops.

### Stop immediately and display support contacts

Triggered by any of the following:

- Mention of suicidal thoughts, intent, or a plan, however phrased, including indirect statements («I don't want to wake up», «everyone would be better off without me», «there is no point»)
- Mention of self-harm
- Mood score ≤ 2 on a ten-point scale
- Mood drop of 4 or more points in 24 hours
- Mood persistently ≤ 4 for seven days or more
- Mention of hopelessness together with insomnia and loss of interest

### What to display

```
⚠️ Your entry suggests that things are difficult right now. You should not have to face this alone.

Where to get help right now:
• 112 — unified emergency services number, available 24/7
• 103 — emergency medical services

Psychological support (Russia):
• 8 (495) 051 from a mobile, 051 from a landline — EMERCOM emergency psychological support, available 24/7 for adults
• 8-800-2000-122 — Children's Helpline: for children, adolescents, and their parents

If you are in another country, find a local crisis helpline:
findahelpline.com or befrienders.org

If you are thinking about hurting yourself, call now. Do not put it off.
```

After displaying this, record an alert with `severity: "critical"`. Do not continue the usual correlation and pattern analysis or give lifestyle and nutrition advice.

### Rules

- **Do not diagnose.** Do not say «you have depression».
- **Do not minimize or offer stock encouragement.** Phrases such as «everything will be fine» are inappropriate.
- **Do not delay the response.** The previous rule to «recommend a specialist after a week of persistently low mood» is too slow for an acute crisis.
- **Respond to the text, not just the score.** Always read the mood journal's free-text `notes` field for red flags.

---

## Block 5. Alert schema

Single path: `Cache/alerts/YYYY-MM-DD.json`.

Do not use `Cache/health/alerts/`: it appeared in some instructions by mistake. The only correct alert directory is `Cache/alerts/`.

```json
{
  "version": 1,
  "date": "YYYY-MM-DD",
  "alerts": [
    {
      "id": "alert_01",
      "ts": "YYYY-MM-DDTHH:MM:SS+03:00",
      "severity": "critical|high|medium|low",
      "type": "lab_critical|vital_critical|mental_crisis|medication|follow_up|recovery|other",
      "source": "labs|inbox|body|mental|coach",
      "title": "Brief description",
      "detail": "Exactly what was found, with numbers and the laboratory reference interval",
      "marker": "Marker or measurement name, if applicable",
      "value": null,
      "reference": "Laboratory reference interval, if applicable",
      "action": "What needs to be done",
      "acknowledged": false
    }
  ]
}
```

Writing rules: append to the file for that date rather than overwriting it; `id` increments within the day; do not create a duplicate when the same condition triggers again on the same day.

---

## Block 6. What this document does not do

- Replace a doctor or emergency care
- Provide an exhaustive list of dangerous conditions
- Account for individual characteristics, pregnancy, childhood, comorbidities, or medications
- Override the «no diagnoses» rule

No threshold being triggered **does not mean everything is fine**. Feeling unwell despite normal tests is a reason to see a doctor, not an argument against doing so.

---

⚕️ This information is for reference only. Consult a doctor for treatment decisions. If there are signs of an emergency, call 103 or 112.
