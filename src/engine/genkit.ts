/** Shared building blocks for question generators. */
import type { Rng } from '../core/rng';
import type { Difficulty, Mode, QuestionDraft } from '../core/types';
import { buildChoice, numericDistractors, numOpt, type OptSeed } from '../core/options';

export interface GenDef {
  /** Stable id, e.g. "add.objects". */
  id: string;
  /** Bump whenever output for a given seed changes. */
  version: number;
  mode: Mode;
  gen(rng: Rng, diff: Difficulty): QuestionDraft;
}

export type Draft = QuestionDraft;

/** Things children can count. Emoji chosen to depict the noun exactly. */
export const THINGS: readonly { e: string; one: string; many: string }[] = [
  { e: '🍎', one: 'apple', many: 'apples' },
  { e: '⭐', one: 'star', many: 'stars' },
  { e: '🎈', one: 'balloon', many: 'balloons' },
  { e: '🍪', one: 'cookie', many: 'cookies' },
  { e: '🦋', one: 'butterfly', many: 'butterflies' },
  { e: '🌸', one: 'flower', many: 'flowers' },
  { e: '🐶', one: 'puppy', many: 'puppies' },
  { e: '🐟', one: 'fish', many: 'fish' },
  { e: '🧸', one: 'teddy bear', many: 'teddy bears' },
  { e: '🍓', one: 'strawberry', many: 'strawberries' },
  { e: '🐞', one: 'ladybug', many: 'ladybugs' },
  { e: '🚗', one: 'car', many: 'cars' },
];

export const range = (a: number, b: number): number[] => Array.from({ length: b - a + 1 }, (_, i) => a + i);
export const countList = (from: number, n: number, step = 1): string =>
  Array.from({ length: n }, (_, i) => from + step * (i + 1)).join(', ');

/** Multiple-choice numeric question helper. */
export function numChoice(rng: Rng, answer: number, opts: Parameters<typeof numericDistractors>[2] = {}, suffix = '') {
  const ds = numericDistractors(rng, answer, opts).map(n => numOpt(n, suffix));
  return buildChoice(rng, [numOpt(answer, suffix)], ds);
}

/** Text choice helper (values default to labels). */
export function textChoice(rng: Rng, correct: string | OptSeed, wrong: (string | OptSeed)[], count = 4, layout: 'grid' | 'two' | 'list' = 'grid') {
  const toSeed = (x: string | OptSeed): OptSeed => (typeof x === 'string' ? { label: x, value: x } : x);
  return buildChoice(rng, [toSeed(correct)], wrong.map(toSeed), count, layout);
}

export function numeric(answer: number, min: number, max: number, unit?: string) {
  return { type: 'numeric' as const, answer, accept: [], min, max, ...(unit ? { unit } : {}) };
}

/** Difficulty-indexed pick: d1, d2, d3. */
export const byDiff = <T>(diff: Difficulty, a: T, b: T, c: T): T => (diff === 1 ? a : diff === 2 ? b : c);
