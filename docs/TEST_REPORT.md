# Test Report

**Date:** 2026-11-06 / 07 (UTC) · **Version:** 2.0.0-rc.1 · **Command:** `npm run test:all` (log: `reports/test-all.log`, 4 min 57 s)

## Environment

| Item | Value |
|---|---|
| OS | Windows 11 Pro 10.0.26200 |
| Node.js | 24.22.2 LTS (portable install) |
| TypeScript | 6.0.3 (strict) |
| Vite / Vitest / fast-check | 8.3.6 / 5.1.0 / 4.10.2 |
| Playwright / browser | 1.65.0 / Microsoft Edge 156.0.4314.58 (Chromium, `msedge` channel) |
| axe-core | 4.14.0 |
| Android SDK / JDK / Xcode | **Not installed / not available.** No native builds were run. |

## Results

| Suite | Result | Evidence |
|---|---|---|
| Type-check (`tsc --noEmit`, strict) | ✅ 0 errors | log |
| Unit + property + mutation (Vitest) | ✅ **213 / 213 passed** (9 files) | `tests/unit`, `tests/property` |
| Math validation, 1,000 seeds per combination | ✅ **364 combinations · 364,000 questions · 0 failures** | `reports/math-validation-report.json` |
| E2E (Playwright: phone Pixel 7 profile, tablet 820×1180 touch, desktop 1280×860) | ✅ **50 passed, 0 failed, 0 flaky**, 7 skipped by design (single-viewport tests) | `reports/e2e/results.json`, HTML report `reports/e2e/html/` |
| Accessibility (axe, WCAG 2.2 A/AA tags) | ✅ **39 scans, 0 violations of any severity** | `reports/e2e/axe/*.json` |
| Visual smoke (screenshots, console errors, horizontal scroll at 390 px and 1280 px) | ✅ No console errors, no horizontal scroll | `reports/screens/*.png` |
| Production bundle scan | ✅ 0 `http(s)://` URLs; 0 test-hook references; main JS 114 KB gzipped | grep of `dist/` |
| `npm audit --omit=dev` | ✅ 0 vulnerabilities | — |
| Legacy v1.1 audit harness | Ran on the original; findings in INITIAL_AUDIT.md | `reports/legacy-audit.json` |

## Coverage by requirement

### Mathematics

- **Addition and subtraction:** facts and regrouping, including mistake generators.
- **Multiplication and division:** facts, unknown factor, properties, distributive.
- **Place value:** 2- and 3-digit, expanded form, reversed-digit mistake.
- **Fractions:** naming, equal parts, shading, equivalence, comparison, number line.
- **Geometry:** names with an inclusive definition check, sides and vertices, properties, families.
- **Measurement:** rulers with an offset start, unit choice with an ambiguity check, conversion, area and perimeter.
- **Time:** hour, 5 minutes, to the minute, and elapsed time parsed from the prompt.
- **Data:** scale-1 and scaled bar graphs.
- **Patterns:** repeating patterns, arithmetic sequences, rule machine (parsed from the prompt), always/sometimes/never by brute force.
- **Word problems:** 15 structures with plan, explanation and visual checks.
- **Multi-step and alternative strategies:** multiple valid plans and arrays are accepted (`check.test.ts`).

### Application (E2E)

- First launch and onboarding with four Level labels and no grade terminology.
- Navigation, lessons and worked examples.
- A full practice round with persisted evidence.
- Hint and second-try recording as assisted, with the persistence badge.
- Wrong answer shows the answer, explanation and steps.
- A story through all phases.
- A Skill Check with no hints, awarding provisional mastery.
- All 8 interaction types through the real UI.
- No requests to other origins.
- v1.1 migration with original keys kept.
- Corrupt data recovery.
- Parental gate (a tap is rejected, hold required) with CSV and backup downloads parsed and erase-all verified.
- Persistence across reloads and separate profiles.
- **Offline via the service worker.**
- Keyboard-only flow, focus trap, Escape and focus restore.
- 44×44 minimum touch targets.
- High-contrast and large-text axe scans.

### Regression tests named in the brief

| Defect class | Test |
|---|---|
| Unrelated fallback questions | `safeGenerate.test.ts`: "never falls back to unrelated addition…" |
| Incorrect mastery awards | `learning.test.ts`: "mastery requires a hint-free Skill Check…" |
| Hint-assisted answers counted as independent | `learning.test.ts`, `progress.test.ts`, E2E hint test |
| Incorrect streak updates | `data.test.ts` + E2E: "loading the app does not record a practice day" |
| Broken progress migration | `data.test.ts` (4 tests) + E2E migration |
| Invalid CSV exports | `data.test.ts`: single RFC 4180 table + BOM + formula-injection defusal; E2E parses the downloaded file |
| Duplicate distractors | validator structure checks + `core.test.ts` option-builder property |
| Contradictory explanations | validator ("explanation must state the answer"; "text claims a different answer") + mutation test |
| Invalid fraction diagrams | mutation test: unequal partition; validator equal-width rule |
| Unscored questions affecting progress | `progress.test.ts`: "an unvalidated question is never scored" |

## Defects found and fixed during testing (selection)

- **By tests:** a `-0` rational; a timestamp-zero falsy check; generator grammar and correctness defects (see MATH_VALIDATION.md); a 45 px horizontal overflow on phones; an axe label-content mismatch; `role=listitem` on buttons; erase-all re-saving blank state; the story question hidden during Understand; map text running together (visual review).
- **E2E flakiness:** removed by forcing generators in test builds rather than relying on random selection.

## Not executed (no claim of passing)

- Android Gradle build, APK/AAB, emulator or device tests.
- iOS Xcode build, simulator, device or TestFlight tests.
- TalkBack/VoiceOver walkthroughs.
- Safari and Firefox runs (only Chromium/Edge was tested).
- Performance profiling on low-end hardware.
- Usability testing with children or parents.
- Independent expert content review.
