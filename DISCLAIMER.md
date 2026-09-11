# Disclaimer and Terms of Use

**Read before installing.** By installing, copying, or using this software, you acknowledge that you have read this document and accept its terms.

---

## 1. This is not a medical device

The software **is not a medical device** within the meaning of the laws of any jurisdiction. It has not undergone registration, certification, clinical trials, or conformity assessment.

The software **is not intended** for:

- Diagnosing, preventing, monitoring, treating, or alleviating disease
- Making clinical decisions
- Replacing a doctor's consultation
- Use in professional medical practice
- Situations where a failure or error could harm health

It is a **personal record management tool**, legally comparable to a text editor or spreadsheet in which you keep notes about your health.

---

## 2. This is not medical advice

Nothing the software produces constitutes medical advice, a diagnosis, or a prescription.

The software is built on large language models. These models:

- **Make factual errors** and confidently present false statements
- May miss a significant abnormality or give undue weight to an insignificant one
- Cannot examine you and do not have your complete medical history or clinical context
- Do not and cannot bear professional responsibility

**A qualified doctor must make every decision about diagnosis, examinations, and starting or stopping medication.** Do not delay seeking medical care or disregard a specialist's recommendations because of this software's output.

**If you notice signs of a medical emergency, contact emergency services immediately.** The software is not a monitoring system and cannot call for help.

---

## 3. Noncommercial project

This is a **noncommercial** project. It is distributed free of charge under the MIT license, developed voluntarily, and unrelated to the provision of medical services.

- The authors do not provide medical services or practice medicine
- The project charges no fees, contains no advertising, and is not monetized
- The authors are not affiliated with drug manufacturers, laboratories, or clinics mentioned in the code or documentation
- References to specific laboratories, guidelines, or organizations are informational and do not constitute endorsements or partnerships

---

## 4. Use at your own risk

The software is provided **“AS IS”**, without warranties of any kind, express or implied, including fitness for a particular purpose, accuracy, completeness, or uninterrupted operation.

**You use the software entirely at your own risk and under your own responsibility.**

The authors, contributors, and copyright holders **are not liable** for any direct, indirect, incidental, or consequential damage, including but not limited to:

- Harm to health resulting from action or inaction based on the software's output
- Incorrect, incomplete, or outdated conclusions
- Loss, corruption, or disclosure of your data
- Consequences of incorrect configuration, installation, or operation
- Unavailability or failure of the software or its dependencies

Liability is limited to the maximum extent permitted by applicable law.

---

## 5. Data

### The project does not process your data

The software **has no backend service**, does not transmit your medical records to its authors, and does not collect telemetry. All files remain on your device.

The project's authors **do not have and cannot obtain access** to your data.

### You are responsible for your data

By installing the software and entering health information, **you become solely responsible for processing and protecting that information.** Your responsibilities include:

- Disk encryption and physical device security
- Backups
- Restricting third-party access
- Compliance with applicable personal-data laws in your jurisdiction
- The consequences of publishing, sharing, or leaking your files

The project provides technical isolation measures (local Git without a remote repository, an inverted `.gitignore`, and a dashboard bound to localhost), but **cannot guarantee data security**. Read `docs/SECURITY.md` before entering real information.

### Third-party data and family profiles

The system supports separate profiles for several people: spouses, children, and elderly parents. Processing **other people's** medical data is therefore a standard feature, not an edge case, and brings corresponding responsibilities for you.

**The other person has not accepted this document's terms.** You accept them when installing the software. Accepting for yourself does not mean you can accept on their behalf.

Before creating another person's profile, consider:

- **An adult must know** that their medical data is entered into this system, stored on your device, and transmitted to a language model API with each interaction. That is their decision, not yours
- **A child's profile** must be maintained by a legal representative. Once the child can decide for themselves, the question must be revisited; data entered years earlier does not disappear
- **An elderly relative** may formally agree without understanding what happens to the data. Formal agreement is not legally or ethically equivalent to informed consent
- **Medical data is a special category** in almost every jurisdiction, and processing another person's data is regulated more strictly than processing your own. The applicable requirements depend on your country

The profile's `consent` field **is not a legal document and proves nothing**. Its purpose is to ensure that the question is asked deliberately rather than silently skipped. A completed field does not establish a legal basis or transfer responsibility to the project's authors.

Responsibility for lawfully processing other people's data—including obtaining consent, meeting your jurisdiction's requirements, and handling the consequences of a leak—**rests entirely with you**.

Information about doctors—their names, workplaces, and consultation content—is also third-party personal data.

### Search queries

Specialists may access a limited list of domains (Cochrane, PubMed, NICE, USPSTF, WHO, and specialty societies) to verify cited sources.

The system is designed to **exclude patient data** from search queries: each query is framed as an anonymized literature question, shown to you before submission, and logged in `Cache/research-queries.jsonl`.

Nevertheless, this is **another channel through which information leaves your device**. Queries reach the search engine and visited website, which are not covered by this project's terms. The restriction is implemented through model instructions and a domain list; the mechanism is reliable but not absolute, like all language model behavior.

If this channel is unacceptable to you, disable it by removing `WebSearch` and `WebFetch` from the `tools` lists in `.claude/agents/*.md`. The system will continue working; references will remain at the “organization and topic, without specifics” level.

### Transmission to the language model

The software runs on top of Claude Code. **Your files' contents are transmitted to the model provider's API** with each interaction; otherwise, the system could not analyze them.

This is the main channel through which data leaves your device. The model provider, not this project, determines the processing terms. Read those terms separately and decide whether they are acceptable to you.

---

## 6. Demonstration data is synthetic

All bundled data is **fictional**. The demo dataset describes a nonexistent person; marker values were generated for illustration and do not belong to any real individual.

Any resemblance to real people, diagnoses, or test results is coincidental.

Demo values **are not clinical examples** and must not be used as a reference for interpreting your own results.

---

## 7. Medical content

Clinical information in the code and documentation—thresholds, reference intervals, and guideline links—is provided **for reference only** and may be inaccurate, incomplete, or outdated.

- Reference intervals depend on the laboratory and method. **Use the intervals on your own report**, not the software's values
- References to clinical guidelines carry no guarantee that the edition is current
- Emergency thresholds are indicative and **do not replace clinical assessment**
- Medicine changes; the project may lag behind current knowledge

---

## 8. Limitations of use

The software **is not intended** for:

- Use by people under 18 without a legal representative's involvement
- Use by healthcare professionals in their professional practice
- Maintaining patient records in a clinical practice
- Making decisions in emergencies
- Any use where failure could cause harm

---

## 9. Changes

These terms may change at any time without individual notification. The current version is in the repository. Continuing to use the software after changes constitutes acceptance of the new version.

---

## 10. If you disagree

If any term is unacceptable to you, **do not install or use the software**. Delete your copies.

---

## At a glance

| Question | Answer |
|----------|--------|
| Is this a medical device? | No |
| Does it replace a doctor? | No |
| Is this a commercial product? | No |
| Are there any warranties? | No; the software is provided “as is” |
| Who is responsible for the consequences? | The user |
| Who is responsible for data security? | The user |
| Can the authors see my data? | No; there is no backend service |
| Does data leave the device? | Yes, through the language model API with each interaction |
| Is the demo data real? | No, it is entirely fictional |

---

⚕️ **If you notice signs of a medical emergency, contact emergency services immediately.** This software is not a monitoring system and cannot call for help.
