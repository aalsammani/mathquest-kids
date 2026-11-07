# Changelog

## 2.0.0-rc.1 — GitHub Pages packaging (2026-11-06)

Deployment only. The app's code, curriculum, generators and design are unchanged.

- Added `.github/workflows/deploy.yml`. On each push to `main` (or a manual run) it runs `npm ci`, the type check, unit tests, math validation, the Pages build, a build-output check, and browser tests under the site path. It deploys `dist-pages/` with `actions/deploy-pages` and never publishes the TypeScript source.
- Added the `vite.config.ts` modes `pages` and `e2e-pages` (base `/mathquest-kids/`, overridable with `BASE_PATH`). The default build that Capacitor uses keeps the relative base `./`.
- In Pages builds, the PWA manifest's `start_url` and `scope` follow the base path. Pages builds also gain a `404.html` that redirects to the app, plus `.nojekyll`. The service worker now sets `skipWaiting`/`clientsClaim` explicitly and does not precache `404.html`.
- Added `scripts/verify-pages-build.mjs`, `scripts/serve-pages.mjs` (a local server that behaves like GitHub Pages), `playwright.pages.config.ts` and `tests/pages/deploy.spec.ts`. E2E specs now navigate with base-relative URLs (`page.goto('./')`).
- Playwright can use the bundled Chromium (`PW_CHANNEL=chromium`, used in CI). Locally it still defaults to Microsoft Edge.
- Added `docs/GITHUB_PAGES.md` and `GITHUB_UPLOAD_INSTRUCTIONS.md`.

## 2.0.0-rc.1 (2026-11-06)

A complete rebuild of v1.1 as a TypeScript, Vite, PWA and Capacitor app. The original is preserved in `legacy/`, with a zip backup and a local git baseline (`e35055d`).

### Learning
- **Four learning levels** (Level 1–4, with worlds Discovery Garden, Number Kingdom, Puzzle Island, Logic Galaxy) replace K–3 grades in the child UI. There are 59 skills with objectives, prerequisites, and parent-facing CCSS mappings. All 37 v1.1 topics are mapped.
- Lessons with a big idea, a visual model, and a step-by-step worked example (arithmetic machine-verified).
- Sequence: guided → independent → reasoning → hint-free **Skill Check** → delayed **check-back** → Daily Review.
- **Reasoning modes:** Explain Your Thinking, Find the Mistake, Solve It Another Way, Math Detective (clue puzzles, enough-information).
- **Math Story Adventures:** 14 original settings and 15 problem structures, with Understand, Plan, Solve, Check and Explain phases; multiple valid plans accepted.
- **8 interaction types:** choice, keypad, order, number line, shade, build array, true/false + reason, match.
- **7 manipulatives:** number line, ten frames, base-ten blocks, fraction bars/circles, arrays, clock, balance.
- Optional "Find my level" placement.
- Effort-based rewards: the random treasure chest, the streak pressure, and the XP "Lv" label were removed, and a persistence badge and reasoning badges were added.
- Break reminders (parent-set).

### Mathematical correctness (audit C1–C4, M1)
- Seeded generators with an **independent validator**; 364,000-question validation with 0 failures.
- No cross-skill fallback: failed items are skipped and unscored.
- Fixed: squares with a "rectangle" option, comparison stories drawn as take-away, keyword-rule hints, "inche", "6ths", "the apples has", a nearly-square rhombus, ambiguous sharing wording, and others (see INITIAL_AUDIT.md and MATH_VALIDATION.md).

### Assessment and reporting
- Evidence model separating **independent** from **assisted** answers; repeats ignored; guess-weighting; six mastery states with plain-language explanations.
- Parent dashboard: multiple profiles, skill status with evidence, recommendations with reasons, recent activity, family activities, print report.
- Valid CSV exports (RFC 4180, BOM, injection-safe), JSON backup and restore, delete profile, erase all.

### Privacy, accessibility and platform
- No network requests: fonts bundled (OFL), strict CSP, verified by E2E.
- Parental gate: a worded problem plus press-and-hold.
- WCAG 2.2 AA work: contrast fixes (white text was 2.3–2.8:1 on buttons), focus management, focus-trapped modals, keyboard support, no required dragging, 44 px targets, non-color cues, text alternatives for all math visuals, calm mode, read-aloud. axe: 0 violations across 39 scans.
- Offline PWA (service worker). Capacitor 8 Android and iOS projects with original icons and splash screens, an iOS privacy manifest, Android cloud backup disabled, and a signing template.
- Tested v1.1 → v2 data migration (non-destructive) and corrupt-data recovery.

### Engineering
- Strict TypeScript modules; 213 unit, property and mutation tests; 50 Playwright E2E tests on phone, tablet and desktop.
- Documentation set under `docs/`.

## 1.1 (2025)
The original single-file app (`legacy/index-v1.1-original.html`).
