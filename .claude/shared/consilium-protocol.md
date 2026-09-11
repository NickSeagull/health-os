# Protocol of the consultation

> Mandatory for the `/consilium` skill and for all specialists participating in a multi-round analysis.

---

## Why this document

The parallel launch of specialists is not a consultation in itself. Twelve independent monologues stitched together by an orchestrator provide a set of opinions, not an analysis: no one checked anything, no one argued with anyone, a weak hypothesis looks exactly as convincing as a strong one.

A real consultation is a debate. Experts must challenge one another, put forward competing explanations, and arrive at a position that withstands criticism. An unresolved disagreement is a legitimate and valuable outcome. Artificial consensus is a defect.

---

## Block 0. What this consultation does not provide

Before describing the protocol, be honest about its boundaries, because the name
promises more than the mechanism can deliver.

**Fifteen agents are not fifteen independent doctors.** All of them
work on the same language model. Their errors are **correlated**: if the model
systematically overestimates some connection, it will overestimate it in the role of
cardiologist, neurologist, and devil's advocate. The consensus they reach is not
independent confirmation - it is one judgment expressed fifteen times in different words.

What the protocol **really** provides:

- different angles of view on the same data - specialties ask different questions
  to the same file
- a test for internal inconsistency: a conclusion that does not withstand
  substantive criticism is filtered out
- expansion of the set of hypotheses - there will be more of them, and the weak ones will receive
  objection
- explicit fixation of what remains unresolved

What it **doesn't** give:

- independent confirmation of diagnosis
- clinical validation - the system does not have a test kit with reference
  diagnoses, nor measured sensitivity and specificity
- substitution of medical judgment

**Practical conclusion.** The agreement of all experts only means that
the model is consistent, not that the conclusion is true. The value of the report is in the sections
“Unresolved disagreements” and “Data gaps”: it says what
the system does not know, and this is its most reliable part.

WHO recommends the use of such models as a supplement under human
control and separately warns about authoritative-sounding but incorrect
medical findings [WHO, guidance on ethics and management of LMM, 2024,
Level A].

---

## Block 1. Three rounds

| Round | Who works | What's going on |
|-------|--------------|----------------|
| **1. Independent opinions** | All selected specialists, in parallel | Everyone analyzes the data blindly, without knowing the conclusions of the others |
| **2. Cross criticism** | Only specialists whose zones overlapped on controversial finds | Everyone receives someone else's conclusions and is obliged to challenge them on the merits |
| **3. Resolution and synthesis** | Orchestrator in the main context | Resolution of disputes, verdicts, recording of unresolved issues |

**Why round 1 is blind:** if the specialist sees someone else's conclusion before he has formed his own, he anchors on it. The independence of the first round is a source of diversity in hypotheses; without it there will be nothing to argue about.

**Why round 2 is selective:** restarting everyone is expensive and pointless. Only those who have a subject of dispute go to the second round: intersection along a marker, axis, organ, or a competing hypothesis for one complaint.

---

## Block 2. Round 1 - independent conclusions

Standard analysis under specialist contract. Additional requirement:

**Each specialist is required to produce at least two competing hypotheses** in his area, indicating what distinguishes them. One hypothesis is a reason to send the conclusion for revision.

At the end of the conclusion a section is added:

```markdown
### Confidence and vulnerability
- **How confident:** high / medium / low
- **The weakest point of my conclusion:** [which is the easiest to challenge]
- **What will convince me:** [specific result or observation]
```

This section is the entry point for criticism in round 2. A specialist who honestly names a weak point saves the consultation a round.

---

## Block 3. Round 2 - cross-criticism

### Who to launch

The orchestrator forms pairs and groups based on the following characteristics:

- two or more specialists spoke about one marker, organ or axis
- hypotheses contradict each other or give different explanations for the same complaint
- one specialist flagged another
- one called the find significant, the other - insignificant
- a pattern from `cross-specialty-map.json` was triggered, affecting several

If there are no intersections at all, round 2 is skipped and this is recorded in the report.

### What does a specialist get?

The colleagues’ conclusions on the disputed topic, plus a direct task to challenge them.

### What I must return

