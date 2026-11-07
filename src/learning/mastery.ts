/**
 * Interpretable, evidence-based skill model. NOT artificial intelligence — a small set of
 * documented, provisional rules (see docs/ASSESSMENT_AND_ADAPTATION.md).
 *
 * Key safeguards:
 *  - Hint-assisted or second-try answers are "assisted", never independent evidence.
 *  - Repeated identical questions (same signature) count once.
 *  - Two-option items (50% guess rate) count half.
 *  - Mastery needs a hint-free Skill Check; "retained" needs a delayed check-back.
 */
import type { Difficulty, Mode } from '../core/types';

export type Context = 'guided' | 'practice' | 'reasoning' | 'assessment' | 'review' | 'story' | 'placement' | 'daily';
export interface Attempt {
  t: number;
  qid: string;
  sig: string;
  mode: Mode;
  diff: Difficulty;
  ctx: Context;
  correct: boolean;
  firstTry: boolean;
  tries: number;
  hints: number;
  /** Chance of answering correctly by guessing (1/options for choice; 0 for built/typed answers). */
  guess: number;
  ms: number;
}
export interface LegacySummary { attempts: number; correct: number; mastered: boolean; stars: number; bestPct: number }
export interface SkillRecord {
  attempts: Attempt[];
  stars: number;
  bestPct: number;
  plays: number;
  timeMs: number;
  provisionalAt?: number;
  retainedAt?: number;
  lastCheck?: { t: number; kind: 'assessment' | 'review'; correct: number; total: number; passed: boolean };
  legacy?: LegacySummary;
}

export type MasteryState = 'not-started' | 'learning' | 'practicing' | 'ready' | 'provisional' | 'retained';
export const STATE_LABEL: Record<MasteryState, string> = {
  'not-started': 'Not started',
  learning: 'Learning',
  practicing: 'Practicing',
  ready: 'Ready for a Skill Check',
  provisional: 'Provisionally mastered',
  retained: 'Retained mastery shown',
};

/** Provisional thresholds — documented, adjustable, and NOT validated psychometric cut scores. */
export const RULES = {
  window: 10,                 // recent non-assessment attempts considered
  practicingIndependent: 3,   // weighted independent-correct items in window
  practicingRate: 0.5,
  readyIndependent: 5,
  readyRate: 0.8,
  readyHarderItems: 2,        // independent-correct items at difficulty ≥ 2
  assessmentItems: 6,
  assessmentPass: 0.8,        // weighted proportion correct
  reviewItems: 5,
  reviewPass: 0.8,
  reviewDelayMs: 24 * 60 * 60 * 1000, // default; parents can choose 1, 3 or 7 days
  maxAttemptsStored: 60,
};

export const weightOf = (a: Pick<Attempt, 'guess'>): number => (a.guess >= 0.5 ? 0.5 : 1);
export const isIndependent = (a: Attempt): boolean => a.correct && a.firstTry && a.hints === 0;
export const isAssisted = (a: Attempt): boolean => a.correct && !isIndependent(a);

export function emptyRecord(): SkillRecord {
  return { attempts: [], stars: 0, bestPct: 0, plays: 0, timeMs: 0 };
}

/** Recent practice evidence, de-duplicated by question signature (keeps the first, most recent occurrence). */
export function recentEvidence(rec: SkillRecord, window = RULES.window): Attempt[] {
  const seen = new Set<string>();
  const out: Attempt[] = [];
  for (let i = rec.attempts.length - 1; i >= 0 && out.length < window; i--) {
    const a = rec.attempts[i]!;
    if (a.ctx === 'assessment' || a.ctx === 'review' || a.ctx === 'placement') continue;
    if (seen.has(a.sig)) continue;
    seen.add(a.sig);
    out.push(a);
  }
  return out;
}

export interface Evidence {
  items: number;
  independentWeighted: number;
  totalWeighted: number;
  independentRate: number;
  assistedCorrect: number;
  incorrect: number;
  hintsUsed: number;
  harderIndependent: number;
  reasoningCorrect: number;
}
export function summarize(list: Attempt[]): Evidence {
  const e: Evidence = { items: list.length, independentWeighted: 0, totalWeighted: 0, independentRate: 0, assistedCorrect: 0, incorrect: 0, hintsUsed: 0, harderIndependent: 0, reasoningCorrect: 0 };
  for (const a of list) {
    const w = weightOf(a);
    e.totalWeighted += w;
    if (isIndependent(a)) { e.independentWeighted += w; if (a.diff >= 2) e.harderIndependent++; }
    else if (a.correct) e.assistedCorrect++;
    else e.incorrect++;
    if (a.hints > 0) e.hintsUsed++;
    if (a.correct && a.mode !== 'solve' && a.mode !== 'story') e.reasoningCorrect++;
  }
  e.independentRate = e.totalWeighted ? e.independentWeighted / e.totalWeighted : 0;
  return e;
}

