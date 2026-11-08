# MathQuest Kids — Initial Audit (v1.1 → v2.0 transformation)

**Audit date:** 2026-11-06
**Audited artifact:** `index.html` v1.1 (3,767 lines, single file; now preserved unchanged at `legacy/index-v1.1-original.html`). Older versions `legacy/index_v1.html` and `legacy/index_good_v.html` were inspected; neither one persists any data, so the only saved data that needs migrating is v1.1's `localStorage` keys `mq_profile`, `mq_settings`, `mq_lastGrade`.
**Restoration points:** `C:\Users\abdallah\Documents\mathquest-backups\mathquest-kids-original-20261106-174505.zip` (SHA-256 `2ee5216e…c487d`) and a local-only git repository (no remote) with baseline commit `e35055d`.

## How the audit was performed

1. Full manual read of all HTML, CSS (≈640 lines) and JavaScript (≈2,500 lines): Util, Store, Settings, Sound, Voice, Profile, Rewards, Nav, Visuals, GRADES/LESSONS, 37 question generators (`QGen`), WordProblems, Quiz, games, Collection/Shop, Gate, Dashboard.
2. Automated harness `scripts/audit-legacy.mjs` (Playwright + Microsoft Edge). It loads the original file on phone (390×844), tablet (820×1180) and desktop (1280×800) viewports, records console and page errors, saves screenshots to `reports/legacy-screens/`, and samples **3,000 questions from each of the 37 generators** (1,000 per difficulty). It writes the results to `reports/legacy-audit.json`.
3. Environment: Windows 11 Pro, Node 24.22.2 (portable), Microsoft Edge (Playwright `msedge` channel).

**Observed behavior that works:** no console or page errors on any viewport, and no horizontal scroll at phone width. Every sampled question offered unique options, and the correct answer was always present. The analog clock, fraction bars, arrays and ten frames are drawn programmatically and correctly. The app is ad-free, and the dashboard sits behind a gate.

## Severity scale

- **Critical**: the app teaches or scores mathematics incorrectly, misreports learning, or creates a privacy or safety risk.
- **Major**: a significant educational, accessibility, reliability or product defect.
- **Minor**: wording, polish, or a low-impact inconsistency.

## Findings

### Critical

| # | Finding | Location | Impact | Correction | Verification |
|---|---|---|---|---|---|
| C1 | **Unrelated fallback question.** If a generator throws, the quiz silently substitutes `a + b = ?`. The harness forced a fraction-generator failure and got `8 + 5 = ?` labelled "🧮 Math", which was then scored and counted toward fraction stars. | `Quiz.generate()` | Mastery and stars can come from questions unrelated to the skill. | New `safeGenerate()` retries inside the same skill, then tries an alternative generator for that skill, then exits gracefully. Failed items are never scored. A diagnostic is logged with no child data. | `tests/unit/safeGenerate.test.ts` (regression: "never falls back to unrelated addition") |
| C2 | **Questions with two correct answers (geometry).** A square appears with "rectangle" and/or "rhombus" among the options. Both are mathematically correct names for a square (CCSS 3.G.1 teaches exactly this). 264 of 3,000 `k_shapes` and 191 of 3,000 `g3_geo` samples were affected. | `QGen.k_shapes`, `QGen.g3_geo` | A child who answers correctly is marked wrong. | Shape questions ask for the *most specific* name, or exclude the superordinate names. The validator checks every option against a shape-property model (`isA`). | `tests/property/geometry.test.ts`; `npm run validate:math` |
| C3 | **Mastery awarded from weak and assisted evidence.** One 8-question session at ≥75% sets `mastered = true` permanently. Hint use is not recorded, and `Profile.record` has no hint flag. The same question can repeat across sessions. | `Quiz.finish`, `Profile.record` | The parent report overstates proficiency, and mastery cannot distinguish independent from assisted work. | Evidence-based skill model (`src/learning/mastery.ts`). Each attempt records hint use, attempt number, difficulty, mode and question signature. Mastery requires a hint-free assessment across varied items, and *retained* mastery requires a delayed reassessment. | `tests/unit/mastery.test.ts` (hint-assisted items never count as independent; repeats ignored; a guess-prone 2-option item is weighted 0.5) |
| C4 | **Comparison stories drawn as take-away.** In "A has 8 and B has 3. How many more does A have than B?" the visual shows 8 objects with 3 crossed out, which is a separation model, not a comparison model. 346 of 3,000 `k_stories` and 219 of 3,000 `g1_stories` samples were affected. | `WordProblems.gen` (visual selection) | Misrepresents the mathematical relationship. | A comparison story uses a two-row matching ("compare bars") visual. Each story type maps to a model that fits its structure. | Story validator checks `visual.kind` against the problem structure |

### Major

