import { describe, expect, it } from 'vitest';
import { applyCheck, emptyRecord, explainState, pushAttempt, reviewDue, RULES, skillState, type Attempt } from '../../src/learning/mastery';
import { Adapter, planSession, roundStars, startDifficulty } from '../../src/learning/session';
import { recommend, suggestLevel } from '../../src/learning/recommend';
import { coinsFor } from '../../src/learning/rewards';

let n = 0;
const att = (o: Partial<Attempt> = {}): Attempt => ({ t: 1000 + n, qid: `q${n}`, sig: `s${n++}`, mode: 'solve', diff: 2, ctx: 'practice', correct: true, firstTry: true, tries: 1, hints: 0, guess: 0.25, ms: 4000, ...o });

describe('mastery evidence model', () => {
  it('not started → learning → practicing → ready (needs harder + reasoning evidence)', () => {
    const r = emptyRecord();
    expect(skillState(r)).toBe('not-started');
    pushAttempt(r, att({ correct: false, firstTry: false }));
    expect(skillState(r)).toBe('learning');
    for (let i = 0; i < 3; i++) pushAttempt(r, att());
    expect(skillState(r)).toBe('practicing');
    for (let i = 0; i < 3; i++) pushAttempt(r, att({ diff: 3 }));
    expect(skillState(r)).toBe('practicing'); // no reasoning item yet
    pushAttempt(r, att({ mode: 'mistake' }));
    expect(skillState(r)).toBe('ready');
  });

  it('REGRESSION: hint-assisted answers never count as independent evidence', () => {
    const r = emptyRecord();
    for (let i = 0; i < 10; i++) pushAttempt(r, att({ hints: 1, diff: 3, mode: i === 0 ? 'explain' : 'solve' }));
    expect(skillState(r)).toBe('learning');
  });

  it('REGRESSION: second-try answers are assisted, not independent', () => {
    const r = emptyRecord();
    for (let i = 0; i < 10; i++) pushAttempt(r, att({ firstTry: false, tries: 2, diff: 3 }));
    expect(skillState(r)).toBe('learning');
  });

  it('REGRESSION: repeating the same question does not inflate evidence', () => {
    const r = emptyRecord();
    for (let i = 0; i < 10; i++) pushAttempt(r, att({ sig: 'same', diff: 3, mode: 'explain' }));
    expect(skillState(r)).toBe('learning');
  });

  it('two-option (50%) items count half — lucky guesses do not promote', () => {
    const r = emptyRecord();
    for (let i = 0; i < 9; i++) pushAttempt(r, att({ guess: 0.5, diff: 3, mode: i === 0 ? 'explain' : 'solve' }));
    expect(skillState(r)).not.toBe('ready'); // 4.5 weighted < 5
  });

  it('REGRESSION: mastery requires a hint-free Skill Check; failing does not award it', () => {
    const r = emptyRecord();
    const weak = Array.from({ length: 6 }, (_, i) => att({ ctx: 'assessment', correct: i < 3, firstTry: i < 3 }));
    expect(applyCheck(r, 'assessment', weak, 10_000).passed).toBe(false);
    expect(skillState(r)).not.toBe('provisional');
    const strong = Array.from({ length: 6 }, (_, i) => att({ ctx: 'assessment', correct: i !== 0, firstTry: i !== 0 }));
    expect(applyCheck(r, 'assessment', strong, 20_000).passed).toBe(true);
    expect(skillState(r)).toBe('provisional');
  });

  it('assessment with repeated questions or too few items does not count', () => {
    const r = emptyRecord();
    const dup = Array.from({ length: 6 }, () => att({ ctx: 'assessment', sig: 'dup' }));
    expect(applyCheck(r, 'assessment', dup, 1).passed).toBe(false);
    expect(applyCheck(r, 'assessment', [att({ ctx: 'assessment' })], 1).passed).toBe(false);
  });

  it('retained mastery requires a check-back AFTER the delay', () => {
    const r = emptyRecord();
    applyCheck(r, 'assessment', Array.from({ length: 6 }, () => att({ ctx: 'assessment' })), 0);
    const five = () => Array.from({ length: 5 }, () => att({ ctx: 'review' }));
    expect(reviewDue(r, RULES.reviewDelayMs - 1)).toBe(false);
    applyCheck(r, 'review', five(), RULES.reviewDelayMs - 1);
    expect(skillState(r)).toBe('provisional');
    expect(reviewDue(r, RULES.reviewDelayMs)).toBe(true);
    applyCheck(r, 'review', five(), RULES.reviewDelayMs);
    expect(skillState(r)).toBe('retained');
  });

  it('a failed check-back returns the skill to practice (non-punitive message)', () => {
    const r = emptyRecord();
    applyCheck(r, 'assessment', Array.from({ length: 6 }, () => att({ ctx: 'assessment' })), 0);
    const out = applyCheck(r, 'review', Array.from({ length: 5 }, () => att({ ctx: 'review', correct: false, firstTry: false })), RULES.reviewDelayMs * 2);
    expect(out.passed).toBe(false);
    expect(skillState(r)).not.toBe('provisional');
    expect(out.message).toMatch(/refresh/i);
  });

  it('explains the state in plain language with counts', () => {
    const r = emptyRecord();
    pushAttempt(r, att()); pushAttempt(r, att({ hints: 1 })); pushAttempt(r, att({ correct: false, firstTry: false }));
    expect(explainState(r, skillState(r))).toMatch(/1 solved independently, 1 solved with help .* 1 not yet/);
  });
});

