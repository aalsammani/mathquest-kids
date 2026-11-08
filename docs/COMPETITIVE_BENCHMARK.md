# Competitive Benchmark: Early-Math Apps (K–Grade 3)

Research date: **2026-11-06**. Every source below was accessed on **2026-11-06**.

Purpose: to understand the current early-math app landscape so MathQuest Kids can differentiate honestly. MathQuest Kids is local-first and offline, with no ads, accounts, or analytics. It has four levels covering roughly Kindergarten to Grade 3 and ships on Android and iOS via Capacitor.

> **No copying.** This document records publicly observable features for strategic comparison only. **No proprietary code, art, characters, names, level designs, audio, UI layouts, or other protected designs from any product below may be copied or closely imitated.** MathQuest Kids must use original content and original visual identity. General pedagogical ideas, such as number lines or worked examples, are not owned by any vendor. Specific expressions of them are.

## How to read this document

Each claim is tagged with one of three labels:
- **[V] Verified feature:** documented as functionality on an official store listing, help page, or official product page, with the source URL. Store privacy labels and Data safety entries are developer-reported, and we record them as reported.
- **[M] Marketing claim:** promotional or efficacy language from the vendor, such as "adaptive," "proven," "personalized," or percentages. It is not independently confirmed.
- **[I] Independent evidence:** a third-party review, rating, or study, with authors, year, sample, and limitations.