| # | Finding | Location | Impact | Correction | Verification |
|---|---|---|---|---|---|
| M1 | **Keyword-driven strategy teaching.** Hints such as "…are being put TOGETHER — that means add!", "going AWAY — that means subtract!" and "Sharing equally means divide!" appeared on 9,111 of 12,000 story samples. Lesson text says "Spending, losing, or comparing → subtract." | `WordProblems.gen`, `LESSONS.*_stories` | Teaches a keyword shortcut that fails on many problems (e.g., "Ana has 5 more than Ben…"). | Hints now ask about the *situation* ("What do we know? What are we finding? Is the total known?"). The Math Story Adventures flow is Understand → Plan → Solve → Check → Explain. | Lint test: no generator hint contains keyword-rule phrases |
| M2 | **Streak counts app launches, not practice.** `Profile.load()` calls `touchStreak()`, so opening the app extends the "days practiced" streak. The 🔥 streak in the top bar and the "Habit Hero" badge also create streak pressure. | `Profile.load`, `touchStreak` | Inaccurate reporting and manipulative engagement pressure. | Practice days are recorded only when a scored item is completed. The child UI shows "days practiced this week" with no loss messaging and no streak-loss UI. | `tests/unit/profile.test.ts` (regression: load does not record practice) |
| M3 | **Random "treasure chest" reward** (8–20 coins at random after 5 in a row). | `Quiz.chest` | A variable-ratio reward resembles a loot box and rewards speed and streaks, not reasoning. | Removed. A fixed **Persistence** reward is given for solving after a first incorrect try, plus badges for reasoning modes. | Code review; `tests/unit/rewards.test.ts` |
| M4 | **Exit message is inaccurate.** "Your coins are saved, but the round will not count." In fact every answered item had already been written to the topic stats. | `Quiz.confirmExit`, `Profile.record` | Misleads the child and parent. | Wording now matches behavior ("Answers so far are saved. Stars are only given for finished rounds"). | E2E `exit-midway` test |
| M5 | **CSV export is not a valid single table.** One file contains two tables with different headers. The file has no UTF-8 BOM, so "−", "÷" and "¢" show as garbled characters in Excel. Grade labels are unquoted. | `Dashboard.exportCSV` | Data export is unreliable for parents and teachers. | Separate RFC 4180 CSVs (skills, attempts) with a BOM and full quoting, defused against formula injection, plus a complete JSON backup and restore. | `tests/unit/export.test.ts` parses the output with a strict CSV parser |
| M6 | **"Lv" (XP level) in the top bar conflicts with the new Level 1–4 terminology.** | `HUD.refresh` | Confusing labels. | Removed the XP level from the child UI. Coins and badges remain. | E2E: the top bar contains no "Lv" text |
| M7 | **Third-party network request on every launch (Google Fonts).** | `<link href="https://fonts.googleapis.com…">` | The child's IP address goes to a third party, and the fonts fail offline. This conflicts with Kids-category expectations. | Fonts are bundled locally (Baloo 2 and Nunito, SIL OFL 1.1, via @fontsource). The app makes **no** runtime network requests. | E2E: request interception asserts zero non-local requests |
| M8 | **"Offline capable" claim is false.** There is no service worker or manifest. | README | Inaccurate product claim. | PWA service worker that precaches all assets, plus a manifest. Capacitor bundles assets in the native apps. | E2E `offline.spec.ts` (context set offline, then reload and play) |
| M9 | **Fabricated or unsupported README claims.** Testimonials ("My students love MathQuest Kids!"), "Built on proven educational principles", and "Parents and students who tested early versions". | `readME.md` | Unverifiable claims; risk for store metadata. | Removed. The new README states what was verified and links to the limitations. | Docs review |
| M10 | **Fraction notation at "Grade 2".** CCSS 2.G.3 uses words (halves, thirds, fourths), not a/b notation. Sixths and eighths also appeared in Grade 2 at difficulty 3. | `QGen.g2_frac` | Misaligned with the curriculum. | Level 3 introduces fractions as equal parts with words and notation. Notation-heavy work (equivalence, number line) is in Level 4. | Curriculum map in `docs/CURRICULUM.md` |
| M11 | **The rhombus figure is nearly a square** (interior angle ≈85°). | `Visuals.v_shape` | Ambiguous figure. | Rhombus redrawn with ≈64°/116° angles. Shape geometry is unit-tested for side equality and angles. | `tests/unit/visuals.test.ts` |
| M12 | **Ambiguous sharing wording.** "A finds 5 and B finds 7. They share them equally among 3 friends." Are A and B among the friends? "Share equally among 3 friends" has the same problem when the sharer may or may not be included. | `WordProblems.twoStepFrames`, `divFrames` | Underdetermined problem. | Rewritten: "…put them into 3 equal bags, one for each of their 3 friends." Each story template is reviewed for ambiguity. | Story validator (every quantity needed is stated) + template review |
| M13 | **Only multiple choice.** There is no numeric entry, ordering, number-line placement, building, or justification. | `Quiz` | Encourages recognition and guessing over production and reasoning. | Seven interaction types (choice, numeric keypad, order, number-line placement, shade parts, build array, true/false + justification) plus a tap-to-match type. | Unit tests per interaction checker; E2E per type |
| M14 | **No reasoning modes, no lesson sequence.** A one-screen tip leads straight into the quiz. | `Intro`, `Quiz` | Weak conceptual development. | Lesson with a step-by-step worked example → guided → independent → reasoning (Explain / Find the Mistake / Another Way / Detective) → assessment → delayed review. | E2E learning-path test |
| M15 | **Accessibility gaps.** Modals have no focus trap, Escape does not close them, and focus is not restored. The "sr-live" region is shared. The clouds animation keeps running in calm mode. The balloon game is timed and depends on moving targets. Speech uses Web Speech only, which is often unavailable in Android WebView. | Modals, BalloonGame, Voice | Keyboard and screen-reader users can get stuck, and timed or moving tasks exclude some players. | Focus trap, Escape and focus restore. "Relaxed" untimed balloon mode, used by default with reduced motion. Native TTS plugin on Android/iOS. Every task completable without sound or animation. | axe-core E2E scan; keyboard-only E2E |
| M16 | **The parental gate is a 6–9 × 6–9 multiplication**, which a Grade 3 child is expected to know. | `Gate` | Not effective as a gate (and never real security). | A 2-digit × 1-digit problem written in words, with a new problem after every failed try. Documented as a *parental gate*, not authentication. | Unit test |
| M17 | **No separate child profiles.** One profile per device. | `Profile` | Siblings' data gets mixed. | Multiple local profiles (nickname plus mascot only). | Unit and E2E tests |
| M18 | **No automated tests at all.** | – | Regressions go undetected. | Vitest unit, property (fast-check) and seeded large-sample validation; Playwright E2E (phone, tablet, desktop); axe. | `npm run test:all` |
| M19 | **Single 200 KB file mixing curriculum, generators, UI and storage.** | `index.html` | Hard to maintain and test. | TypeScript modules with separate curriculum, engine, validation, learning, data, UI and platform layers. | `docs/ARCHITECTURE.md` |
| M20 | **The code comment claims "legacy save-data migration" but no migration exists.** The code only merges defaults. | `Profile.load` | Misleading. | Versioned schema v2 with a tested v1→v2 migration that keeps a copy of the v1 data. | `tests/unit/migration.test.ts` |

