# MathQuest Kids

A local-first, reasoning-centered math learning app for young children, organized into **four learning levels**: Level 1 Discovery Garden, Level 2 Number Kingdom, Level 3 Puzzle Island, and Level 4 Logic Galaxy. It runs in modern browsers (installable and offline-capable) and is packaged for Android and iOS with Capacitor.

> **Status: release candidate 2.0.0-rc.1, development complete, automated tests passing.** This is **not** approved by any app store. It has **not** been tested on physical devices, reviewed by a lawyer, or validated with children. See [`docs/RELEASE_READINESS.md`](docs/RELEASE_READINESS.md) for an evidence-based checklist.

## What children do

- **Learn → practice → reason → check.** Each of 59 skills has a lesson (a big idea, a visual model, and a step-by-step worked example), guided and independent practice, and reasoning tasks. A hint-free **Skill Check** comes next, followed later by a **check-back** to see whether the learning lasted.
- **Five reasoning modes:** Think & Solve, Explain Your Thinking, Find the Mistake, Solve It Another Way, and Math Detective (clue puzzles, plus "is there enough information?").
- **Math Story Adventures:** original stories in 14 settings, worked through Read/Listen → Understand → Plan → Solve → Check → Explain → Celebrate. More than one valid plan is accepted.
- **Eight ways to answer:** tap a choice, type on a number keypad, put items in order, place a point on a number line, shade fraction parts, build an array, answer true/false and pick the reason, or match pairs. None of them requires dragging.
- **Seven math tools:** number line, ten frames, base-ten blocks (with trading), fraction bars and circles, an array builder, a clock, and a balance.
- **Rewards that celebrate thinking:** coins, mascots, and badges for reasoning and for trying again. There is no random loot, no streak-loss pressure, and there are optional break reminders.

## What grown-ups get

A parental-gated dashboard with:
- Separate child profiles.
- A plain-language status for each skill that keeps answers solved **independently** separate from those solved **with help**.
- Recommendations with reasons, and offline family activities.
- CSV exports, full backup and restore, and data deletion.
- Settings for break reminders, check-back delay, and timed games.

## Privacy

There are no accounts, ads, analytics, trackers, or network requests. The fonts are bundled. All data stays on the device. See [`docs/PRIVACY_AND_DATA_FLOW.md`](docs/PRIVACY_AND_DATA_FLOW.md) and [`docs/store/PRIVACY_POLICY_DRAFT.md`](docs/store/PRIVACY_POLICY_DRAFT.md). The privacy policy is a draft and still needs legal review.

## Mathematical verification

Every question is generated from a seed and **independently re-checked** before a child sees it. The checker re-derives answers with its own fact tables and exact rational arithmetic. If a question fails, the app retries within the **same skill** or skips the question unscored; it never substitutes an unrelated one. The latest run checked **364,000 seeded questions across all 364 skill × generator × difficulty combinations, with 0 failures**. See [`docs/MATH_VALIDATION.md`](docs/MATH_VALIDATION.md) and `reports/math-validation-report.json`.

## Quick start

Requires **Node.js 22 or newer** (developed with 24.22.2 LTS).

```bash
npm install                 # install dependencies
npm run dev                 # web app at http://localhost:5173
npm test                    # unit + property + mutation tests (Vitest, fast-check)
npm run validate:math       # large-sample generator validation → reports/
npm run build:e2e && npx playwright test   # end-to-end + accessibility (needs Microsoft Edge, or change the channel)
npm run build               # production web build → dist/ (PWA, offline)
npm run preview             # serve the production build
npx cap sync                # copy dist/ into android/ and ios/
npx cap open android        # Android Studio (JDK 21 + Android SDK 36)
npx cap open ios            # Xcode 26+ (macOS only)
```

Release builds are covered in [`docs/ANDROID_BUILD.md`](docs/ANDROID_BUILD.md) and [`docs/IOS_BUILD.md`](docs/IOS_BUILD.md).

## Project layout

```
src/core/         seeded RNG, exact rationals, expression claims, schema types, text helpers
src/curriculum/   four levels (59 skills), lessons with verified worked examples, family activities
src/engine/       question generators, independent validator, registry + safeGenerate, answer checking
src/learning/     mastery evidence model, sessions & adaptation, recommendations, rewards, progress
src/data/         storage (localStorage / Capacitor Preferences), schema v2 + v1 migration, export
src/ui/           shell, visuals (SVG), interactions, screens
src/platform/     Capacitor integration (back button, lifecycle, file save/share)
tests/            unit/, property/, validation/, e2e/
legacy/           the original v1.1 app and earlier versions, preserved unchanged
docs/             audit, architecture, curriculum, validation, accessibility, privacy, build, store
```

## Documentation

| Topic | File |
|---|---|
| Initial audit (v1.1 findings) | [docs/INITIAL_AUDIT.md](docs/INITIAL_AUDIT.md) |
| Architecture | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Curriculum (generated from code) | [docs/CURRICULUM.md](docs/CURRICULUM.md) |
| Math validation | [docs/MATH_VALIDATION.md](docs/MATH_VALIDATION.md) |
| Assessment & adaptation | [docs/ASSESSMENT_AND_ADAPTATION.md](docs/ASSESSMENT_AND_ADAPTATION.md) |
| Educational validation & pilot protocol | [docs/EDUCATIONAL_VALIDATION.md](docs/EDUCATIONAL_VALIDATION.md) |
| Competitive benchmark & research | [docs/COMPETITIVE_BENCHMARK.md](docs/COMPETITIVE_BENCHMARK.md) |
| Policy references (COPPA, Play, Apple, WCAG) | [docs/research/POLICY_REFERENCES.md](docs/research/POLICY_REFERENCES.md) |
| Accessibility | [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md) |
| Privacy & data flow | [docs/PRIVACY_AND_DATA_FLOW.md](docs/PRIVACY_AND_DATA_FLOW.md) |
| Android / iOS builds | [docs/ANDROID_BUILD.md](docs/ANDROID_BUILD.md), [docs/IOS_BUILD.md](docs/IOS_BUILD.md) |
| Store checklists | [docs/GOOGLE_PLAY_CHECKLIST.md](docs/GOOGLE_PLAY_CHECKLIST.md), [docs/APPLE_APP_STORE_CHECKLIST.md](docs/APPLE_APP_STORE_CHECKLIST.md) |
| Store listing, privacy policy draft | [docs/store/](docs/store/) |
| Asset & license inventory | [docs/ASSET_INVENTORY.md](docs/ASSET_INVENTORY.md) |
| Test report | [docs/TEST_REPORT.md](docs/TEST_REPORT.md) |
| Release readiness | [docs/RELEASE_READINESS.md](docs/RELEASE_READINESS.md) |
| Changelog / known limitations | [docs/CHANGELOG.md](docs/CHANGELOG.md), [docs/KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md) |

## License

MIT © 2025 Abdallah Alsammani (see [LICENSE](LICENSE)). The bundled fonts (Baloo 2, Nunito) are licensed under the SIL Open Font License 1.1.