Other conventions:
- **Not verified** means we looked but could not confirm the claim.
- Several help centers returned HTTP 403 to automated fetches: khankids.zendesk.com, support.splashlearn.com, prodigygame.zendesk.com, support.kahoot.com, and help.stmath.com. Items taken from their search-result snippets are marked "(snippet)."
- Google Play main listings did not render. Where available, the Play **Data safety** pages were used instead.
- Common Sense Education has paused its edtech reviews (pause notice at https://www.commonsense.org/education/reviews/kahoot-numbers-by-dragonbox). Common Sense **Media** app reviews and Common Sense **Privacy** evaluations were still available.
- Prices and ratings are US App Store values on 2026-11-06 and change frequently.

---

## 1. Comparison table

| Product | Math range (stated) | Adaptive? | Rewards model | Parent reporting | Ads | Account / data (per store labels) | Offline | Business model | Independent K–3 math outcome evidence |
|---|---|---|---|---|---|---|---|---|---|
| **Khan Academy Kids** | Ages 2–8, PreK–G2 [M] | Learning Path adjusts "based on student scores" [V] | Collectible prizes for characters [I-CSM] | Limited [I-CSM] | None [M] | No data linked to user. Not-linked: identifiers, usage, contact, diagnostics [V] | Partial (downloadable books/games) [V] | Free, non-profit [M] | None found. The RCT measured **pre-literacy**, not math [I] |
| **SplashLearn** | PreK–G5 [V] | "adjusts difficulty" [M] | Coins, rewards, characters [V] | Progress tracking, weekly reports [V/snippet] | None ("No ads, no pop-ups") [M] | Linked: identifiers, usage, diagnostics. Play: approximate location, name, IDs [V] | Not verified | Subscription, about $7.99–$11.99/mo or $69.99–$89.99/yr [V] | Vendor-run ESSA Tier III correlational study [I-weak] |
| **Prodigy Math** | Grades 1–8 [V] | "adaptive algorithm" [M] | Fantasy RPG, pets, items, paid currency [V] | With membership [V] | Heavy in-game membership upsell [I] | Linked: contact, user content, IDs, usage, diagnostics. Play: some data **shared** for analytics [V] | Not verified | Free core plus memberships $12.99–$25.99/mo [V] | Correlational, Grade 4, ESSA Tier III, details second-hand [I-weak] |
| **Kahoot! DragonBox** (Numbers, Big Numbers, Algebra 5+) | Ages 4–9 (Numbers/Big Numbers); Algebra 5+ [V] | Not claimed for these apps [V] | Progression, resources, decorate worlds [V] | "progress reports" (Kahoot! Kids) [M] | "100% ad-free" [M] | Linked: contact, user content, IDs, usage, diagnostics [V] | Not verified | Kahoot! Kids subscription, $5.99/mo or $35.99/yr [V] | None for early apps. Algebra studies are Grades 7–8 [I] |
| **Todo Math** (Enuma) | Pre-K–G2, Level H "3rd Grade Basics" [V] | Not claimed. Placement test plus parent-set level [V] | Not detailed here | Parents Page with progress [V] | "no third party advertising" [M] | Not linked: email, user ID, device ID, usage [V] | "can be played without an internet connection" [M] | Free plus subscription $49.99–$99.99/yr [V] | None found [—] |
| **MathTango** (now Piknik / Sago Sago) | K–G5, ages 5–10+ [V] | "lesson plan wizard" [M] | Collect monsters, build island or starbase [V] | Not verified | "100% ad-free" [M] | Linked: purchases, email, user ID (incl. developer marketing). Not linked: coarse location, usage, diagnostics [V] | "without WiFi" [M] | Piknik subscription [V] | None found [—] |
| **Moose Math** (Duck Duck Moose / Khan Academy) | Ages 3–7, K–1 [V] | Not claimed | Build and decorate a city [V] | "Report Card" [V] | None [V] | Not linked: device ID, product interaction [V] | Not verified | Free [V]; last update Nov 2023 [V] | None found [—] |
| **ST Math** (MIND Education) | PreK–8 [V] | "Puzzles adapt" [M] | Visual puzzles with a guide character [M] | Built-in reporting [V] | n/a (school product) | School/district accounts | **No:** "high-speed internet connection for each device" [V] | School licence; homeschool currently free [V] | Grades 3–5/3–6 only: RCT null; quasi-experiment ES ≈ 0.13 [I] |
| **Bedtime Math** (non-profit) | Ages 3–9 [V] | Not claimed | Story problems at 3 levels [V] | — | None found | Not linked: usage, crash [V] | Not verified | Free [V] | Grade 1 study in *Science* (2015), frequent users only [I] |
| **MathQuest Kids** (ours) | K–G3, 4 levels | Transparent, rule-based mastery (planned) | Original, non-coercive (planned) | Independent-vs-assisted reporting (planned) | **None** | **No account. No data leaves device** | **Fully offline** | To be decided | **None yet** |

Legend: CSM means Common Sense Media. "I-weak" marks correlational or vendor-commissioned work.

---

## 2. Product-by-product detail

### 2.1 Khan Academy Kids (Khan Academy, non-profit)
Sources:
- K1 App Store: https://apps.apple.com/us/app/khan-academy-kids/id1378467217
- K2 Play Data safety: https://play.google.com/store/apps/datasafety?id=org.khankids.android
- K3 Official site: https://www.khanacademy.org/kids
- K4 Teacher guide (official Google Site): https://sites.google.com/khanacademy.org/khanacademykids/getting-students-into-the-app/three-ways-to-play
- K5 Common Sense Media: https://www.commonsensemedia.org/app-reviews/khan-academy-kids
- K6 Common Sense Privacy (khanacademy.org, not the Kids app specifically): https://privacy.commonsense.org/evaluation/khan-academy
- K7 Help (403; snippet): https://khankids.zendesk.com/hc/en-us/articles/360006764812
- K8 UMass release: https://www.massachusetts.edu/ada-exception-archive/new-educational-app-shows-promise-improving-pre-schoolers-pre-literacy-skills
- K9 Khan blog: https://blog.khanacademy.org/khan-academy-kids-improves-pre-literacy-skills-in-preschoolers-research-confirms/

**[V] Verified features**
- Curriculum organization (K4):
  - A Learning Path that "dynamically adapts to the level of each student, adjusting based on student scores."
  - A free-exploration Library.
  - Teacher assignments.
- Offline (K1): "No wifi? No problem!" Downloadable books and games. A help snippet (K7) describes an offline area of the Library, while full content needs a connection.
- Privacy, App Store label (K1): no "Data Used to Track You" and no "Data Linked to You." "Data Not Linked to You" lists Identifiers, Usage Data, Contact Info, and Diagnostics. The label shows "Made for Ages 0–5."
- Privacy, Play Data safety (K2):
  - "No data shared."
  - Collects app interactions, name, and email.
  - Encrypted in transit. Deletion can be requested. The developer commits to the Families policy.
- Guidance: Kodi the bear guides children and gives hints (K4).

**[M] Marketing claims (K3, K1)**
- "built for children ages 2 to 8, from PreK through 2nd grade."
- "over 4,000 standards-aligned Math, ELA, and Executive Functioning activities."
- "Created in collaboration with learning experts at Stanford."
- "personalized path."
- "100% free, no ads, no subscriptions."

**[I] Independent evidence**
- Common Sense Media (K5): activities are presented "based on age and past performance." Kids "earn prizes for their animal friends' collections." Parents get "limited feedback to track progress."
- Common Sense Privacy (K6): khanacademy.org rated 78%, "Warning" (2024-11-22). This applies to the parent organization's site, not specifically the Kids app.
- Arnold, D. H., et al. (2021), *Journal of Children and Media*, doi:10.1080/17482798.2020.1863239. Summarized via K8 and K9.
  - Design: an RCT with 49 children aged 4–5 from low-income families, 10 weeks of home use.
  - Finding: pre-literacy (TOPEL) rose from about the 34th to the 47th percentile.
  - **Limitations:** literacy only (the math content was not evaluated); small sample.
- No independent math-outcome study of the app was found.

**Mobile usability notes:** 4.8 stars from about 133K ratings (K1). There is a mismatch between the store age label (0–5) and the marketed range (2–8).

### 2.2 SplashLearn (StudyPad, Inc.)
Sources:
- S1 App Store: https://apps.apple.com/us/app/id672658828
- S2 Play Data safety: https://play.google.com/store/apps/datasafety?id=com.splash.kids.education.learning.games.free.multiplication.reading.math.grade.app.splashmath
- S3 Efficacy page: https://www.splashlearn.com/efficacy
- S4 ESSA blog: https://www.splashlearn.com/blog/splashlearn-achieves-essa-level-three-certification/
- S5 Common Sense Privacy: https://privacy.commonsense.org/evaluation/splashlearn
- S6 iKeepSafe: https://ikeepsafe.org/product/splashlearn/
- S7 Help (403; snippet): https://support.splashlearn.com/hc/en-us/articles/12275144246546-How-can-parents-track-the-child-s-progress-or-view-the-report

**[V] Verified features**
- Content (S1): "Covers Preschool to Grade 5." Topics include counting, shapes, and addition (PreK–K); place value and time (G1); multiplication and money (G2); division and fractions (G3).
- Rewards (S1): kids "collect coins, rewards, and new characters."
- Reporting:
  - "Real-time progress tracking and insights for parents" (S1).
  - A snippet (S7) says weekly reports count only curriculum (Math/ELA) time and exclude the "Game Zone."
- Privacy, App Store "Data Linked to You" (S1): Identifiers (User ID, Device ID), Usage Data, and Diagnostics. Purposes include "Developer's Advertising or Marketing," Analytics, and Product Personalization.
- Privacy, Play Data safety (S2):
  - "No data shared."
  - Collects approximate location, name, optional email, user IDs, device IDs, and crash data.
- Accessibility (S1): "The developer has not yet indicated which accessibility features this app supports."
- Business model (S1): free trial, then subscription. In-app purchases range from $7.99–$11.99 monthly to $69.99–$89.99 yearly. "No ads, no pop-ups."

**[M] Marketing claims (S1, S3)**
- "The app adjusts difficulty based on each child's progress."
- "personalized learning paths," "adaptive challenges."
- "proven to enhance learning outcomes."
- "80% of learners gain confidence within 4 weeks" (no source given).
- "Loved by 60M students."

**[I] Independent evidence**
- Common Sense Privacy (S5): 93%, "Pass," with Verified Seal (2025-10-28).
- iKeepSafe (S6): lists COPPA Safe Harbor, FERPA, and CSPC certifications.
- ESSA Tier III study (S4):
  - Design: run with Instructure and ICEIE, school year 2023–24, grades K–5, one North Carolina district, correlational.
  - Finding: more problems per week was associated with higher in-app mastery.
  - **Limitations:** vendor-commissioned; the outcome is the app's own mastery metric rather than an external test; no sample size reported; not causal.

**Offline:** not verified. **Usability:** 4.5 stars from about 32K ratings (S1).

### 2.3 Prodigy Math (Prodigy Education)
Sources:
- P1 App Store: https://apps.apple.com/us/app/prodigy-math-game/id950795722
- P2 Play Data safety: https://play.google.com/store/apps/datasafety?id=com.prodigygame.prodigy
- P3 Official site: https://www.prodigygame.com/main-en/
- P4 Membership page: https://webflow.prodigygame.com/main-en/membership
- P5 Research page: https://prodigygame.com/research
- P6 Common Sense Media: https://www.commonsensemedia.org/app-reviews/prodigy-math-game
- P7 Common Sense Privacy: https://privacy.commonsense.org/evaluation/prodigy
- P8 Fairplay FTC complaint (snippet): https://fairplayforkids.org/feb-19-2021-advocates-to-ftc-prodigy-math-game-preys-on-kids-and-families/
- P9 District Administration (snippet): https://districtadministration.com/?p=179705
- P10 Help (403; snippet): https://prodigygame.zendesk.com/hc/en-us/articles/201695627-In-Game-Student-Aids

**[V] Verified features**
- Range (P1): "Math Practice for Grade 1-8." Kindergarten is not covered.
- Game design (P1):
  - A fantasy role-playing game with character levels 1–100.
  - Battles against monsters or other players; pets and items.
  - Hints on questions.
  - A paid in-game currency ("Magicoin 530," $9.99).
- Business model (P1, P4):
  - Free core game.
  - Memberships: Core $12.99/mo or $74.99/yr; Plus $19.99/mo or $114.99/yr; Ultra $25.99/mo or $154.99/yr.
- Reporting (P1): membership lets parents "easily track learning progress."
- Accessibility (P10, snippet): a speaker icon reads questions aloud. The App Store lists no declared accessibility features.
- Privacy, App Store "Data Linked to You" (P1): Contact Info, User Content, Identifiers, Usage Data, and Diagnostics. Purposes include "Developer's Advertising or Marketing."
- Privacy, Play Data safety (P2): crash logs and app interactions are **shared** for analytics. User IDs and diagnostics are collected.

**[M] Marketing claims (P1, P3, P5)**
- "adaptive algorithm tailors math questions to each child's learning style and grade level." "Learning style" tailoring is not supported by learning-science consensus. That is our note, not Prodigy's.
- Aligned to "Common Core, TEKS and many more."
- "Up to 5x greater improvement."
- ESSA Tier 3 and Tier 4 badges.

**[I] Independent evidence**
- Common Sense Media (P6):
  - Educational value "some"; ages 7+.
  - Products & Purchases rated "a lot."
  - "Pressure to become a paid user."
  - The math is "standard dry math drill."
- Common Sense Privacy (P7): 92%, "Pass."
- Fairplay and 21 other groups, 2021 FTC complaint (P8, snippet): observed "16 unique membership ads and only four math problems" in 19 minutes of play. No FTC outcome was verified.
- Johns Hopkins correlational study ("Morrison, 2020"), reported second-hand (P9):
  - Design: Grade 4.
  - Finding: higher engagement was associated with 3–5% higher state scores.
  - **Limitations:** full report not opened; correlational; ESSA Tier III.

**Offline:** not verified. **Usability:** 4.8 stars from about 254K ratings (P1).

### 2.4 Kahoot! DragonBox (Kahoot! Kids family)
Sources:
- D1 DragonBox page: https://kahoot.com/home/learning-apps/dragonbox/
- D2 App Store, Kahoot! Numbers by DragonBox: https://apps.apple.com/us/app/kahoot-numbers-by-dragonbox/id1529174508
- D3 App Store, Big Numbers: https://apps.apple.com/us/app/id1529174828
- D4 App Store, Algebra: https://apps.apple.com/us/app/id1550574178
- D5 Play Data safety, Numbers: https://play.google.com/store/apps/datasafety?id=com.kahoot.numbers
- D6 Kahoot! Kids: https://kahoot.com/home/kahoot-kids/
- D7 Common Sense Privacy: https://privacy.commonsense.org/evaluation/Kahoot
- D8 Algebra Challenge: https://dragonbox.com/about/algebra-challenge
- D9 CMU summary of Long & Aleven: https://www.cmu.edu/homepage/computing/2014/spring/fun-and-games.shtml
- D10 Siew et al. (2016): https://eprints.ums.edu.my/18597/

**[V] Verified features**
- Product line (D1):
  - Numbers, ages 4–8: "what numbers are and how they work."
  - Big Numbers, ages 6–9: long addition and subtraction, base ten.
  - Algebra 5+.
  - Multiplication, 8+.
  - Algebra 2 and Geometry, 9+.
- Numbers (D2):
  - Numbers are manipulable characters that can be "stacked, sliced, combined, sorted, compared."
  - Covers addition and subtraction 1–20, "with no quizzes or mindless repetitions."
  - A strong concrete-to-symbolic design.
- Big Numbers (D3): resource trading, 6 worlds, decoration. "No third-party advertising."
- Business model (D2):
  - "REQUIRES A SUBSCRIPTION" to Kahoot! Kids, with a 7-day trial. In-app purchases of $5.99/mo or $35.99/yr.
  - The listing text also says "No in-app purchases," which conflicts with its own IAP section.
- Privacy, App Store "Data Linked to You" for Numbers (D2): Contact Info, User Content, Identifiers, Usage, and Diagnostics.
- Privacy, Play Data safety (D5): "No data shared."
- Accessibility (D2–D4): not declared.

**[M] Marketing claims**
- "100% ad-free" and "progress reports" (D6).
- Algebra Challenge (D8): "92.9% mastery" after 1.5 hours.
  - Design: 4,192 K–12 students, Washington State, 2013.
  - **Limitation:** self-selected participants, in-game measure, no control group.

**[I] Independent evidence**
- Common Sense Privacy (D7): 92%, "Pass" (covers Kahoot!, Kahoot! Kids, and DragonBox).
- Long, Y., & Aleven, V. (2017), *ACM TOCHI* 24(3), doi:10.1145/3057889 (D9).
  - Design: Grades 7–8, comparing DragonBox with an intelligent tutor (Lynnette).
  - Finding: DragonBox players solved more problems and enjoyed the game, but **tutor students scored higher on the post-test**.
  - **Limitation:** middle-school algebra, not K–3.
- Siew, Geofrey & Lee (2016), *Electronic Journal of Mathematics & Technology* 10(1) (D10).
  - Design: Grade 8, about 30 students per group, quasi-experimental.
  - Finding: gains in algebraic thinking.
  - **Limitations:** small sample; not randomized; not K–3.
- No independent outcome study of DragonBox Numbers or Big Numbers with children aged 4–8 was found.

**Offline:** not verified. **Usability:** about 4.6 stars across apps (D2–D4).

### 2.5 Todo Math (Enuma, Inc.)
Sources:
- T1 App Store: https://apps.apple.com/us/app/todo-math/id666465255
- T2 Common Sense Media: https://www.commonsensemedia.org/app-reviews/todo-math
- T3 Family Gaming Database: https://www.familygamingdatabase.com/accessibility/Todo+Math
- T4 Getting Smart (2014): https://www.gettingsmart.com/?p=46293
- T5 EdSurge (2019): https://edsurge.com/news/2019-05-15-the-5-year-15-million-global-learning-xprize-competition-is-over-here-s-who-won
- todomath.com did not render (script-only).

**[V] Verified features (T1)**
- Content:
  - "2,000+ interactive math activities for Pre-K through 2nd grade."
  - Levels A–H; Level H is "3rd Grade Basics" (basic division and fractions).
  - Topics: counting, calculation, logic, geometry, clocks, and calendars.
- Leveling: a placement test plus parent-set levels.
- Reporting: a Parents Page for progress and profiles, with cross-device sync.
- Languages: eight.
- Privacy, App Store "Data Not Linked to You": Usage Data, Contact Info (email), Identifiers (User ID, Device ID). No tracking.
- Business model: free with in-app purchases. Subscriptions of $49.99–$99.99 per year.

**[M] Marketing claims (T1)**
- "Common Core State Standards-aligned."
- "left-handed mode, help button, dyslexic font and other accessibility features." The same page's Accessibility section says the developer "has not yet indicated" supported features.
- "does not contain any third party advertising."
- "can be played without an internet connection."
- The team was a "co-winner of the Global Learning XPRIZE."

**[I] Independent evidence**
- XPRIZE (T5): the prize was shared by **Kitkit School** (a different Enuma product) and onebillion, after a field test in Tanzania. **Todo Math itself was not the entry.**
- Family Gaming Database (T3): documents about 20 accessibility features, including colour-blind friendliness, reaction time not being critical, playability without hearing, and an OpenDyslexic font option.
- Getting Smart (T4, 2014; dated): a left-handed option, a dyslexia font, and read-aloud.
- Common Sense Media (T2): age 5+; educational value "a lot." Drag-and-drop and handwriting input "can be tricky at first."
- No independent efficacy study was found.

### 2.6 MathTango (Originator, now listed under Piknik / Sago Sago Toys)
Sources:
- M1 App Store (current): https://apps.apple.com/us/app/id6475483877
- M2 Old listing, now 404: https://apps.apple.com/us/app/mathtango/id1234698308
- M3 Common Sense Media: https://www.commonsensemedia.org/app-reviews/mathtango

**[V] Verified features (M1)**
- Status: the original listing (M2) is gone. The current listing names seller "Sago Sago Toys Inc." and developer Piknik, "© 2024 Originator Inc."
- Content:
  - "Kindergarten to Grade 5 Math," ages 5–10+.
  - Addition, subtraction, multiplication, and division.
  - "over 500 games across 40+ levels," with review levels.
- Game design: collecting monsters, missions, building an island or starbase; multiple profiles.
- Privacy:
  - "Data Linked to You": Purchases, Email, User ID. Purposes include developer advertising and marketing.
  - "Not Linked": Coarse Location, Usage, Diagnostics.
- Business model: subscription with free trial (Piknik plans).
- Accessibility: "developer has not yet indicated."

**[M] Marketing claims (M1)**
- "lesson plan wizard."
- Common Core-based progression.
- "100% ad-free."
- Playable "without WiFi."

**[I] Independent evidence**
- Common Sense Media (M3):
  - Age 6+; educational value "some."
  - Describes an "individualized curriculum path."
  - Some levels "can take quite a long time."
  - CSM says "more than 800" puzzles, which conflicts with the store's 500.
- No efficacy study was found. Parent reporting was not verified.

### 2.7 Moose Math (Duck Duck Moose; Khan Academy)
Sources:
- MM1 App Store: https://apps.apple.com/us/app/moose-math-by-duck-duck-moose/id660345152
- MM2 Common Sense Media: https://www.commonsensemedia.org/app-reviews/moose-math-by-duck-duck-moose
- MM3 TechCrunch (2016): https://techcrunch.com/2016/08/26/kids-app-maker-duck-duck-moose-joins-khan-academy/

**[V] Verified features (MM1)**
- Content:
  - Ages 3–7 in the description; the store label says "Made for Ages 0–5."
  - Five activities.
  - Counting by 1s, 2s, 5s, and 10s to 100.
  - Addition and subtraction within 20 using dice and a rekenrek.
  - K–1 geometry and length comparison.
- Rewards: building and decorating a city.
- Reporting: a "Report Card" for parents and teachers.
- Privacy, "Not Linked to You": Device ID and Product Interaction.
- Business model: free, "without ads or subscriptions."
- Maintenance: last update version 1.2.6 on 29 Nov 2023 ("some minor updates").

**[M] Marketing claims**
- Aligned to Common Core K–1.
- Developed with an education PhD advisor (MM1).

**[I] Independent evidence**
- Common Sense Media (MM2): age 4+; educational value "a lot." "Some of the hints and feedback could be more helpful." Page last updated in 2020.
- TechCrunch (MM3): Duck Duck Moose joined Khan Academy in 2016, and its apps became free.

**Notes:** Android availability and offline behaviour were not verified.

### 2.8 ST Math (MIND Education), school-focused reference point
Sources:
- ST1 Program page: https://www.mindeducation.org/programs/st-math/
- ST2 FAQ: https://2024.stmath.com/faq
- ST3 Rutherford et al. (2014): https://fpg.unc.edu/publications/randomized-trial-elementary-school-mathematics-software-intervention-spatial-temporal
- ST4 SRI/WWC-standards review: https://www.sri.com/publication/education-learning-pubs/stem-and-computer-science-pubs/st-math-nonregulatory-essa-standards-evidence-review-what-works-clearinghouse-standards-review/
- ST5 Evidence for ESSA: https://www.evidenceforessa.org/program/st-math/
- ST6 Bodner & Coulson (2021, MIND staff): https://info.mindresearch.org/hubfs/pdfs/research-results/ST-Math_RCT_2021_MR4.pdf

**[V] Verified features**
- Range: PreK–8 (ST1, ST2).
- Platform (ST2): browser-based, "not a standalone app" on iPad. Requires "a high-speed internet connection for each device," so it does **not** work offline.
- Reporting (ST2): "built-in reporting system."
- Business model (ST2): school licensing; homeschool access "currently available for FREE until further notice."

**[M] Marketing claims (ST1)**
- "visual puzzles"; concepts before symbols.
- "Puzzles adapt and build in complexity."
- "ESSA's highest evidence rating."
- "500,000+ students studied."

**[I] Independent evidence**
- Rutherford, T., et al. (2014), *Journal of Research on Educational Effectiveness* 7, 358–383 (ST3).
  - Design: a cluster RCT in 52 low-performing California schools, grades 2/3 and 4/5.
  - Finding: "negligible effect"; two years of treatment produced a non-significant effect.
- WestEd quasi-experiment, reviewed by SRI (Boyce, Wei & Wang, 2019) (ST4).
  - Design: grades 3–5.
  - Findings: ES 0.13 on scale scores and 0.17 on proficiency. Rated WWC "Meets Standards with Reservations" and ESSA Tier 2.
  - **Limitations:** commissioned by MIND; non-randomized.
- Evidence for ESSA (ST5): "strong" for grades **3–6**, average ES +0.07 across 4 studies. **No K–2 evidence.**
- Bodner & Coulson (2021) (ST6): a re-analysis of the RCT (16,307 students, grades 3–5) with g of about 0.06–0.10. **Not independent.**

### 2.9 Bedtime Math (Bedtime Math Foundation, non-profit)
Sources:
- B1 App Store: https://apps.apple.com/us/app/bedtime-math/id637910701
- B2 UChicago news on the *Science* paper: https://news.uchicago.edu/story/math-story-time-home-bolsters-achievement-school

**[V] Verified features (B1)**
- Ages 3–9; short story problems at three difficulty levels.
- Free.
- "Not Linked to You": usage and crash data.
- Last update in 2023.

**[M] Marketing claims (B1)**
- "proven to boost kids' math skills an extra three months in one school year."

**[I] Independent evidence**
- Berkowitz, T., Schaeffer, M. W., Maloney, E. A., Peterson, L., Gregor, C., Levine, S. C., & Beilock, S. L. (2015). Math at home adds up to achievement in school. *Science*, 350(6257), 196–198 (B2).
  - Design: 587 first-graders; the control group used a reading app.
  - Finding: frequent users gained about three months, most for children of math-anxious parents.
  - **Limitations:** the benefit was concentrated in frequent users; it is a parent-child co-use app, not independent practice.
  - The 2018 follow-up is not verified from the paper.

---

## 3. Cross-cutting observations

1. **Strong independent K–3 math outcome evidence is scarce across the category.**
   - The only randomized trials found were Khan Kids (literacy, not math), ST Math (Grades 2–5, null RCT), and Bedtime Math (Grade 1, parent co-use).
   - Most "research-based" and "ESSA" claims are Tier III correlational studies, often commissioned by the vendor.
2. **"Adaptive" is ubiquitous and opaque.** No product we checked publicly explains *how* difficulty or mastery is decided, beyond Khan Kids' "based on student scores."
3. **Every major product ties progress to an account or profile identifiers.**
   - Store labels for SplashLearn, Prodigy, DragonBox, and MathTango show **data linked to the user**, including developer marketing purposes for several.
   - Khan Kids and Todo Math report only "not linked" data. Moose Math and Bedtime Math are the closest to minimal collection.
4. **Offline support is partial or unverified for most products.** ST Math explicitly requires internet. Khan Kids offers a limited downloadable subset.
5. **Reasoning activities are rare.** Most products emphasize practice, puzzles, and fluency. We found no documented find-the-mistake, explain-your-thinking, or compare-two-strategies modes in any product. Note this as "not found," not as proof of absence.
6. **Accessibility declarations are weak.**
   - Almost every App Store listing says the developer "has not yet indicated" accessibility features.
   - Todo Math is the notable exception in practice, per a third-party database.
7. **Monetization pressure varies widely.** It ranges from none (Khan Kids, Moose Math, Bedtime Math) to heavy (Prodigy, criticized by Common Sense Media and Fairplay).

---

## 4. Opportunities for MathQuest Kids

### 4.1 Genuine, original differentiators (to build and verify)

| Opportunity | Why it is differentiating | Evidence base (see section 5) | Caveat |
|---|---|---|---|
| **Reasoning modes:** "Find the mistake" (incorrect worked examples), "Explain your thinking" (choose or construct a reason), "Which way is smarter?" (compare two strategies) | No competitor we checked documents these | Booth et al. 2013; Adams et al. 2014; Rittle-Johnson & Star 2007; Rittle-Johnson 2006; WWC Woodward et al. 2012 (rec. 2 and 4); NCTM Practice 8 | Evidence is mostly Grades 3–8. Rittle-Johnson et al. 2009 suggests comparing methods can be less effective for novices, so introduce these modes gradually (mainly Levels 3–4) with heavy scaffolding and pre-reader-friendly formats |
| **Transparent, interpretable mastery:** show parents *why* a skill is "mastered" (e.g., "8 of the last 10 correct, across 3 days, without hints") | Competitors use opaque "adaptive" claims | Formative assessment (Black & Wiliam 1998); feedback (Hattie & Timperley 2007); spacing (Cepeda et al. 2006) | Simple rules are less "smart" than full knowledge tracing. Present this as honest rather than optimal |
| **Spaced retrieval built into review**, revisiting mastered skills over days | Most products advance linearly | Dunlosky et al. 2013; Roediger & Karpicke 2006; Cepeda et al. 2006 | Lab evidence comes mostly from older learners |
| **CRA progression in every skill** (objects → pictures/number line → symbols), fading explicitly | DragonBox does concrete well; few products make the fade explicit and skill-wide | Fyfe et al. 2014; Fuchs et al. 2021 (rec. 3–4, Strong) | Must be original art and interactions, not DragonBox-like characters |
| **Independent-vs-assisted reporting:** record whether an answer came after a hint, a worked example, or adult help ("assisted mode") | Not found in any competitor's documented reporting | Scaffolding (Wood, Bruner & Ross 1976); WWC progress monitoring (Frye et al. 2013) | Assisted mode must not make the app "designed to be used with an adult," which would exclude it from Teacher Approved |
| **Fully offline, no account, no data leaves the device** | Strongest possible privacy posture. Store labels can honestly say "Data Not Collected" / "No data collected" | FTC COPPA FAQ F.5; Apple and Google definitions of "collect" (see `research/POLICY_REFERENCES.md`) | No cloud backup or multi-device sync; progress is lost if the app is deleted. Offer an on-device export behind a parental gate |
| **No ads, no IAP pressure, no manipulative streaks** | Contrasts with Prodigy-style upsell | UK Children's code (nudge techniques standard); Apple 1.3 | Limits revenue options |
| **Accessibility as a first-class feature:** large targets, tap alternatives to drag, reduced motion, dyslexia-friendly font option, left-hand layout | Most competitors declare nothing on the App Store | WCAG 2.2 SC 2.5.7 and 2.5.8 | Must actually be tested with assistive tech before being claimed in store "Accessibility" declarations |

### 4.2 Honest areas where competitors are clearly stronger

- **Content volume:** Khan Kids claims 4,000+ activities across subjects, Todo Math 2,000+, and SplashLearn covers PreK–G5 in math and ELA. MathQuest's four levels will be far smaller. Depth and quality per skill must compensate.
- **Professional art, animation, and character design:** DragonBox, Khan Kids, Sago/Piknik, and Duck Duck Moose have professional studios behind them. We cannot match this and must not imitate it. Aim for a clean, consistent, original style.
- **Voice narration and pre-reader support:** Khan Kids (Kodi), Prodigy (read-aloud), and Todo Math (read-aloud) support non-readers. Kindergarten children cannot read instructions, so **narrated audio for every prompt is close to mandatory for Level 1.** It also likely affects Teacher Approved ratings, which consider "language and audio" quality.
- **Research validation:** Khan Kids has a published RCT (literacy) and ST Math has RCT and quasi-experimental studies. MathQuest has **none**. Do not make efficacy claims. Describe features as "informed by" research, cite sources, and consider a small, ethically run pilot later.
- **Teacher and classroom tooling:** SplashLearn, Prodigy, Khan Kids, and ST Math have teacher dashboards, assignments, and rostering. Being offline and account-free means MathQuest will not offer these.
- **Localization:** Todo Math offers eight languages and Khan Kids several. MathQuest's languages are to be decided.
- **Multi-device sync:** most competitors sync progress through accounts. This is a deliberate trade-off for us.

### 4.3 Claims MathQuest Kids should *not* make
- "Proven," "clinically shown," "X months of growth," or ESSA tiers. No evidence exists yet.
- "Adaptive AI" or "personalized to learning style." Learning styles are unsupported, and our mastery logic is rule-based.
- Comparative claims naming competitors.

---

## 5. Educational research and standards references

All sources were accessed 2026-11-06. DOIs were checked against Crossref and publisher, ERIC, or PubMed records. **Limitations matter:** most cognitive-science evidence comes from older students (Grade 4 to college), often in algebra. Cite it as general learning-science support, not as K–3 proof.

### 5.1 Standards and professional guidance
1. **Common Core State Standards for Mathematics.** National Governors Association Center for Best Practices & Council of Chief State School Officers (2010).
   - K: https://www.thecorestandards.org/Math/Content/K/introduction/
   - Grade 1: https://www.thecorestandards.org/Math/Content/1/introduction/
   - Grade 2: https://www.thecorestandards.org/Math/Content/2/introduction/
   - Grade 3: https://www.thecorestandards.org/Math/Content/3/introduction/
   - **Standards for Mathematical Practice:** https://www.thecorestandards.org/Math/Practice/
   - Summary: grade-level content standards (for example, K counting and cardinality; G3 multiplication within 100 and unit fractions) and eight practices, including MP3 "Construct viable arguments and critique the reasoning of others."
   - Limitation: consensus standards, not empirical findings about how to teach.
2. **NCTM (2014). *Principles to Actions: Ensuring Mathematical Success for All*.** Reston, VA: National Council of Teachers of Mathematics.
   - Product page: https://www.nctm.org/store/Products/Principles-to-Actions--Ensuring-Mathematical-Success-for-All/
   - Executive summary: https://www.nctm.org/uploadedFiles/Standards_and_Positions/PtAExecutiveSummary.pdf
   - Summary: eight effective teaching practices:
     1. Establish goals.
     2. Implement tasks that promote reasoning and problem solving.
     3. Use and connect representations.
     4. Facilitate discourse.
     5. Pose purposeful questions.
     6. Build procedural fluency from conceptual understanding.
     7. Support productive struggle.
     8. Elicit and use evidence of student thinking.
   - Limitation: a K–12 professional-consensus document.

### 5.2 IES / What Works Clearinghouse practice guides
3. **Frye, D., Baroody, A. J., Burchinal, M., Carver, S. M., Jordan, N. C., & McDowell, J. (2013).** *Teaching Math to Young Children* (NCEE 2014-4005). IES/WWC. https://ies.ed.gov/ncee/wwc/PracticeGuide/18
   - Summary: five recommendations:
     1. Teach number and operations via a developmental progression (Moderate evidence).
     2. Teach geometry, patterns, measurement, and data (Minimal).
     3. Use progress monitoring (Minimal).
     4. Teach children to view and describe their world mathematically (Minimal).
     5. Dedicate daily time to math (Minimal).
   - Limitation: preschool and kindergarten (ages 3–6) only; most recommendations have Minimal evidence.
4. **Fuchs, L. S., Newman-Gonchar, R., Schumacher, R., Dougherty, B., Bucka, N., Karp, K. S., Woodward, J., Clarke, B., Jordan, N. C., Gersten, R., Jayanthi, M., Keating, B., & Morgan, S. (2021).** *Assisting Students Struggling with Mathematics: Intervention in the Elementary Grades* (WWC 2021006). https://ies.ed.gov/ncee/wwc/PracticeGuide/26
   - Summary: six recommendations, all rated **Strong**:
     1. Systematic instruction.
     2. Clear, concise mathematical language.
     3. Concrete and semi-concrete representations.
     4. The number line.
     5. Deliberate instruction on word problems.
     6. Regular timed fluency activities.
   - Limitation: K–6 intervention for struggling students, not all learners. It is still the most K–3-relevant guide here.
5. **Woodward, J., Beckmann, S., Driscoll, M., Franke, M., Herzig, P., Jitendra, A., Koedinger, K. R., & Ogbuehi, P. (2012).** *Improving Mathematical Problem Solving in Grades 4 Through 8* (NCEE 2012-4055). https://ies.ed.gov/ncee/wwc/PracticeGuide/16
   - Summary: recommendations include:
     - helping students monitor and reflect on problem solving (Strong);
     - teaching visual representations (Strong);
     - exposing students to multiple strategies (Moderate);
     - helping students articulate concepts and notation (Moderate).
   - Limitation: Grades 4–8. Use it as support for Levels 3–4 reasoning modes only.

### 5.3 Concrete-representational-abstract (CRA) and concreteness fading
6. **Fyfe, E. R., McNeil, N. M., Son, J. Y., & Goldstone, R. L. (2014).** Concreteness fading in mathematics and science instruction: A systematic review. *Educational Psychology Review, 26*(1), 9–25. https://doi.org/10.1007/s10648-014-9249-3
   - Summary: progressing from concrete to abstract representations through explicit fading combines the benefits of both.
   - Limitation: mixed ages, mostly short-term studies; little K–3 classroom evidence.
7. **Witzel, B. S., Mercer, C. D., & Miller, M. D. (2003).** Teaching algebra to students with learning difficulties: An investigation of an explicit instruction model. *Learning Disabilities Research & Practice, 18*(2), 121–131. https://doi.org/10.1111/1540-5826.00068
   - Summary: students taught with CRA outperformed matched peers on algebraic transformation equations.
   - Limitation: Grades 6–7, students with or at risk for learning disabilities.
8. **Bouck, E. C., Satsangi, R., & Park, J. (2018).** The concrete–representational–abstract approach for students with learning disabilities: An evidence-based practice synthesis. *Remedial and Special Education, 39*(4), 211–228. https://doi.org/10.1177/0741932517721712
   - Summary: classifies CRA as an evidence-based practice for computation for students with learning disabilities.
   - Limitation: special-education populations.

### 5.4 Worked examples
9. **Sweller, J., & Cooper, G. A. (1985).** The use of worked examples as a substitute for problem solving in learning algebra. *Cognition and Instruction, 2*(1), 59–89. https://doi.org/10.1207/s1532690xci0201_3
   - Summary: studying worked examples led to faster learning and fewer errors than solving problems, but transfer to dissimilar problems was limited.
   - Limitation: secondary-school algebra students (exact grades not confirmed).
10. **Atkinson, R. K., Derry, S. J., Renkl, A., & Wortham, D. (2000).** Learning from examples: Instructional principles from the worked examples research. *Review of Educational Research, 70*(2), 181–214. https://doi.org/10.3102/00346543070002181
    - Summary: design principles including integrated example components, multiple examples per type, example and practice pairing, and self-explanation prompts.
    - Limitation: mostly older learners; benefits are greatest early in skill acquisition.

### 5.5 Retrieval practice and spaced practice
11. **Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J., & Willingham, D. T. (2013).** Improving students' learning with effective learning techniques. *Psychological Science in the Public Interest, 14*(1), 4–58. https://doi.org/10.1177/1529100612453266
    - Summary: rates practice testing and distributed practice as "high utility," and interleaving and self-explanation as moderate.
    - Limitation: focused on self-regulated study, with evidence mostly from older students.
12. **Roediger, H. L., & Karpicke, J. D. (2006).** Test-enhanced learning: Taking memory tests improves long-term retention. *Psychological Science, 17*(3), 249–255. https://doi.org/10.1111/j.1467-9280.2006.01693.x
    - Summary: testing produced much better retention after 2 days and 1 week than rereading, though rereading won at 5 minutes.
    - Limitation: college students recalling prose in the lab.
13. **Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006).** Distributed practice in verbal recall tasks: A review and quantitative synthesis. *Psychological Bulletin, 132*(3), 354–380. https://doi.org/10.1037/0033-2909.132.3.354
    - Summary: a meta-analysis (839 assessments, 317 experiments) showing spacing benefits; the optimal gap grows with the retention interval.
    - Limitation: verbal recall rather than math; mostly adults.

