import { describe, expect, it } from 'vitest';
import { freshProfile } from '../../src/data/schema';
import { buildQuestion } from '../../src/engine/registry';
import { addObjects } from '../../src/engine/generators/operations';
import { recordAttempt } from '../../src/learning/progress';
import { makeAttempt } from '../../src/learning/session';

describe('recording progress', () => {
  const q = buildQuestion('L1-add', addObjects, 1, 5);
  it('updates evidence, totals, history, practice day, coins and badges', () => {
    const p = freshProfile();
    const out = recordAttempt(p, q, makeAttempt(q, 'practice', { correct: true, tries: 1, hints: 0, ms: 3000 }), new Date(2026, 10, 6));
    expect(p.skills['L1-add']!.attempts).toHaveLength(1);
    expect(p.totals).toMatchObject({ answered: 1, correct: 1 });
    expect(p.practiceDays).toEqual(['2026-11-06']);
    expect(p.history[0]).toMatchObject({ skill: 'L1-add', ok: 1, hinted: 0 });
    expect(out.coins).toBeGreaterThan(0);
    expect(out.badges.map(b => b.id)).toContain('first');
  });
  it('records hint use and persistence (second try) as assisted', () => {
    const p = freshProfile();
    recordAttempt(p, q, makeAttempt(q, 'practice', { correct: true, tries: 2, hints: 1, ms: 3000 }));
    const a = p.skills['L1-add']!.attempts[0]!;
    expect(a.firstTry).toBe(false);
    expect(a.hints).toBe(1);
    expect(p.history[0]!.hinted).toBe(1);
    expect(p.badges.persistent).toBeDefined();
  });
  it('REGRESSION: an unvalidated question is never scored', () => {
    const p = freshProfile();
    const bad = { ...q, validation: { status: 'failed' as const, issues: ['x'] } };
    const out = recordAttempt(p, bad, makeAttempt(bad, 'practice', { correct: true, tries: 1, hints: 0, ms: 1 }));
    expect(out.coins).toBe(0);
    expect(p.totals.answered).toBe(0);
    expect(p.skills['L1-add']).toBeUndefined();
  });
});
