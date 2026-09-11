# Visit title — specialty and month

## Initial appointment — YYYY-MM-DD

- **Date:** YYYY-MM-DD
- **Doctor:** Full name, or “—” if not specified in the document
- **Specialty:** Specialty (required by the current data format)
- **Clinic:** Name and address
- **Record number:** Optional
- **Appointment type:** Initial / follow-up

### Complaints

### Clinical diagnosis

### Examination plan

### Prescriptions

### Recommendations

### Follow-up

- Follow-up appointment:
- Follow-up tests:

<!--
Visit report template. Filename: YYYY-MM-DD_[specialty][_type].md
  [specialty] — Latin characters, kebab-case: therapist, cardio, neuro, ent, urology, gastro…
  [_type] — optional: consultation, ecg, mri-brain, ultrasound_thyroid…

The dashboard parses the fields “Date”, “Doctor”, “Specialty”, and “Clinic”
using regular expressions with these exact labels and the colon inside `**…**`.
Keep these literal field labels for compatibility; before changing them, check
Dashboard/lib/data/visits.ts.

The filename begins with an underscore, so it is treated as a service file:
it is excluded from visits/_index.json and from the “file count = total” invariant.
-->