### 5.6 Formative assessment and feedback
14. **Black, P., & Wiliam, D. (1998).** Assessment and classroom learning. *Assessment in Education: Principles, Policy & Practice, 5*(1), 7–74. https://doi.org/10.1080/0969595980050102
    - Summary: a review of about 250 sources concluding that formative assessment substantially raises achievement.
    - Limitation: a narrative review, not a meta-analysis. The often-quoted effect sizes come from companion papers, so cite them with care.
15. **Hattie, J., & Timperley, H. (2007).** The power of feedback. *Review of Educational Research, 77*(1), 81–112. https://doi.org/10.3102/003465430298487
    - Summary: feedback is among the most powerful influences on learning, but its effects vary in direction depending on type. Task- and process-level feedback works better than praise about the self.
    - Limitation: a conceptual synthesis, not specific to young children or apps.

### 5.7 Scaffolding
16. **Wood, D., Bruner, J. S., & Ross, G. (1976).** The role of tutoring in problem solving. *Journal of Child Psychology and Psychiatry, 17*(2), 89–100. https://doi.org/10.1111/j.1469-7610.1976.tb00381.x
    - Summary: introduced "scaffolding": a tutor controls the elements of a task beyond the child's current capacity so the child can complete what they can manage.
    - Limitation: a block-construction task with young children (about ages 3–5; sample details from secondary sources), not math.

