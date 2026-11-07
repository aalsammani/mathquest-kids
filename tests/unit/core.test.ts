import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { E, evaluate, holds, show, solveInt } from '../../src/core/expr';
import { add, cmp, eq, mul, parseQ, q, sub, toStr } from '../../src/core/rational';
import { Rng } from '../../src/core/rng';
import { fractionPartName, fractionWords, numberWord, readingDemand } from '../../src/core/text';
import { buildChoice, numericDistractors } from '../../src/core/options';

const smallQ = fc.tuple(fc.integer({ min: -50, max: 50 }), fc.integer({ min: 1, max: 24 })).map(([n, d]) => q(n, d));

describe('exact rational arithmetic', () => {
  it('normalizes and compares by cross-multiplication', () => {
    expect(q(2, 4)).toEqual(q(1, 2));
    expect(q(3, -6)).toEqual({ n: -1, d: 2 });
    expect(eq(q(2, 4), q(3, 6))).toBe(true);
    expect(cmp(q(1, 3), q(1, 2))).toBe(-1);
    expect(() => q(1, 0)).toThrow();
  });
  it('field laws hold (property-based)', () => {
    fc.assert(fc.property(smallQ, smallQ, smallQ, (a, b, c) => {
      expect(add(a, b)).toEqual(add(b, a));
      expect(mul(a, b)).toEqual(mul(b, a));
      expect(add(add(a, b), c)).toEqual(add(a, add(b, c)));
      expect(mul(a, add(b, c))).toEqual(add(mul(a, b), mul(a, c)));
      expect(sub(add(a, b), b)).toEqual(a);
    }), { numRuns: 500, seed: 42 });
  });
  it('parse/format round-trip', () => {
    fc.assert(fc.property(smallQ, a => { expect(parseQ(toStr(a))).toEqual(a); }), { numRuns: 300, seed: 7 });
    expect(parseQ('3/0')).toBeNull();
    expect(parseQ('abc')).toBeNull();
  });
});

describe('expressions', () => {
  it('evaluates exactly and rejects non-exact integer division', () => {
    expect(evaluate(E.add(E.mul(3, 4), 5))).toEqual(q(17));
    expect(() => evaluate(E.div(7, 2))).toThrow();
    expect(evaluate(E.div(E.frac(1, 2), 2), undefined, false)).toEqual(q(1, 4));
  });
  it('renders with minimal parentheses', () => {
    expect(show(E.mul(E.add(2, 3), 4))).toBe('(2 + 3) × 4');
    expect(show(E.add(2, E.mul(3, 4)))).toBe('2 + 3 × 4');
    expect(show(E.sub(9, E.sub(4, 1)))).toBe('9 − (4 − 1)');
  });
  it('solves missing-number equations by brute force', () => {
    expect(solveInt({ left: E.add(7, E.X), rel: '=', right: 12 }, 0, 100)).toEqual([5]);
    expect(solveInt({ left: E.frac(1, 2), rel: '=', right: E.div(E.X, 4) }, 0, 20)).toEqual([2]);
    expect(solveInt({ left: E.mul(E.X, 0), rel: '=', right: 0 }, 0, 5)).toHaveLength(6); // identity → not unique
    expect(holds({ left: E.mul(3, 4), rel: '=', right: E.mul(4, 3) })).toBe(true);
  });
});

describe('seeded RNG', () => {
  it('is deterministic and in range', () => {
    const a = new Rng(123), b = new Rng(123);
    const xs = Array.from({ length: 50 }, () => a.int(1, 6));
    expect(xs).toEqual(Array.from({ length: 50 }, () => b.int(1, 6)));
    expect(xs.every(x => x >= 1 && x <= 6)).toBe(true);
    expect(() => new Rng(1).int(5, 4)).toThrow();
  });
});

describe('language helpers', () => {
  it('number words (American English)', () => {
    expect(numberWord(0)).toBe('zero');
    expect(numberWord(14)).toBe('fourteen');
    expect(numberWord(45)).toBe('forty-five');
    expect(numberWord(305)).toBe('three hundred five');
  });
  it('fraction words, including uncommon denominators', () => {
    expect(fractionWords(1, 2)).toBe('one half');
    expect(fractionWords(3, 4)).toBe('three fourths');
    expect(fractionPartName(6, 2)).toBe('sixths');
    expect(fractionPartName(9, 2)).toBe('ninths');
    expect(fractionPartName(7, 1)).toBe('seventh');
    expect(fractionPartName(20, 2)).toBe('twentieths');
  });
  it('estimates reading demand', () => {
    expect(readingDemand('3 + 4 = ?')).toBe('pre-reader');
    expect(readingDemand('Mia has 4 apples. She gets 3 more. How many now?')).toBe('early');
  });
});

describe('option builders', () => {
  it('never duplicates labels or values and always includes the answer', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 200 }), fc.integer({ min: 0, max: 2 ** 31 }), (ans, seed) => {
      const r = new Rng(seed);
      const ds = numericDistractors(r, ans, { min: 0, max: 300, misconceptions: [ans, ans + 1, ans + 1] });
      expect(ds).not.toContain(ans);
      expect(new Set(ds).size).toBe(ds.length);
      const c = buildChoice(r, [{ label: String(ans), value: ans }], ds.map(d => ({ label: String(d), value: d })));
      expect(c.correct).toHaveLength(1);
      expect(new Set(c.options.map(o => o.label)).size).toBe(c.options.length);
    }), { numRuns: 400, seed: 11 });
  });
});