export function skillState(rec: SkillRecord | undefined, hasReasoning = true): MasteryState {
  if (!rec) return 'not-started';
  if (rec.retainedAt !== undefined) return 'retained';
  if (rec.provisionalAt !== undefined) return 'provisional';
  if (!rec.attempts.length && !rec.legacy?.attempts) return 'not-started';
  const ev = summarize(recentEvidence(rec));
  const readyByEvidence = ev.independentWeighted >= RULES.readyIndependent && ev.independentRate >= RULES.readyRate
    && ev.harderIndependent >= RULES.readyHarderItems && (!hasReasoning || ev.reasoningCorrect >= 1);
  if (readyByEvidence || (rec.legacy?.mastered && ev.items === 0)) return 'ready';
  if (ev.independentWeighted >= RULES.practicingIndependent && ev.independentRate >= RULES.practicingRate) return 'practicing';
  if (rec.legacy && rec.legacy.attempts >= 4 && ev.items === 0 && rec.legacy.correct / rec.legacy.attempts >= 0.7) return 'practicing';
  return 'learning';
}

/** Score a Skill Check / check-back. Only hint-free, first-try answers count. */
export function scoreCheck(items: Attempt[]): { correctW: number; totalW: number; pct: number; correct: number } {
  let correctW = 0, totalW = 0, correct = 0;
  for (const a of items) {
    const w = weightOf(a);
    totalW += w;
    if (isIndependent(a)) { correctW += w; correct++; }
  }
  return { correctW, totalW, pct: totalW ? correctW / totalW : 0, correct };
}

/** Apply a completed Skill Check (assessment) or delayed check-back (review). Returns the outcome. */
export function applyCheck(rec: SkillRecord, kind: 'assessment' | 'review', items: Attempt[], now: number, delayMs = RULES.reviewDelayMs): { passed: boolean; newState: MasteryState; message: string } {
  const distinct = new Set(items.map(i => i.sig)).size;
  const s = scoreCheck(items);
  const enough = items.length >= (kind === 'assessment' ? RULES.assessmentItems : RULES.reviewItems) && distinct === items.length;
  const passed = enough && s.pct >= (kind === 'assessment' ? RULES.assessmentPass : RULES.reviewPass);
  rec.lastCheck = { t: now, kind, correct: s.correct, total: items.length, passed };
  let message: string;
  if (kind === 'assessment') {
    if (passed) { rec.provisionalAt ??= now; message = 'Skill Check passed! We will check back later to see if it sticks.'; }
    else message = enough ? 'Not yet — a bit more practice and you can try again.' : 'This check was too short to count.';
  } else {
    const due = rec.provisionalAt !== undefined && now - rec.provisionalAt >= delayMs;
    if (passed && due) { rec.retainedAt = now; message = 'You still remember it! That shows lasting understanding.'; }
    else if (passed) message = 'Nice! The check-back counts after a little more time has passed.';
    else { delete rec.provisionalAt; message = "Let's refresh this skill with some practice — that is how memories grow stronger."; }
  }
  return { passed, newState: skillState(rec), message };
}

export function reviewDue(rec: SkillRecord | undefined, now: number, delayMs = RULES.reviewDelayMs): boolean {
  return rec?.provisionalAt !== undefined && rec.retainedAt === undefined && now - rec.provisionalAt >= delayMs;
}

/** Parent-facing, plain-language explanation of a skill's status, with uncertainty language. */
export function explainState(rec: SkillRecord | undefined, state: MasteryState): string {
  if (!rec || state === 'not-started') return 'No questions answered yet.';
  const ev = summarize(recentEvidence(rec));
  const base = ev.items
    ? `In the last ${ev.items} different questions: ${Math.round(ev.independentWeighted * 10) / 10} solved independently, ${ev.assistedCorrect} solved with help (a hint or second try), ${ev.incorrect} not yet.`
    : 'Progress carried over from the earlier version of MathQuest.';
  const tail: Record<MasteryState, string> = {
    'not-started': '',
    learning: ' Still building understanding — more practice and worked examples will help.',
    practicing: ' Getting more independent. A few more varied, harder questions will show readiness.',
    ready: ' The evidence suggests readiness for a hint-free Skill Check.',
    provisional: ` Passed a hint-free Skill Check${rec.lastCheck ? ` (${rec.lastCheck.correct}/${rec.lastCheck.total})` : ''}. A later check-back will show whether it lasts.`,
    retained: ' Passed a Skill Check and a later check-back — good evidence of lasting understanding (not a guarantee).',
  };
  return base + tail[state];
}

export function pushAttempt(rec: SkillRecord, a: Attempt) {
  rec.attempts.push(a);
  if (rec.attempts.length > RULES.maxAttemptsStored) rec.attempts.splice(0, rec.attempts.length - RULES.maxAttemptsStored);
}
