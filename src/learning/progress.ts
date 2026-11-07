/** Applying a completed, scored item to a child profile. Pure (no DOM), unit-tested. */
import type { Question } from '../core/types';
import { todayKey, type ChildProfile } from '../data/schema';
import { emptyRecord, pushAttempt, type Attempt } from './mastery';
import { checkTotals, coinsFor, grant, type Badge } from './rewards';

export interface Outcome { coins: number; badges: Badge[] }

export function recordAttempt(p: ChildProfile, q: Question, a: Attempt, now = new Date()): Outcome {
  if (q.validation.status !== 'validated') return { coins: 0, badges: [] }; // never score an invalid item
  const rec = (p.skills[q.skill] ??= emptyRecord());
  pushAttempt(rec, a);
  p.totals.answered += 1;
  if (a.correct) p.totals.correct += 1;
  p.totals.timeMs += Math.min(a.ms, 10 * 60 * 1000);
  const day = todayKey(now);
  if (!p.practiceDays.includes(day)) { p.practiceDays.push(day); if (p.practiceDays.length > 120) p.practiceDays.shift(); }
  p.history.unshift({ d: now.getTime(), skill: q.skill, level: q.level, q: `${q.prompt}`.slice(0, 90), ok: a.correct ? 1 : 0, hinted: a.hints > 0 ? 1 : 0, tries: a.tries, ms: a.ms, mode: q.mode, ctx: a.ctx });
  if (p.history.length > 200) p.history.length = 200;

  const coins = a.ctx === 'assessment' || a.ctx === 'review' || a.ctx === 'placement' ? (a.correct ? 2 : 0) : coinsFor({ correct: a.correct, tries: a.tries, hints: a.hints, diff: a.diff, mode: q.mode });
  p.coins += coins;
  const badges: (Badge | null)[] = [];
  if (a.correct) {
    badges.push(grant(p, 'first', now));
    if (a.hints > 0) badges.push(grant(p, 'thinker', now));
    if (a.tries > 1) { p.counters.persistence += 1; badges.push(grant(p, 'persistent', now)); }
    if (q.mode === 'explain') p.counters.explain += 1;
    if (q.mode === 'mistake') p.counters.mistake += 1;
    if (q.mode === 'another-way') p.counters.anotherWay += 1;
    if (q.mode === 'detective') p.counters.detective += 1;
  }
  badges.push(...checkTotals(p));
  return { coins, badges: badges.filter((b): b is Badge => !!b) };
}
