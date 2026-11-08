/**
 * Session planning and in-session adaptation. Pure logic (no DOM) so it is unit-testable.
 * Sequence for a skill: lesson → guided → independent → reasoning → Skill Check → later check-back.
 */
import { freshSeed } from '../core/rng';
import type { Difficulty, Mode, Question } from '../core/types';
import { REASONING_MODES, safeGenerate, SKILL_GENERATORS, GeneratorUnavailable } from '../engine/registry';
import { recentEvidence, RULES, type Attempt, type Context, type SkillRecord } from './mastery';

export type SessionKind = 'practice' | 'assessment' | 'review' | 'stories' | 'daily' | 'placement';
export interface Slot { skill: string; ctx: Context; diff?: Difficulty; modes?: Mode[]; excludeModes?: Mode[]; hintsAllowed: boolean; retryAllowed: boolean }

export function hasReasoning(skill: string): boolean {
  return (SKILL_GENERATORS[skill] ?? []).some(e => REASONING_MODES.includes(e.gen.mode));
}

/** Starting difficulty from recent independent evidence (never jumps on speed). */
export function startDifficulty(rec: SkillRecord | undefined): Difficulty {
  if (!rec) return 1;
  const ev = recentEvidence(rec, 8);
  if (ev.length < 3) return rec.legacy && rec.legacy.stars >= 2 ? 2 : 1;
  const indep = ev.filter(a => a.correct && a.firstTry && a.hints === 0);
  const rate = indep.length / ev.length;
  const maxDiffOk = Math.max(1, ...indep.map(a => a.diff));
  if (rate >= 0.8) return Math.min(3, maxDiffOk + 1) as Difficulty;
  if (rate >= 0.5) return maxDiffOk as Difficulty;
  return 1;
}

/** Questions in a standard practice round (2 guided + 6 independent + 2 reasoning/stretch). */
export const PRACTICE_ITEMS = 10;
/** Questions in a Daily Review / Level Challenge mix. */
export const MIX_ITEMS = 10;

export function planSession(kind: SessionKind, skill: string, extraSkills: string[] = []): Slot[] {
  const reasoning = hasReasoning(skill);
  const solveOnly: Mode[] = ['explain', 'mistake', 'another-way', 'detective'];
  switch (kind) {
    case 'practice': {
      const slots: Slot[] = [
        { skill, ctx: 'guided', diff: 1, excludeModes: solveOnly, hintsAllowed: true, retryAllowed: true },
        { skill, ctx: 'guided', diff: 1, excludeModes: solveOnly, hintsAllowed: true, retryAllowed: true },
        ...Array.from({ length: PRACTICE_ITEMS - 4 }, (): Slot => ({ skill, ctx: 'practice', excludeModes: reasoning ? solveOnly : [], hintsAllowed: true, retryAllowed: true })),
      ];
      if (reasoning) slots.push({ skill, ctx: 'reasoning', modes: REASONING_MODES, hintsAllowed: true, retryAllowed: true }, { skill, ctx: 'reasoning', modes: REASONING_MODES, hintsAllowed: true, retryAllowed: true });
      else slots.push({ skill, ctx: 'practice', hintsAllowed: true, retryAllowed: true }, { skill, ctx: 'practice', diff: 3, hintsAllowed: true, retryAllowed: true });
      return slots;
    }
    case 'assessment':
      return [
        ...Array.from({ length: RULES.assessmentItems - (reasoning ? 1 : 0) }, (_, i): Slot => ({ skill, ctx: 'assessment', diff: (i < 2 ? 2 : 3) as Difficulty, excludeModes: ['story'], hintsAllowed: false, retryAllowed: false })),
        ...(reasoning ? [{ skill, ctx: 'assessment' as Context, diff: 2 as Difficulty, modes: REASONING_MODES, hintsAllowed: false, retryAllowed: false }] : []),
      ];
    case 'review':
      return Array.from({ length: RULES.reviewItems }, (_, i): Slot => ({ skill, ctx: 'review', diff: (i % 2 ? 3 : 2) as Difficulty, hintsAllowed: false, retryAllowed: false }));
    case 'stories':
      return Array.from({ length: 3 }, (): Slot => ({ skill, ctx: 'story', hintsAllowed: true, retryAllowed: true }));
    case 'daily': {
      const pool = [skill, ...extraSkills].slice(0, 6);
      return Array.from({ length: MIX_ITEMS }, (_, i): Slot => ({ skill: pool[i % pool.length]!, ctx: 'daily', diff: 2, hintsAllowed: true, retryAllowed: true }));
    }
    case 'placement':
      return [skill, ...extraSkills].map((s): Slot => ({ skill: s, ctx: 'placement', diff: 2, excludeModes: ['story'], hintsAllowed: false, retryAllowed: false }));
  }
}

/** In-session adaptation: step up after 2 independent successes, down after 2 misses. */
export class Adapter {
  diff: Difficulty;
  private upRun = 0;
  private downRun = 0;
  constructor(start: Difficulty) { this.diff = start; }
  record(independentCorrect: boolean, correct: boolean) {
    if (independentCorrect) { this.upRun++; this.downRun = 0; if (this.upRun >= 2 && this.diff < 3) { this.diff = (this.diff + 1) as Difficulty; this.upRun = 0; } }
    else if (!correct) { this.downRun++; this.upRun = 0; if (this.downRun >= 2 && this.diff > 1) { this.diff = (this.diff - 1) as Difficulty; this.downRun = 0; } }
    else { this.upRun = 0; }
  }
  /** Signals that a prerequisite review may help (several misses at the easiest level). */
  get struggling(): boolean { return this.diff === 1 && this.downRun >= 2; }
}

