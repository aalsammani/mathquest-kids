# Activity audit (v2.1)

**Date:** 2026-11-08 · **Source audited:** GitHub `main` at `be18c11` (identical to the deployed GitHub-ready package) · **Branch with fixes:** `revision-2.1`

This audit asked whether any activity "stops after one question" or leaves a child without a working **Next** button. For each activity type it records how questions are produced, how answers are checked, how the child moves on, and what was changed and tested. The per-skill table (all 59 skills, generators, answer types, sampled variety, session lengths) is generated from the code in [ACTIVITY_INVENTORY.md](ACTIVITY_INVENTORY.md) (`npm run docs:activities`).

## 1. What was found

The question engine was **not** the cause. A simulation of every skill and session type (all four levels; learners who are always right, always wrong, or mixed) showed that every session produced its full number of validated questions, from the same skill, without failures. The defects were in the activity screen and the games.

| # | Where | What a child experienced | Verified root cause | Fix |
|---|---|---|---|---|
| A1 | Every question (phones and tablets) | After answering, it looked as if nothing came next: "only one problem". | **Next** existed but was placed *below* the explanation and worked steps. The code focused it with `preventScroll: true`, so it stayed off-screen on small screens. | **Next** now appears in its own row directly under the feedback ("Ready for the next one?"). The row is sticky at the bottom of the screen and scrolled into view when shown. E2E checks it is ≥90% inside the viewport after every question on phone, tablet and desktop. |
| A2 | Every question from question 2 onward (keyboard) | Pressing Enter on **Next** could skip a question. | A new `keydown` listener was **added** to the same container for every question and never removed, so earlier questions' handlers also clicked their old **Next**. | One handler per question (assigned, not added). Cleared on results. E2E: Enter on questions 1 to 4 lands exactly on question 5. |
| A3 | Every question (touch) | A fast double tap on **Next** could answer the next question by accident. | The second tap landed on whatever answer button appeared under the finger. | **Next** acts once (it is disabled on the first tap), and a new question ignores taps for 350 ms (`inert`). Keyboard input is not delayed. E2E: two quick taps leave exactly one new, unanswered question. |
| A4 | ✓ Check on shade, array and number-line answers | A double tap on Check used up both tries at once. | The same answer was submitted twice. | An identical answer submitted again within 0.8 s counts once. E2E: a double tap still gives "Try again". |
| A5 | Story "Explain" step | A wrong reason gave only a sound, with no words on screen. | No visible feedback in that step. | Visible coaching ("Good try! Think about why the plan fits the story…"). E2E checks it. |
| A6 | Check without an answer (keypad, order, true/false, match) | "Type a number first" was **spoken only**. Silent on muted devices. | Audio-only prompts. | The same words now appear under the Check button. |
| A7 | After **Next** on a long question | The new question could start scrolled down. | Scroll position was kept from the previous question. | Each new question starts at the top. |
| G1 | Balloon Pop | After the game ended there was **no way to play again**; only "Back to Game Room". | The Start button was hidden at the start and never shown again. | The end screen shows "🎉 Great job! You popped N balloons!" and **🔄 Play again**. "Round N of 10" and "Not 7. Try another balloon!" are now visible. One pop per round even with fast taps. E2E plays 10 rounds and replays. |
| G2 | Memory Match | Finishing showed only a 3-second toast. | No finish state on the page. | A finish message stays on the page, focus moves to **🔄 Play again**, and the result is read aloud. E2E matches all pairs and replays. |
| T1 | Math Tools | No visible way back on the tool screen (only the small top-bar arrow). | Missing control. | **← Back to Math Tools** on every tool. E2E covers all 7 tools. |
| K1 | Settings and other dialogs (Safari) | Escape did not close Settings after tapping a switch. | Escape was handled only when focus was inside the dialog, and Safari does not focus tapped checkboxes or buttons. | Escape closes the top dialog wherever focus is. Dialogs that must not be dismissed (the parental gate) stay open. Found by the WebKit run. |
| V1 | Session variety | With 10 questions, 9 skills could occasionally show the same question twice in one session. | Repeats were avoided by an internal "signature" that is often a problem *type*, not the exact question. One skill (Fraction Number Line) has only 8 distinct easiest questions. | Sessions now avoid repeating what the child **sees** (prompt, picture, answer labels). If a difficulty's variety runs out, the session takes the next difficulty of the **same skill** before ever repeating. Unit test: 59 skills × 3 learner profiles × repeated runs, 0 repeats. |

