# Store Listing Draft (Google Play and App Store)

All statements below describe implemented features. There are **no ratings, testimonials, awards, outcome claims, or "research-proven" claims**, and none may be added without evidence (see [../EDUCATIONAL_VALIDATION.md](../EDUCATIONAL_VALIDATION.md) Part C).

## Names

- **App name:** MathQuest Kids
- **App Store subtitle (≤ 30 characters):** Think, explain & solve math
- **Play short description (≤ 80 characters):** Math adventures that build reasoning. 4 levels, no ads, no accounts, offline.

## Full description

MathQuest Kids is a math adventure that helps children understand math, not just memorize answers.

**Four learning levels**
• Level 1 · Discovery Garden: counting, comparing, shapes, patterns, and adding and subtracting with objects
• Level 2 · Number Kingdom: adding and subtracting to 20, tens and ones, number lines, the equal sign, coins, and time
• Level 3 · Puzzle Island: two-digit adding and subtracting, hundreds, arrays, sharing, equal parts, perimeter, and bar graphs
• Level 4 · Logic Galaxy: multiplication and division, properties, fractions on the number line, area, elapsed time, and multi-step problems

Levels are about skills, not age. A short, optional "Find my level" check suggests where to start.

**Thinking, not just answering**
• Explain Your Thinking: choose the reason that makes sense
• Find the Mistake: spot and fix the error in a worked problem
• Solve It Another Way: compare strategies and see why they agree
• Math Detective: solve clue puzzles and decide if there is enough information
• Math Story Adventures: understand, plan, solve, check, and explain story problems

**Learn by doing**
Every skill starts with a short lesson and a worked example shown step by step. Children can answer by tapping, typing on a number pad, placing points on a number line, shading fractions, building arrays, ordering, and matching. Hands-on tools include a number line, ten frames, base-ten blocks, fraction bars and circles, arrays, a clock, and a balance.

**Kind feedback and fair rewards**
Hints and second tries are part of learning. Children earn coins and badges for reasoning and for trying again, and can unlock friendly mascots. There are no random prizes and no streak pressure, and optional break reminders help balance screen time.

**For grown-ups**
A gated dashboard shows each child's skills and separates answers solved on their own from answers solved with help. Every status comes with a plain-language explanation. Get suggestions for what to practice next, offline family activities, and printable reports. Export to CSV, back up and restore, or delete all data at any time. Multiple child profiles are supported.

**Private by design**
No ads. No accounts. No tracking. No internet connection needed. Progress stays on this device.

Read-aloud is available for questions and uses the device's built-in voice.

## Keywords

- **App Store (100 characters):** math,reasoning,number sense,fractions,addition,subtraction,multiplication,word problems,offline
- **Play:** use natural phrasing in the description (no keyword field).

## Category and age

| Store | Category | Age band / audience (owner decision) |
|---|---|---|
| App Store | **Kids** (age band: **6–8** suggested), secondary category Education | Age rating expected 4+ (questionnaire pending) |
| Google Play | Education. Target audience suggested: **6–8** (also 5 and under and 9–12 if desired, since Levels 1–4 span roughly ages 5–9) | IARC questionnaire pending (expected Everyone / PEGI 3) |

## Screenshot specifications

Capture from device or emulator builds, using original content only, with no device frames showing real brand marks.

| Store | Size (portrait) | Count |
|---|---|---|
| App Store iPhone 6.9" | 1320×2868 (or 1290×2796) | 3–10 |
| App Store iPad 13" | 2064×2752 (or 2048×2732) | 3–10 |
| Play phone | 1080×1920 or larger (16:9 or 9:16) | 2–8 |
| Play 7" and 10" tablet | 1200×1920 / 1600×2560 | up to 8 each |
| Play feature graphic | 1024×500 | 1 |

Suggested shots (in order):
1. Level selection: "Four levels of math adventure"
2. Lesson with worked example: "Learn step by step"
3. Find the Mistake: "Spot and fix mistakes"
4. Math Story Adventure in the Plan step: "Understand, plan, solve, explain"
5. Fraction number line: "Hands-on math"
6. Math Tools (base-ten blocks)
7. Grown-ups dashboard (sample data only): "Clear, honest progress"
8. "No ads · No accounts · Works offline"

Reference renders from the web build are in `reports/screens/` (not final store art).

## Support and contact (placeholders)

- Support email: `SUPPORT_EMAIL@example.com` ← replace
- Support / marketing URL: `https://example.com/mathquest-kids` ← replace
- Privacy policy URL: `https://example.com/mathquest-kids/privacy` ← host the reviewed policy
- Developer name: Abdallah Alsammani

## App Review notes (draft)

> MathQuest Kids works entirely offline. It has no accounts, ads, analytics, purchases, or external links. The grown-ups area (progress dashboard, data export, and settings) is behind a parental gate: a two-digit by one-digit multiplication written in words (beyond the app's content) plus a press-and-hold button. To open it, read the problem, type the product in digits, then press and hold "Continue" for about one second. The app stores data only on the device and transmits nothing.

## Versioning strategy

- Semantic versioning `MAJOR.MINOR.PATCH`. 2.0.0 is the first release of the rebuilt app.
- Android `versionCode = MAJOR×1,000,000 + MINOR×10,000 + PATCH×100 + BUILD`; iOS `CURRENT_PROJECT_VERSION` increments for every upload.
- Any change to a question generator bumps that generator's `version`, so validation reports can be traced to exact generator versions.
- Data schema changes bump `SCHEMA_VERSION` and require a tested migration (see `tests/unit/data.test.ts`).