describe('session planning & adaptation', () => {
  it('practice = 2 guided, 4 independent, 2 reasoning; assessment and review have no hints or retries', () => {
    const p = planSession('practice', 'L2-add20');
    expect(p.map(s => s.ctx)).toEqual(['guided', 'guided', 'practice', 'practice', 'practice', 'practice', 'reasoning', 'reasoning']);
    const a = planSession('assessment', 'L2-add20');
    expect(a).toHaveLength(RULES.assessmentItems);
    expect(a.every(s => !s.hintsAllowed && !s.retryAllowed)).toBe(true);
    expect(planSession('review', 'L2-add20').every(s => !s.hintsAllowed)).toBe(true);
  });
  it('adapts by evidence (2 up / 2 down), not by speed', () => {
    const ad = new Adapter(1);
    ad.record(true, true); ad.record(true, true);
    expect(ad.diff).toBe(2);
    ad.record(false, true);           // assisted: no change
    ad.record(false, false); ad.record(false, false);
    expect(ad.diff).toBe(1);
  });
  it('starting difficulty follows recent independent accuracy', () => {
    const r = emptyRecord();
    expect(startDifficulty(r)).toBe(1);
    for (let i = 0; i < 6; i++) pushAttempt(r, att({ diff: 2 }));
    expect(startDifficulty(r)).toBe(3);
  });
  it('stars: first-try = 1, later-correct = ½', () => {
    expect(roundStars([{ correct: true, firstTry: true }, { correct: true, firstTry: false }]).pct).toBe(75);
    expect(roundStars([]).stars).toBe(0);
  });
});

describe('recommendations & placement', () => {
  it('suggests a Skill Check when ready and explores the next skill', () => {
    const r = emptyRecord();
    for (let i = 0; i < 6; i++) pushAttempt(r, att({ diff: 3, mode: i === 0 ? 'explain' : 'solve' }));
    const recs = recommend({ 'L2-add20': r }, 2);
    expect(recs.some(x => x.kind === 'skill-check' && x.skill === 'L2-add20')).toBe(true);
    expect(recs.some(x => x.kind === 'explore')).toBe(true);
    expect(recs.every(x => x.reason.length > 20)).toBe(true);
  });
  it('recommends a prerequisite when a skill is hard', () => {
    const r = emptyRecord();
    for (let i = 0; i < 8; i++) pushAttempt(r, att({ correct: false, firstTry: false }));
    const recs = recommend({ 'L2-sub20': r }, 2);
    expect(recs.find(x => x.kind === 'prerequisite')?.skill).toMatch(/L1-sub|L2-add20/);
  });
  it('placement suggests the first level that is not yet comfortable', () => {
    expect(suggestLevel([{ level: 1, correct: true }, { level: 1, correct: true }, { level: 1, correct: false }, { level: 2, correct: false }, { level: 2, correct: false }])).toBe(2);
    expect(suggestLevel([{ level: 1, correct: false }, { level: 1, correct: false }])).toBe(1);
  });
});

describe('rewards', () => {
  it('coins are fixed, effort-based and never random', () => {
    expect(coinsFor({ correct: false, tries: 1, hints: 0, diff: 3, mode: 'solve' })).toBe(0);
    expect(coinsFor({ correct: true, tries: 2, hints: 0, diff: 3, mode: 'solve' })).toBe(1);
    expect(coinsFor({ correct: true, tries: 1, hints: 0, diff: 3, mode: 'mistake' })).toBe(5);
    expect(coinsFor({ correct: true, tries: 1, hints: 5, diff: 1, mode: 'solve' })).toBe(1);
  });
});
