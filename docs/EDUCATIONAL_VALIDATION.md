# Educational Validation Framework and Pilot-Study Protocol

Software correctness is not learning effectiveness. **No data has been collected from children and no learning gains are claimed.** This document defines how the content should be reviewed by people, and gives a protocol for a future pilot. The pilot must not start without ethics review and parental consent.

## Part A: Expert content review (before any child testing)

| Dimension | Question | Method | Reviewer | Status |
|---|---|---|---|---|
| Content validity | Does each skill's item set measure its stated objective? | Rate 10 sampled items per skill (590 total) on a 1–4 alignment scale. Items rated below 3 are revised. | 2 elementary math specialists, independent ratings plus a reconciliation meeting | **Pending** |
| Curriculum coverage | Do Levels 1–4 cover the intended scope? Are there gaps? | Map against CCSS K–3 domains (see [CURRICULUM.md](CURRICULUM.md)) | Curriculum specialist | **Pending** (developer mapping only) |
| Reasoning quality | Do Explain, Mistake, Another Way and Detective items require reasoning rather than recall? Are the "mistake" scenarios realistic misconceptions? | Structured review using a checklist (plausible error, single clear flaw, constructive correction) | Math education researcher | **Pending** |
| Age appropriateness and reading load | Is the wording readable for each level? | `readingDemand` estimates, plus a read-aloud test with 3–5 children per level (separate consent) | Literacy specialist | **Pending** |
| Instruction clarity | Are lesson steps and worked examples clear and correct? | Think-aloud with teachers | 2–3 K–3 teachers | **Pending** |
| Assessment consistency | Do Skill Check results agree with an independent measure? | Pilot (Part B) | Researcher | **Pending** |
| Cultural and inclusion review | Are names, settings and stories inclusive and free of stereotypes? | Review of the story theme and name lists | 2 reviewers from varied backgrounds | **Pending** |
| Accessibility usability | Can children using assistive technology complete core tasks? | See [ACCESSIBILITY.md](ACCESSIBILITY.md), manual script | Accessibility specialist | **Pending** |

**Developer self-review done:** all 59 lessons, the story templates, and samples from every generator at difficulty 2 and 3 were read by the developer (an AI coding assistant working with the project owner). Wording defects were fixed (see [MATH_VALIDATION.md](MATH_VALIDATION.md)). This does not replace independent expert review.

## Part B: Pilot-study protocol (draft for ethics review)

**Title:** Feasibility and preliminary outcomes of MathQuest Kids, a reasoning-centered early-math app, for children aged about 5–9.

### Research questions
1. **Feasibility:** Can families use the app at home for 6 weeks? Measure retention, sessions per week, and technical issues.
2. **Usability:** Can children complete lessons, stories and Skill Checks independently? Measure task completion and help requests.
3. **Measurement:** Do Skill Check outcomes agree with an external, age-appropriate math measure of the same skills? Measure agreement and classification accuracy.
4. **Preliminary learning:** Do children show larger gains on targeted skills than a comparison condition? This is exploratory and not powered for efficacy.
5. **Reasoning:** Does performance on Explain and Find-the-Mistake items change over time?

### Design
A randomized **waitlist-control** pilot: the intervention group uses the app for 6 weeks while the control group continues usual activities, then gets access. If randomization is not feasible, use a single-group pre/post design and state the limitation explicitly.

### Participants and eligibility
- **Number:** about 40–60 children; this is feasibility-scale and not powered for efficacy.
- **Inclusion:** age about 5–9; a parent or guardian who reads English (the app is English-only); access to a phone, tablet, or computer.
- **Exclusion:** none based on ability. Children who use assistive technology are welcome, and accommodations will be documented.

### Ethical safeguards
- IRB or independent ethics approval **before** recruitment.
- Written **parental permission** plus age-appropriate **child assent**; children may stop at any time.
- No incentives tied to usage amounts, and no pressure on screen time. Keep the app's break reminders on.
- **Data minimization:** study data is collected by parent-initiated CSV export, keyed to a study ID; nicknames are replaced before analysis. No new data collection is built into the app, and the app stays network-free.
- Secure storage, access limited to the research team, and a retention period stated in the consent form.
- An adverse-event and complaint procedure (e.g., frustration or distress), and a mechanism for withdrawal and data deletion.

### Procedures
1. **Baseline (week 0):** a researcher administers a short standardized or curriculum-based math measure appropriate to the child's age, plus a parent questionnaire (prior app use, home math activities).
2. **Placement:** the child completes "Find my level"; the level used is recorded.
3. **Intervention (weeks 1–6):** families are asked for about 3 sessions per week of 10–20 minutes, and at least 1 Math Story Adventure per week. Family activities are optional.
4. **Midpoint (week 3):** a short usability interview with parent and child.
5. **Post-test (week 6):** the same measure as baseline (or a parallel form); export of app data; parent and child experience survey.
6. **Delayed follow-up (week 10, optional):** retention measure.
7. **Control group:** baseline and week 6 assessments; app access after week 6.

### Outcome measures
- **Primary (feasibility):** % of families completing 6 weeks; median sessions per week.
- **Secondary:**
  - Pre/post gain on the targeted skills;
  - agreement between Skill Check results and the external measure (κ / sensitivity / specificity);
  - independent-vs-assisted trends;
  - reasoning-item accuracy;
  - System Usability Scale (parent version) and a child smiley-face rating.
- **Engagement (descriptive only):** sessions, minutes, and break-reminder acceptances. These are **not** targets to maximize.

### Analysis plan
- Feasibility: descriptive statistics with 95% CIs.
- Learning: ANCOVA of post-test by group, with baseline as covariate. Report the effect size (Hedges' g) with a CI, and interpret it as **preliminary**.
- Measurement agreement: Cohen's κ for mastered vs. not mastered against an external cut point. Decision-consistency analysis of the 80% threshold.
- Threshold tuning: ROC analysis to inform (not finalize) the Practicing and Ready thresholds.
- Missing data: report attrition; use multiple imputation as a sensitivity analysis.
- Pre-register hypotheses and the analysis plan (e.g., on OSF) before unblinding.

### Limitations to state up front
Small sample; home-use variability; possible novelty effects; parent involvement as a confound; outcome measures that may not capture reasoning; English-only; families with devices only; and a developer-designed intervention, which calls for independent evaluation later.

## Part C: Claims policy

Until Parts A and B are complete and reported, product text and store metadata must **not** claim improved outcomes, "research-proven" or "evidence-based" efficacy, or any improvement in intelligence or critical thinking. It may say the design "draws on research about worked examples, retrieval practice, and explaining reasoning", with citations in [COMPETITIVE_BENCHMARK.md §5](COMPETITIVE_BENCHMARK.md).
