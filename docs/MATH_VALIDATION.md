# Mathematical Validation

## Goal

No known mathematically incorrect item may reach a child. Every generated question is checked by an **independent validator** before display. Generators and validator are covered by unit tests, property-based tests, mutation tests, and a large fixed-seed sample run.

## Latest results

| Check | Result | Evidence |
|---|---|---|
| Large-sample validation (1,000 seeds × every skill × generator × difficulty) | **364 combinations, 364,000 questions, 364,000 valid, 0 failures: PASS** | `reports/math-validation-report.json`, `reports/MATH_VALIDATION_SUMMARY.md` (base seed 20261106) |
| Property-based tests (fast-check, random 32-bit seeds, 60 runs per generator) | 130 skill–generator properties pass | `tests/property/generators.property.test.ts` |
| Mutation tests (validator must reject 20 kinds of broken question) | 21/21 pass (including control) | `tests/unit/validator.mutation.test.ts` |
| Answer key is answerable; a wrong answer is rejected (all generators) | pass | `tests/unit/check.test.ts` |
| Lesson worked examples: every arithmetic claim holds | 59/59 lessons | `tests/unit/curriculum.test.ts` |

Regenerate: `npm run validate:math` (set `MQ_SAMPLES=1000` for the full run).

## How the validator is independent

`src/engine/validate.ts` imports **no generator code**. For each question it reads the givens (the `math` spec, the visual spec, and in some cases the **prompt text itself**) and recomputes the correct response(s) with its own logic:

| Spec kind | How the validator decides what is correct |
|---|---|
| `equation` | Brute-force integer solve of the claim over [lo, hi]. It **requires exactly one solution**, then compares that solution with the key. Every literal ≥ 2 in the claim must appear in the text or visual as a digit or a word. |
| `count` | Counts in the visual (counters or ten frame) must equal *n*. |
| `compare` / `extreme` / `order` | Exact rational comparison; ties are rejected. |
| `clock` / `elapsed` | Its own time formatter. For elapsed time it **parses the start time and duration from the prompt** and does its own clock arithmetic. |
| `shape` / `shape-property` / `shape-family` | Its own shape-fact table (sides, equal sides, right angles, parallel pairs) and inclusive definitions (a square is a rectangle and a rhombus; a circle is an ellipse; a trapezoid has at least one parallel pair). **Any option that is also a correct name is flagged**, which catches audit finding C2. |
| `repeating-pattern` / `arith-sequence` | Infers the minimal repeating unit (two full repeats required) or the constant difference, then predicts the missing term. |
| `place` | 100h + 10t + o; the visual blocks must match. |
| `fraction` | Value equality with exact rationals, so equivalent distractors like 2/4 for 1/2 are caught. Bars must have equal widths whenever a fraction is named. Number-line marks must sit on a tick. |
| `money` / `change` | Its own coin table; the price must appear in the prompt and the amount paid must exceed it. |
| `unit-choice` | Typical-magnitude table plus a log-distance rule. Rejects **ambiguous** options (e.g., centimeters vs. inches for a crayon). |
| `convert` | Its own conversion table. |
| `data` | Reads the bar graph data. Values must be positive multiples of the scale; ties for most/least are rejected. |
| `rect` | Area w·h, perimeter 2w + 2h, both from the visual. |
| `clues` | Its own clue evaluator; brute-forces the range and **requires exactly one number** to satisfy all clues. |
| `function-table` | **Parses the input→output examples from the prompt**, infers the linear rule exactly, and predicts the output. |
| `asn` (always/sometimes/never) | Brute-forces its own predicate over 0–30 (pairs for two-variable claims). |
| `claims` | Every explanation or justification option is evaluated. An option is correct iff all its claims hold and it is not flagged false. The answer key must equal exactly that set. Options with no claim and no truth flag are rejected as unverifiable. |
| `story` | Evaluates the expression exactly (whole-number answer only). The digit tokens in the story and prompt must equal the givens plus the declared irrelevant numbers, as a multiset. Every given must be used. The visual must match the structure: a **comparison drawn as take-away is rejected** (audit finding C4). |
| Story phases | Plan options are correct iff their equation's unique whole-number solution is the answer. Understand has exactly one true option. Explain options are claim-checked. The Check sentence must mention the answer. |

### Generic checks (all questions)

- Option count between 2 and 6, with unique ids, labels and values. The key must not be empty.
- Numeric answers are integers within [min, max] and no longer than 4 keypad digits.
- At least two distinct hints.
- The explanation **states the answer**.
- No text claims a different answer ("the answer is N" with N wrong).
- No keyword-rule hints such as "that means subtract" (audit finding M1).
- No `undefined`, `NaN` or `Infinity` in text.
- No "1 apples"-style plural errors (checked against a list of plural nouns used in the app).
- Visuals are representable: at most 20 counters, at most 60 number-line ticks, bar graphs aligned to grid lines, clock values in range.

## Defects found and fixed by this process

Fixed in generators while building v2:
- Grammar: "1 apples", "1 tens", "1 minutes", "a oval", "1 striped dots".
- Distractors that are also correct:
  - The squares/rectangles issue (C2).
  - A perimeter distractor that equals the answer when w·h = 2(w + h).
  - A "Because 42 ÷ 7 = 6" circular explanation.
  - An equal-groups "wrong plan" that evaluated to the right answer.
- A negative multi-step answer (`2 × 4 − 9`).
- A 3 × 3 commutativity statement keyed as false.
- Unsupported fraction words for denominators 7 and 9.
- More than 20 counters on screen.
- A Math Detective explanation saying "my tens digit".
- An unreadable 100-tick number line in a lesson.
- A `-0` value in the rational type (found by fast-check).
- A falsy timestamp-zero bug in mastery (found by a unit test).

## Mutation tests (the validator has teeth)

`tests/unit/validator.mutation.test.ts` takes valid questions, corrupts them, and asserts that the validator rejects each one:
- a wrong answer key;
- a duplicate or second correct option;
- an equivalent-fraction distractor;
- a square with a "rectangle" option;
- a comparison story drawn as take-away;
- a keyword hint;
- a contradictory explanation;
- a visual count mismatch;
- a clock mismatch;
- an extra number in a story;
- a two-solution clue puzzle;
- an ambiguous unit choice;
- a wrong true/false truth value;
- a wrong always/sometimes/never key;
- an unequal partition named as a fraction;
- a wrong story plan;
- an unrepresentable numeric answer;
- an equation with no unique solution;
- a rule machine that does not follow its own examples;
- a plural grammar error.

## Failure handling at runtime

`safeGenerate` returns only validated questions. It retries with new seeds, then tries the skill's other generators. If none succeed, it throws, and the activity **skips the slot without scoring it**. Diagnostics (skill, generator, seed, issue; never child data) are kept in memory and shown under *Grown-Ups → Data & privacy → Diagnostics*. `recordAttempt` refuses unvalidated questions (regression test). There is no cross-skill fallback (regression test: "never falls back to unrelated addition").

## Limits of this validation

- It proves the **internal consistency** of each item (the key matches the givens, and no alternative option is also correct). It cannot prove that the *wording* is the clearest possible or that an item measures its objective well. That needs human educational review (see [EDUCATIONAL_VALIDATION.md](EDUCATIONAL_VALIDATION.md)).
- Non-arithmetic explanation sentences ("the parts are not the same size") are checked by a `truth` flag plus fixed templates, not by semantic proof. These templates were reviewed by the developer; independent human review is still pending.
- Unit-choice "best unit" judgments use a documented magnitude heuristic.