### 5.8 Error analysis and incorrect worked examples
17. **Booth, J. L., Lange, K. E., Koedinger, K. R., & Newton, K. J. (2013).** Using example problems to improve student learning in algebra: Differentiating between correct and incorrect examples. *Learning and Instruction, 25*, 24–34. https://doi.org/10.1016/j.learninstruc.2012.11.002
    - Summary: in classroom experiments, explaining incorrect examples, alone or combined with correct ones, especially improved conceptual understanding.
    - Limitation: high-school Algebra I with Cognitive Tutor.
18. **Adams, D. M., McLaren, B. M., Durkin, K., Mayer, R. E., Rittle-Johnson, B., Isotani, S., & van Velsen, M. (2014).** Using erroneous examples to improve mathematics learning with a web-based tutoring system. *Computers in Human Behavior, 36*, 401–411. https://doi.org/10.1016/j.chb.2014.03.053
    - Summary: middle-schoolers who found, explained, and corrected decimal errors outperformed controls on a delayed test, though not immediately.
    - Limitation: middle school; earlier related studies were mixed.

### 5.9 Comparing multiple strategies and self-explanation
19. **Rittle-Johnson, B., & Star, J. R. (2007).** Does comparing solution methods facilitate conceptual and procedural knowledge? An experimental study on learning to solve equations. *Journal of Educational Psychology, 99*(3), 561–574. https://doi.org/10.1037/0022-0663.99.3.561
    - Summary: comparing solution methods side by side improved procedural knowledge and flexibility over studying them sequentially.
    - Limitation: Grade 7 algebra.
