/**
 * v2.1 regression: every activity in all four levels yields a complete, varied session.
 * Simulates the activity runner's question flow (planSession → nextQuestion with the session's
 * seen-set and adapter) for every skill and session type, many times with fresh seeds.
 */
import { describe, expect, it } from 'vitest';
import { LEVELS } from '../../src/curriculum/levels';
import { dailyMix } from '../../src/learning/recommend';
import { Adapter, markSeen, MIX_ITEMS, nextQuestion, planSession, PRACTICE_ITEMS, visibleKey, type SessionKind, type Slot } from '../../src/learning/session';
import type { Difficulty, Question } from '../../src/core/types';

const RUNS = 12;

function simulate(slots: Slot[], start: Difficulty, answerCorrect: (k: number) => boolean) {
  const seen = new Set<string>(); const shown: Question[] = []; let nulls = 0;
  const ad = new Adapter(start);
  slots.forEach((slot, k) => {
    const q = nextQuestion(slot, ad.diff, seen);
    if (!q) { nulls++; return; }
    markSeen(seen, q); shown.push(q);
    const ok = answerCorrect(k); ad.record(ok, ok);
  });
  return { shown, nulls };
}

const ALL = LEVELS.flatMap(L => L.skills.map(s => ({ level: L.id, skill: s.id, story: s.id.endsWith('stories') })));

describe('every activity yields a complete multi-question session', () => {
  it('there are four levels and every level has practice skills and stories', () => {
    expect(LEVELS.map(l => l.id)).toEqual([1, 2, 3, 4]);
    for (const L of LEVELS) { expect(L.skills.some(s => !s.id.endsWith('stories'))).toBe(true); expect(L.skills.some(s => s.id.endsWith('stories'))).toBe(true); }
  });

  for (const { skill, story } of ALL) {
    const kinds: SessionKind[] = story ? ['stories'] : ['practice', 'assessment', 'review'];
    for (const kind of kinds) {
      it(`${skill} · ${kind}: full length, no failed slots, no visible repeats`, () => {
        for (let r = 0; r < RUNS; r++) {
          const slots = planSession(kind, skill);
          if (kind === 'practice') expect(slots).toHaveLength(PRACTICE_ITEMS);
          // alternate learner profiles: always right, always wrong, mixed
          const { shown, nulls } = simulate(slots, 1, k => (r % 3 === 0 ? true : r % 3 === 1 ? false : k % 2 === 0));
          expect(nulls, 'slots with no validated question').toBe(0);
          expect(shown).toHaveLength(slots.length);
          expect(shown.every(q => q.validation.status === 'validated')).toBe(true);
          expect(shown.every(q => q.skill === skill), 'never substitutes another skill').toBe(true);
          const keys = shown.map(visibleKey);
          expect(new Set(keys).size, `repeated question in ${skill} ${kind}`).toBe(keys.length);
        }
      });
    }
  }
});

describe('mixed sessions (Daily Review, Level Challenge, placement)', () => {
  for (const L of LEVELS) {
    it(`Level ${L.id}: Daily Review has ${MIX_ITEMS} distinct questions from several skills`, () => {
      for (let r = 0; r < RUNS; r++) {
        const mix = dailyMix({}, L.id);
        const slots = planSession('daily', mix[0]!, mix.slice(1));
        expect(slots).toHaveLength(MIX_ITEMS);
        const { shown, nulls } = simulate(slots, 2, () => true);
        expect(nulls).toBe(0);
        expect(new Set(shown.map(visibleKey)).size).toBe(shown.length);
        expect(new Set(shown.map(q => q.skill)).size).toBeGreaterThan(1);
      }
    });
    it(`Level ${L.id}: Level Challenge slots all generate`, () => {
      const skills = L.skills.filter(s => !s.id.endsWith('stories'));
      const slots = Array.from({ length: MIX_ITEMS }, (_, i): Slot => ({ skill: skills[(i * 5) % skills.length]!.id, ctx: 'practice', diff: 3, excludeModes: ['story'], hintsAllowed: true, retryAllowed: true }));
      const { shown, nulls } = simulate(slots, 2, () => true);
      expect(nulls).toBe(0);
      expect(shown).toHaveLength(MIX_ITEMS);
    });
  }
});

describe('generation terminates quickly even when every alternative has been seen', () => {
  it('a session that has already seen everything still gets a valid question (no hang, no empty pool)', () => {
    for (const { skill, story } of ALL) {
      const slot: Slot = { skill, ctx: story ? 'story' : 'practice', hintsAllowed: true, retryAllowed: true };
      const seen = new Set<string>();
      const t0 = Date.now();
      for (let k = 0; k < 40; k++) { const q = nextQuestion(slot, 1, seen); expect(q).not.toBeNull(); markSeen(seen, q!); }
      expect(Date.now() - t0, `${skill} generation time`).toBeLessThan(4000);
    }
  });
});