## 2. Session design (after v2.1)

| Activity | Questions | Retries / hints | Navigation and completion |
|---|---|---|---|
| Practice (each skill, all four levels) | **10** (was 8): 2 guided, 6 independent, 2 reasoning (or 2 more practice for skills without reasoning modes) | 2 tries, hints | "Question N of 10", **Next question →**, **See my results 🎉**, then **🔄 Practice again** / **🗺️ Back to Level N** / **🏠 Home**. Exit asks before leaving a started round. |
| Daily Review | **10** (was 6), mixed skills | 2 tries, hints | Results, **🔄 Play again**, **Back to Level**, **Home** |
| Level Challenge | **10** (was 8), mixed skills, hardest level | 2 tries, hints | Summit badge at 8 of 10 (was 6 of 8; same 75 % bar) |
| Math Story Adventures | 3 stories × 5 steps (Understand, Plan, Solve, Check, Explain) | Coaching in every step | "Story N of 3", **Next story →**, **🔄 More stories** |
| Skill Check | 6 (unchanged) | Hint-free, single try | Results feed the mastery model, then **Back to the lesson** / **Back to Level** |
| Check-back | 5 (unchanged) | Hint-free, single try | As above |
| Find my level | 3 per level, extends to the next level adaptively (unchanged) | Single try | Ends with a suggested level and level choices |
| Balloon Pop | 10 rounds relaxed (or 60 s timed, a parent setting) | Unlimited taps | Finish message, **🔄 Play again** |
| Memory Match | 6 pairs | Unlimited | Finish message, **🔄 Play again** |
| Math Tools (7) | Free exploration, no questions | — | **← Back to Math Tools** |
| Lessons | Worked example, step by step | — | **🚀 Practice**, **← Back to the map** |

**Intentionally unchanged:**
- Skill Check (6) and check-back (5) lengths: they are inputs to the mastery rules (`RULES` in `src/learning/mastery.ts`), and changing them would change what "mastered" means.
- Stories stay at 3: each story already has five interactive steps.
- **No "Previous question" button.** Each answered question is recorded as evidence the moment it is answered (independent vs. assisted). Going back to change an answer would corrupt that record, and the explanation is already shown right after answering. Children can replay any round.

## 3. How answers are generated and checked (unchanged, re-verified)

- Every question comes from a seeded generator and is **independently re-checked** by `src/engine/validate.ts`, which uses its own fact tables and exact rational arithmetic, before it is shown. A question that fails is never shown. The app retries within the **same skill** and never substitutes another skill.
- Constraints per generator (number ranges, no negative results at the lower levels, distinct answer options, plausible distractors) are enforced by the generators and checked by the validator. These checks are listed in [MATH_VALIDATION.md](MATH_VALIDATION.md).
- v2.1 large-sample validation: **364 skill × generator × difficulty combinations × 1,000 seeds = 364,000 questions, 0 failures** (`reports/MATH_VALIDATION_SUMMARY.md`).

## 4. Tests added in v2.1

| Test | What it proves |
|---|---|
| `tests/unit/session-flow.test.ts` (179 tests) | For all 59 skills × practice / Skill Check / check-back / stories, and three learner profiles: full length, no failed slots, same skill only, **no visible repeats**. Daily Review and Level Challenge for all four levels. Generation terminates quickly even after everything has been seen. |
| `tests/unit/speech.test.ts` (23 tests) | Voice choice on iPad, Windows, Chrome and Android voice lists; text preparation; cancellation; iPad unlock; late voices; errors; watchdog; stop. Uses a mocked engine. |
| `tests/e2e/progression.spec.ts` | In the real UI, on phone, tablet and desktop: a full 10-question practice in **each of the four levels** (including try-again paths), results, replay, Exit with confirmation, Back to Level; Next after wrong answers (Find my level); double-tap Next; Enter; double-tap Check; 3 stories with visible coaching; Daily Review and Level Challenge with replay; Balloon Pop 10 rounds and replay; Memory Match and replay; all 7 tools' back button. Also console errors and failed requests. |
| `tests/e2e/audio.spec.ts` | Read-aloud in the real UI with a recording mock engine (see [AUDIO_COMPATIBILITY.md](AUDIO_COMPATIBILITY.md)). |
| `playwright.ipad.config.ts` (optional, local) | The same E2E suites in **WebKit** with iPad portrait, iPad landscape and iPhone emulation. |

Results of the final run are in [TEST_REPORT.md](TEST_REPORT.md).
