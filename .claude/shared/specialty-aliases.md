# Specialty aliases

> The single registry mapping conversational names to agent names. Used by `/consilium` and `/doctor-consult`. This table was previously duplicated in both files and had diverged.

---

## Mapping

| Aliases | Agent |
|--------|-------|
| `gastro`, `gastroenterologist`, `GI`, `gastrointestinal` | `gastroenterologist` |
| `hemato`, `hematologist`, `blood` | `hematologist` |
| `endo`, `endocrinologist`, `hormones` | `endocrinologist` |
| `uro`, `urologist`, `kidneys`, `prostate` | `urologist` |
| `gynecologist`, `gyn`, `women's health`, `cycle`, `periods` | `gynecologist` |
| `neuro`, `neurologist`, `headaches` | `neurologist` |
| `cardio`, `cardiologist`, `heart` | `cardiologist` |
| `derma`, `dermatologist`, `skin` | `dermatologist` |
| `ENT`, `ent`, `otolaryngologist`, `nose`, `throat` | `ent` |
| `ortho`, `orthopedist`, `spine`, `back` | `orthopedist` |
| `psychiatrist`, `psych`, `mental health`, `mood` | `psychiatrist` |
| `dentist`, `dental`, `teeth` | `dentist` |
| `ophthalmologist`, `ophthalmo`, `eyes`, `vision` | `ophthalmologist` |

`health-coach` is not included in this registry: it is not a diagnostic specialist. Invoke it through `/coach`.

---

## Automatic selection by question

When a question is asked without explicitly naming a specialty, select specialists by topic.

| Question topic | Specialists |
|--------------|-------------|
| Fatigue, lack of energy, unrefreshing sleep | `hematologist`, `endocrinologist`, `psychiatrist`, `ent`, `neurologist` |
| Headache, migraine, dizziness | `neurologist`, `orthopedist`, `ophthalmologist`, `cardiologist` |
| Palpitations, blood pressure, pulse | `cardiologist`, `endocrinologist`, `neurologist` |
| Skin, rash, itching, moles | `dermatologist`, `endocrinologist`, `hematologist` |
| Abdominal symptoms, heartburn, stools, bloating | `gastroenterologist`, `endocrinologist` |
| Urination, lower back or groin pain | `urologist`, `orthopedist` |
| Menstrual cycle, periods, women's health | `gynecologist`, `endocrinologist` |
| Pregnancy planning | `gynecologist`, `endocrinologist` |
| Menopause, hot flashes | `gynecologist`, `endocrinologist`, `cardiologist` |
| Mood, anxiety, concentration | `psychiatrist`, `endocrinologist`, `neurologist` |
| Sleep, snoring, apnea | `ent`, `psychiatrist`, `cardiologist`, `neurologist` |
| Weight, hormones, libido | `endocrinologist`, `urologist`, `gynecologist`, `psychiatrist` |
| Blood test review | `hematologist`, `endocrinologist`, `cardiologist` |
| Back, posture, joints, feet | `orthopedist`, `neurologist` |
| Teeth, gums, oral cavity | `dentist` |
| Vision, eyes | `ophthalmologist`, `neurologist` |

**Sex-aware selection.** Read `Data/profile.json` → `basic.sex` before assembling the panel:

- Invoke `gynecologist` only for `female`, or for `intersex` when the relevant organs are present
- Invoke `urologist` for any sex: kidneys and the urinary tract are universal. For women, the specialist does not assess the prostate
- For fatigue in a woman of reproductive age, add `gynecologist`: menstrual blood loss is the most common cause of iron deficiency, and without this specialist the hypothesis will not be considered
- If `sex` is unspecified, do not guess. Ask the user or assemble a panel without sex-dependent specialties, noting this in the report

**Selection rules:**

- When uncertain, it is better to include more specialists rather than fewer — cross-specialty findings are the value of the consilium
- The upper limit is **8 specialists** per run. If selection yields more, show the panel, explain the reasoning, and ask for confirmation
- If the topic is not recognized, show the available specialties and ask rather than guessing silently