20. **Rittle-Johnson, B., Star, J. R., & Durkin, K. (2009).** The importance of prior knowledge when comparing examples: Influences on conceptual and procedural knowledge of equation solving. *Journal of Educational Psychology, 101*(4), 836–852. https://doi.org/10.1037/a0016026
    - Summary: students without prior knowledge benefited less from comparing solution methods than from other comparison types.
    - Limitation: Grades 7–8. Important design caution for novices.
21. **Rittle-Johnson, B. (2006).** Promoting transfer: Effects of self-explanation and direct instruction. *Child Development, 77*(1), 1–15. https://doi.org/10.1111/j.1467-8624.2006.00852.x
    - Summary: prompting self-explanation improved transfer on mathematical equivalence problems.
    - Limitation: Grades 3–5, so it overlaps only MathQuest Level 4.

### 5.10 Early-math apps (context)
22. **Outhwaite, L. A., Faulder, M., Gulliford, A., & Pitchford, N. J. (2019).** Raising early achievement in math with interactive apps: A randomized control trial. *Journal of Educational Psychology, 111*(2), 284–298. https://doi.org/10.1037/edu0000286
    - Summary: a UK RCT with 389 children aged 4–5; 12 weeks of math apps produced larger gains than standard practice.
    - Limitation: one app suite (onebillion), ages 4–5 only.