```markdown
## Criticism - [specialty]

### What I agree with
- [Colleague's thesis] - I agree, because [justification based on data]. Level: [A/B/C/D]

### What I disagree with
- **I dispute:** [colleague’s thesis and whose]
- **Basis:** [specific data that contradicts]
- **My alternative:** [another explanation of the same data]
- **What will resolve this:** [specific research or observation]
- **Level of my objection:** [A/B/C/D/⚠️]

### What colleagues did not consider
- [An explanation that no one has put forward, although the data allows it]

### No substantive objections
[To be completed ONLY if after an honest check there is nothing to object to. Be sure to indicate what exactly was checked and why no objection was found. The empty formulation “I agree with everything” is not accepted]
```

### Rules of criticism

1. **Objection is based on data**, not opinion. “It seems to me that this is not so” is not an objection.
2. **Objecting for the sake of objecting is prohibited.** If after checking there is nothing to object, say so, explaining what was checked.
3. **The authority of the specialty is not an argument.** The cardiologist is not right by default in matters of the heart if the data says otherwise.
4. **Attack the strongest reading of someone else's thesis,** not the convenient simplified version.
5. **You can also challenge your own conclusion of the first round** if someone else’s data has refuted it. This is not a loss of face, but a normal course of analysis.
6. **The level of evidence of the objection is required.** A Level D objection does not overturn the Level A conclusion - it only raises the question.

---

## Block 4. Round 3 - resolution

Performed by the orchestrator. For each dispute:

### Verdict Rules

| Situation | Verdict |
|----------|---------|
| One position is based on a higher level of evidence | The higher level wins, the discrepancy is fixed |
| The levels are equal, but one position has a refutation criterion, while the other does not | The refutable wins - it is verifiable |
| Levels are equal, both are refutable, there is no data to differentiate | **Unresolved disagreement.** Both positions go into the report, a research arbiter is appointed |
| The dispute arose due to different units of measurement or different laboratories | Not a dispute, but an artifact. Normalize by `Data/labs/_marker-aliases.json` and rebuild |
| One relies on data older than 24 months, the other on fresh data | Fresh data wins |
| The position relies on the assertion from the prompt, not from `Data/` | Rejected: there are no facts about the patient in the prompts |

### Prohibition on artificial consensus

**An unresolved disagreement must be included in the report as is.** Reducing a dispute to an average formulation, hushing up the losing position, or declaring agreement where there is none is a direct violation of the protocol.

The value of an unresolved dispute is that it pinpoints exactly what research needs to be done next. Smooth wording destroys this information.

### Devil's Advocate

For the leading hypothesis of the consultation - the one that explains the most findings - an opponent is assigned from among the participants whose zone is least connected with it. His task is one: to try to overturn it.

If a hypothesis survives a targeted attack, its confidence increases. If it collapsed, the consultation saved the patient money and time on unnecessary examinations.

---

## Block 5. Report sections

Added to the standard council report format.

```markdown
### Discussion progress

**Round 1:** [how many specialists, how many hypotheses put forward]
**Round 2:** [who argued with whom and on what subject]

### Resolved disputes

| Subject of dispute | Position A (who) | Position B (who) | Verdict | Base |
|---------------|-----------------|-----------------|---------|-----------|

### Unresolved disagreements
> No smoothing here. This is the most useful part of the report - it shows what we don't know.

1. **[Item]**
   - Position A: [...] - [specialty], level [X]
   - Position B: [...] - [specialty], level [X]
   - Why not allowed: [no data / equal levels / referee needed]
   - **What will judge:** [specific research]

### Testing the leading hypothesis
- **Hypothesis:** [...]
- **Opponent:** [specialty]
- **Arguments against:** [...]
- **Resisted:** yes / no / partially
- **Overall confidence:** [increased / unchanged / decreased]

### Rejected hypotheses
| Hypothesis | Who nominated | Why rejected |
|----------|--------------|------------------|
```

---

## Block 6. Antipatterns

| Antipattern | Why is it prohibited |
|-------------|-----------------|
| Agree without checking | Turns the consultation into a set of monologues |
| Object without relying on data | Noise masquerading as discussion |
| Yield to a more “authoritative” specialty | Authority is no substitute for evidence |
| Attack a simplified version of someone else's thesis | Arguing with a straw man tests nothing |
| Announce consensus in case of unresolved dispute | Hides the main thing from the patient - what the system does not know |
| Smooth out the wording for the sake of a smooth report | Destroys information about what research is needed |
| Hold on to your hypothesis despite refutation | Destroys the evidence of the entire system |
| Skip round 2 because “everything is clear” | This is where the value of the consultation lies |

---

⚕️ The information is for reference only. Consult your doctor for treatment decisions.
