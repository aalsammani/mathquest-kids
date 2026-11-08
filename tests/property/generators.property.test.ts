/**
 * Property-based tests: for ANY seed, every generator yields a question that the
 * independent validator accepts, that is deterministic, and that is representable.
 */
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { Difficulty } from '../../src/core/types';
import { buildQuestion, SKILL_GENERATORS } from '../../src/engine/registry';
import { ALL_SKILLS } from '../../src/curriculum/levels';

describe('generator properties (fast-check, random seeds)', () => {
  it('every curriculum skill has at least one generator and a reasoning or story item somewhere in its level', () => {
    for (const s of ALL_SKILLS) expect(SKILL_GENERATORS[s.id]?.length, s.id).toBeGreaterThan(0);
    for (const lvl of [1, 2, 3, 4]) {
      const modes = new Set(ALL_SKILLS.filter(s => s.level === lvl).flatMap(s => SKILL_GENERATORS[s.id]!.map(e => e.gen.mode)));
      for (const m of ['explain', 'story']) expect(modes.has(m as never), `level ${lvl} lacks ${m}`).toBe(true);
    }
  });

  for (const [skill, entries] of Object.entries(SKILL_GENERATORS)) {
    for (const en of entries) {
      it(`${skill} · ${en.gen.id}`, () => {
        fc.assert(
          fc.property(fc.integer({ min: 0, max: 2 ** 32 - 1 }), fc.constantFrom<Difficulty>(1, 2, 3), (seed, d) => {
            const diff = Math.max(d, en.minDiff ?? 1) as Difficulty;
            const qn = buildQuestion(skill, en.gen, diff, seed);
            expect(qn.validation.issues, `${qn.id}: ${qn.prompt}`).toEqual([]);
            // deterministic replay
            const again = buildQuestion(skill, en.gen, diff, seed);
            expect(again.prompt).toBe(qn.prompt);
            expect(JSON.stringify(again.interaction)).toBe(JSON.stringify(qn.interaction));
            // metadata
            expect(qn.level).toBe(Number(skill[1]));
            expect(qn.hints.length).toBeGreaterThanOrEqual(2);
          }),
          { numRuns: 60, seed: 20261106 },
        );
      });
    }
  }
});
