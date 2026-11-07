/** Building option sets. Uniqueness is enforced here AND re-checked by the validator. */
import type { Rng } from './rng';
import type { Interaction, Option } from './types';

export interface OptSeed {
  label: string;
  value: string | number;
  aria?: string;
  claim?: Option['claim'];
  truth?: boolean;
  visual?: Option['visual'];
}

/**
 * Build a choice interaction from one or more correct options and candidate distractors.
 * Distractors that duplicate a correct label/value are discarded; extra distractors are
 * dropped (preferring earlier ones — callers list misconception-based distractors first).
 */
export function buildChoice(
  rng: Rng,
  correct: OptSeed[],
  distractors: OptSeed[],
  count = 4,
  layout: 'grid' | 'two' | 'list' = 'grid',
  keepOrder = false,
): Extract<Interaction, { type: 'choice' }> {
  const seenLabel = new Set<string>();
  const seenValue = new Set<string>();
  const chosen: { o: OptSeed; ok: boolean }[] = [];
  const push = (o: OptSeed, ok: boolean): boolean => {
    const lk = o.label.trim().toLowerCase();
    const vk = String(o.value);
    if (seenLabel.has(lk) || seenValue.has(vk)) return false;
    seenLabel.add(lk);
    seenValue.add(vk);
    chosen.push({ o, ok });
    return true;
  };
  correct.forEach(c => push(c, true));
  for (const d of distractors) {
    if (chosen.length >= count) break;
    push(d, false);
  }
  const ordered = keepOrder ? chosen : rng.shuffle(chosen);
  const options: Option[] = ordered.map((c, i) => ({ id: `o${i + 1}`, ...c.o }));
  return {
    type: 'choice',
    options,
    correct: ordered.map((c, i) => (c.ok ? `o${i + 1}` : '')).filter(Boolean),
    layout,
  };
}

/**
 * Numeric distractors: misconception values first, then near misses, all within [min, max],
 * all distinct from the answer and from each other.
 */
export function numericDistractors(
  rng: Rng,
  answer: number,
  opts: { min?: number; max?: number; misconceptions?: number[]; spread?: number; count?: number; exclude?: number[] } = {},
): number[] {
  const { min = 0, max = 10_000, misconceptions = [], spread = 3, count = 3, exclude = [] } = opts;
  const out: number[] = [];
  const bad = new Set<number>([answer, ...exclude]);
  const ok = (v: number) => Number.isInteger(v) && v >= min && v <= max && !bad.has(v) && !out.includes(v);
  for (const m of misconceptions) {
    if (out.length >= count) break;
    if (ok(m)) out.push(m);
  }
  let guard = 0;
  while (out.length < count && guard++ < 300) {
    const off = rng.int(1, spread) * (rng.bool() ? 1 : -1);
    const v = answer + off;
    if (ok(v)) out.push(v);
  }
  // Deterministic top-up if the range was tight.
  for (let k = 1; out.length < count && k < 200; k++) {
    if (ok(answer + k)) out.push(answer + k);
    else if (out.length < count && ok(answer - k)) out.push(answer - k);
  }
  return out.slice(0, count);
}

export const numOpt = (n: number, suffix = ''): OptSeed => ({ label: `${n}${suffix}`, value: n });
