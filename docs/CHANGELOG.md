# Changelog

## 2.1.0 (2026-11-08): activity flow, read-aloud and usability revision

Built on the deployed 2.0.0-rc.1 (GitHub `main` `be18c11`). The visual design, curriculum, generators and mastery rules are unchanged. Details: [ACTIVITY_AUDIT.md](ACTIVITY_AUDIT.md) and [AUDIO_COMPATIBILITY.md](AUDIO_COMPATIBILITY.md).

### Fixed: children stuck after a question
- **Next was off-screen** on phones and tablets after answering (focused with `preventScroll`, below the explanation). It now appears directly under the feedback in a sticky row ("Ready for the next one?"), scrolled into view and focused.
- **Enter skipped questions** from question 2 onward: stacked key handlers. Now one handler per question.
- **A fast double tap on Next** could answer the next question. Next now acts once, and a new question ignores taps for 350 ms.
- **A double tap on ✓ Check** used up both tries. An identical answer within 0.8 s now counts once.
- **Balloon Pop had no Play again** after a game. Added a finish message, Play again, "Round N of 10", visible "Try another balloon!", and one pop per round.
- **Memory Match** finish was a 3-second toast. It is now a lasting message with Play again.
- Story **Explain** step: wrong answers now get visible coaching, not only sound.
- Prompts that were only spoken ("Type a number first", "Match every item first") are now also shown.
- Each new question starts at the top of the page. **Escape** closes dialogs even when focus is outside them (Safari).
- Every Math Tool has **← Back to Math Tools**.

### Changed: sessions
- Practice rounds have **10 questions** (was 8): 2 guided, 6 independent, 2 reasoning. Daily Review: 10 (was 6). Level Challenge: 10 (was 8); the summit badge needs 8 of 10 (same 75 % bar). Skill Check (6), check-back (5) and stories (3) are unchanged.
- Sessions avoid repeating **what the child sees** (prompt, picture, answer labels), not just the internal problem signature. When a difficulty's variety is used up, the session moves to a neighbouring difficulty of the **same skill** before repeating anything.
- Clearer labels: "Question 3 of 10", **Next question →**, **See my results 🎉**, **✓ Check**, **🔊 Listen**, **🔄 Practice again / Play again / More stories**, **🗺️ Back to Level N**, **🏠 Home**. Friendlier feedback ("Great job!", "Try again. You can do it!").

### Read aloud (iPad focus)
- New `src/ui/speech.ts` controller. It ranks voices for clarity and never uses Apple novelty voices (the likely cause of unclear iPad speech), prefers on-device voices, and keeps the previous voice on Windows and Android. It uses full utterance volume (no longer tied to the effects slider), pitch 1.0, and a child-friendly rate. It cancels, waits, then speaks (no clipped or overlapping speech), unlocks on the first tap on iPad, resumes a paused engine, handles late-loading voices, splits long text into sentences, reads math symbols as words, and shows its status (never silent failures).
- Settings: read aloud on/off, 🐢 Slow / 🐇 Normal, voice picker (on-device voices only), 🔊 Test voice, live status, and an iPad tip.
- Speech stops on Next, on leaving an activity, and when the app goes to the background. Web Audio resumes after iOS interruptions.
- **Not yet verified on a physical iPad.** See [IPAD_TEST_CHECKLIST.md](IPAD_TEST_CHECKLIST.md).

### Tests and tooling
- New unit suites: `session-flow` (every skill and session type: length, no failed slots, no visible repeats, termination) and `speech` (mocked engines modelled on iPadOS, Windows, Chrome and Android).
- New E2E suites: `progression` (complete 10-question sessions in all four levels, replay, exit, wrong-answer paths, rapid taps, keyboard, stories, Daily Review, Level Challenge, both games, all tools) and `audio` (recording mock engine, iPad user agent).
- Optional `playwright.ipad.config.ts`: the E2E suites in WebKit with iPad portrait, iPad landscape and iPhone emulation.
- `npm run docs:activities` generates [ACTIVITY_INVENTORY.md](ACTIVITY_INVENTORY.md).
- Generated folders `dist/`, `dist-e2e/` and `reports/e2e/`, uploaded to the repository earlier, are no longer tracked; they were already in `.gitignore`.

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
