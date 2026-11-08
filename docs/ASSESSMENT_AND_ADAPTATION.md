# Assessment and Adaptation

This is an **interpretable, rule-based** skill model. It is **not artificial intelligence**, and its thresholds are **provisional**. They have not been validated psychometrically. They are set conservatively and documented here so parents and reviewers can see exactly why the app says what it says. Source: `src/learning/mastery.ts`, `src/learning/session.ts`, `src/learning/recommend.ts`.

## Evidence recorded for every scored item

| Field | Meaning | Used for |
|---|---|---|
| `correct` | Final outcome | All |
| `firstTry`, `tries` | Correct on the first attempt? (second tries are allowed in practice) | Independence |
| `hints` | Number of hints viewed | Independence |
| `diff` | Difficulty 1–3 | Readiness (harder items) |
| `mode` | solve / explain / mistake / another-way / detective / story | Reasoning evidence |
| `ctx` | guided / practice / reasoning / assessment / review / story / daily / placement | Which evidence counts where |
| `guess` | Chance of guessing correctly (1/options for choice; ≈0 for typed or built answers) | Guess weighting |
| `sig` | Question signature (structure + numbers) | Repeat detection |
| `ms` | Response time | **Not used for mastery or difficulty.** Recorded only for optional diagnostics and parent time totals. |

**Independent** means correct, on the first try, and with no hints. **Assisted** means correct after a hint or on a second try. Both are shown to parents, and assisted answers are never presented as failures.

## States

| State | Rule (recent window = last 10 different practice items; repeats count once) |
|---|---|
| Not started | No attempts. |
| Learning | Some attempts, but not yet at the Practicing threshold. |
| Practicing | ≥ 3 weighted independent-correct items **and** an independent rate ≥ 50%. |
| Ready for a Skill Check | ≥ 5 weighted independent-correct items, a rate ≥ 80%, ≥ 2 independent-correct items at difficulty ≥ 2, **and** ≥ 1 correct reasoning-mode item (when the skill has reasoning items). |
| Provisionally mastered | Passed a **Skill Check**: 6 different items, no hints, one try, weighted score ≥ 80%. |
| Retained mastery shown | Passed a **check-back** (5 items, no hints, ≥ 80%) taken at least the parent-chosen delay (1, 3 or 7 days; default 1) after the Skill Check. |

### Safeguards against inflated mastery

- Hint-assisted and second-try answers never count as independent (regression tests).
- Repeated identical questions count once in the window, and a Skill Check with repeated items does not count (regression tests).
- Two-option items (50% guess rate) count half, so lucky guesses on true/false or two-way choices cannot promote a child (regression test).
- Speed is never used.
- A failed check-back returns the skill to practice with a non-punitive message ("Let's refresh this skill…").
- **Legacy trophies:** v1.1 "mastered" topics map to *Ready for a Skill Check*, not to mastery, because the v1.1 rule allowed hints and a single session. The trophy itself is preserved in the collection.

### Why these numbers?

- 80% hint-free on six varied items with at least two harder ones is a common, transparent mastery-check convention. It is **not** a validated cut score.
- Six items keep the check short for young children. The cost is noisier measurement, which is why a delayed check-back is required before "retained".
- The delayed check-back draws on research on retrieval and spaced practice (see the references in [COMPETITIVE_BENCHMARK.md §5.5](COMPETITIVE_BENCHMARK.md)). These studies were conducted mostly with older learners.

**Parents see:** "Status describes recent answers in this app using simple rules; it is not a standardized assessment."

## In-session adaptation

- A practice round has 8 items: 2 **guided** (difficulty 1, worked-example style, hints encouraged), 4 **independent**, and 2 **reasoning** (explain, mistake, another way, detective).
- The starting difficulty follows recent independent accuracy.
- The `Adapter` raises difficulty after **2 consecutive independent successes** and lowers it after **2 consecutive misses**. Assisted successes do not change difficulty.
- When a child struggles at the easiest level, the recommendation engine suggests a **prerequisite** review instead of a harder item.

## Recommendations (all explainable)

These are ordered by priority. Each one shows its reason to the child (in simple words) and to the parent (in full):
1. Check-back due.
2. Ready for a Skill Check.
3. Prerequisite review: ≥ 6 recent items, < 40% independent, and a prerequisite not yet at Practicing.
4. Keep practicing.
5. Explore the next skill whose prerequisites have been started.
6. Spaced review of retained skills.

**Daily Review** mixes items from all skills at Practicing or above in the current level (retrieval practice).

## Placement ("Find my level")

This is optional at first launch. The child sees 3 items per level, starting at Level 1. If 2 or more are correct, Level 2 items are added, and so on. The suggestion is the first level that is not yet comfortable. Placement items are never used as mastery evidence. The suggestion can be overridden by the child or a parent at any time.

## Stars and coins (motivation, not assessment)

- **Stars per practice round:** a first-try correct answer earns 1 point and a later correct answer earns ½; 90% or more gives 3 stars, 70% gives 2, and 50% gives 1. The stars rule from v1.1 is preserved, but stars are **not** mastery.
- **Coins** are fixed and effort-based: second tries and reasoning items earn coins too. There is no randomness, and coins are never purchasable.

## Known limitations

- The thresholds are untested with children. A pilot study is required (see [EDUCATIONAL_VALIDATION.md](EDUCATIONAL_VALIDATION.md)).
- Items within a skill vary in difficulty, but the items are not calibrated (no IRT).
- Error categories (misconception tags) are encoded in distractor design but are not yet aggregated for parents.