/** What the child actually sees (prompt, story, picture, answer labels), independent of option order and ids. */
export function visibleKey(q: Question): string {
  const i = q.interaction as unknown as Record<string, unknown>;
  const labels = (xs: unknown) => (Array.isArray(xs) ? (xs as { label?: string; aria?: string }[]).map(o => o.aria ?? o.label ?? '').sort() : []);
  const inter = {
    type: i.type,
    options: labels(i.options), items: labels(i.items), left: labels(i.left), right: labels(i.right),
    statement: i.statement ?? null, just: labels(i.justifications), instruction: i.instruction ?? null,
    range: i.type === 'numberline' ? [i.min, i.max, i.denom] : i.type === 'shade' ? [i.parts, i.shape] : i.type === 'array' ? [i.product, i.fixedRows ?? null] : null,
  };
  return `v:${JSON.stringify([q.story ?? '', q.prompt, q.visual ?? null, inter])}`;
}
/** Record a shown question so the rest of the session avoids it (by signature and by what the child sees). */
export function markSeen(seen: Set<string>, q: Question) { seen.add(q.signature); seen.add(visibleKey(q)); }

/**
 * Next question for a slot. Avoids questions already shown in this session (same signature or the
 * same visible content), retrying with fresh seeds; only if a skill truly has no unseen variant left
 * at this difficulty does it allow a repeat rather than leave the child without a question.
 */
export function nextQuestion(slot: Slot, adapterDiff: Difficulty, seen: Set<string>, seed = freshSeed()): Question | null {
  const diff = slot.diff ?? adapterDiff;
  // Same skill only. Intended difficulty first; a neighbouring difficulty only once its variety is used up.
  const diffs: Difficulty[] = [diff, ...(diff < 3 ? [(diff + 1) as Difficulty] : []), ...(diff > 1 ? [(diff - 1) as Difficulty] : [])];
  let anyRepeat: Question | null = null;
  for (const d of diffs) {
    let newLook: Question | null = null; // unseen content, but a problem type already used this session
    for (let k = 0; k < 10; k++) {
      const q = generateOnce(slot, d, seen, (seed + k * 0x9e3779b1 + d * 0x85ebca6b) >>> 0);
      if (!q) break;
      if (!seen.has(visibleKey(q))) { if (!seen.has(q.signature)) return q; newLook ??= q; }
      else anyRepeat ??= q;
    }
    if (newLook) return newLook;
  }
  return anyRepeat; // valid, merely repeated: better than leaving the child without a question
}

function generateOnce(slot: Slot, diff: Difficulty, seen: Set<string>, seed: number): Question | null {
  try {
    return safeGenerate(slot.skill, diff, seed, {
      ...(slot.modes ? { modes: slot.modes } : {}),
      ...(slot.excludeModes ? { excludeModes: slot.excludeModes } : {}),
      avoidSignatures: seen,
      ...(__E2E__ && typeof window !== 'undefined' && (window as unknown as { __mqForceGen?: string }).__mqForceGen ? { onlyGenerator: (window as unknown as { __mqForceGen: string }).__mqForceGen } : {}),
    });
  } catch (e) {
    if (e instanceof GeneratorUnavailable) {
      // Same-skill relaxation only: drop the mode filter, keep the skill.
      try { return safeGenerate(slot.skill, diff, seed ^ 0x9e37, { avoidSignatures: seen }); } catch { return null; }
    }
    throw e;
  }
}

export function guessRate(q: Question): number {
  const i = q.interaction;
  if (i.type === 'choice') return i.correct.length / i.options.length;
  if (i.type === 'tf') return 0.5 / Math.max(1, i.justifications.length); // must get truth AND reason
  if (i.type === 'order') return 1 / factorial(i.items.length);
  return 0;
}
const factorial = (n: number): number => (n <= 1 ? 1 : n * factorial(n - 1));

export function makeAttempt(q: Question, ctx: Context, r: { correct: boolean; tries: number; hints: number; ms: number }): Attempt {
  return { t: Date.now(), qid: q.id, sig: q.signature, mode: q.mode, diff: q.difficulty, ctx, correct: r.correct, firstTry: r.correct && r.tries === 1, tries: r.tries, hints: r.hints, guess: guessRate(q), ms: r.ms };
}

/** Practice-round stars (preserved from v1): first-try correct = 1, later correct = ½. */
export function roundStars(attempts: Pick<Attempt, 'correct' | 'firstTry'>[]): { pct: number; stars: number } {
  if (!attempts.length) return { pct: 0, stars: 0 };
  const pts = attempts.reduce((s, a) => s + (a.firstTry ? 1 : a.correct ? 0.5 : 0), 0);
  const pct = Math.round((pts / attempts.length) * 100);
  return { pct, stars: pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 50 ? 1 : 0 };
}

declare const __E2E__: boolean;