23. **Outhwaite, L. A., Gulliford, A., & Pitchford, N. J. (2017).** Closing the gap: Efficacy of a tablet intervention to support the development of early mathematical skills in UK primary school children. *Computers & Education, 108*, 43–58. https://doi.org/10.1016/j.compedu.2017.01.011
    - Summary: 133 pupils showed immediate and 5-month sustained gains, especially low achievers.
    - Limitation: ages 4–7, three schools.
24. **Griffith, S. F., Hagan, M. B., Heymann, P., Heflin, B. H., & Bagner, D. M. (2020).** Apps as learning tools: A systematic review. *Pediatrics, 145*(1), e20191579. https://doi.org/10.1542/peds.2019-1579
    - Summary: 35 controlled studies show emerging evidence that apps can support early academic skills, especially early math.
    - Limitation: children under 6; heterogeneous studies with unclear risk of bias.
25. **Hirsh-Pasek, K., Zosh, J. M., Golinkoff, R. M., Gray, J. H., Robb, M. B., & Kaufman, J. (2015).** Putting education in "educational" apps: Lessons from the science of learning. *Psychological Science in the Public Interest, 16*(1), 3–34. https://doi.org/10.1177/1529100615569721
    - Summary: a framework holding that apps are educational when they foster active, engaged, meaningful, and socially interactive learning toward a learning goal.
    - Limitation: a conceptual framework, not an efficacy test.
26. **Berkowitz, T., Schaeffer, M. W., Maloney, E. A., Peterson, L., Gregor, C., Levine, S. C., & Beilock, S. L. (2015).** Math at home adds up to achievement in school. *Science, 350*(6257), 196–198. https://doi.org/10.1126/science.aac7427 (checked against Crossref; see also 2.9 and https://news.uchicago.edu/story/math-story-time-home-bolsters-achievement-school).
    - Summary: frequent parent-child use of a math story app was associated with higher Grade 1 math gains, especially for children of math-anxious parents.
    - Limitation: the benefit was concentrated among frequent users.

### 5.11 Not verified / gaps
- No WWC intervention report was found for any of the consumer apps above.
- Exact grade levels in Sweller & Cooper (1985) and the exact sample in Wood et al. (1976) were not confirmed.
- No peer-reviewed K–3 study was found that tests find-the-mistake, explain-your-thinking, or compare-strategies modes **inside a children's app**. MathQuest's reasoning modes are an informed extrapolation, not a validated design.