### Minor

| # | Finding | Location | Correction |
|---|---|---|---|
| m1 | The ruler caption reads "Each space on the ruler is 1 **inche**." It appears in every inches item (2,000 of 3,000 `g1_measure` samples). | `v_ruler` | Proper singular/plural unit table |
| m2 | "How many **6ths**/**8ths** make one whole?" (394 of 3,000 `g3_frac`) | `QGen.g3_frac` | Fraction-word table (sixths, eighths) |
| m3 | "so the apples **has** more" (2,020 of 3,000 `k_compare`) | `QGen.k_compare` | Grammar fixed |
| m4 | "A rhombus … like a tilted square" is misleading. "A rectangle has two long and two short sides" is false for squares. | `k_shapes` facts | Precise, age-appropriate descriptions |
| m5 | Emoji do not match their nouns: pearl 🫧 (bubbles), starfish ⭐, marshmallow 🍡, pinecone 🌰, sprinkle jar 🎊 | `WordProblems.themes` | Emoji chosen to match each noun, or a neutral counter used |
| m6 | "…plus 5 balloons more", "roll away and disappear" used for ladybugs and potions, "Bee-keeper" | Story frames | Rewritten |
| m7 | g2_time hint says the hour hand "has passed" h even at :00 | `QGen.g2_time` | Conditional wording |
| m8 | "You pay with 75¢" is ambiguous about which coins | `g2_money` | "You pay with 3 quarters (75¢)" |
| m9 | "Which number is bigger" / "Which fraction is bigger" | several | Precise "greater" terminology, with "bigger" kept for physical size |
| m10 | Lesson caption: "two small problems in a trench coat" | `LESSONS.g3_stories` | Replaced with a clear statement |
| m11 | The home footer claims "Free forever" | Home | Changed to "No ads · No accounts · Works offline" (all verifiable) |
| m12 | Ten-frame cells are drawn but lack text labels for the color difference (color-only blue/red) | `v_tenframe` | Second color also uses a different shape (ring) and the aria label |
| m13 | Original README placeholder URLs (`yourusername.github.io`) | README | Removed |

## Product observations (non-defects carried forward)

Preserved: the Sunny Meadow palette, Baloo 2 and Nunito typefaces, chunky toy-block buttons, the winding Adventure Trail, mascots (Finley Fox and friends), coins and the Mascot Shop, badges, Balloon Pop and Memory Match, the printable certificate and report, the settings (sound, voice, slow reading, large text, calm mode, high contrast), and the grown-ups dashboard.

## Prioritized correction plan

1. C1–C4 and M1: a verified question engine with independent validators and story-model checks.
2. Four Levels with a migration of existing progress (C3, M20).
3. The mastery and evidence model, honest reporting and CSV/JSON export (C3, M2, M4, M5).
4. Reasoning modes, interactions and Math Story Adventures (M13, M14).
5. Accessibility, privacy (local fonts, no network), parental gate and profiles (M7, M15–M17).
6. Architecture, tests, offline PWA and Capacitor (M8, M18, M19).
7. Documentation corrections (M9, m-series).

The fix status of each finding is tracked in `docs/RELEASE_READINESS.md` and `docs/CHANGELOG.md`.
