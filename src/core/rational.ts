/**
 * Exact rational arithmetic on safe integers. Used for fractions,
 * division checks and number-line placement — never floating point.
 */
export interface Q {
  readonly n: number;
  readonly d: number;
}

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export function q(n: number, d = 1): Q {
  if (!Number.isSafeInteger(n) || !Number.isSafeInteger(d)) throw new RangeError(`q: non-integer ${n}/${d}`);
  if (d === 0) throw new RangeError('q: zero denominator');
  if (n === 0) return { n: 0, d: 1 }; // canonical zero (never -0)
  if (d < 0) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d) || 1;
  return { n: n / g, d: d / g };
}

export const add = (a: Q, b: Q): Q => q(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: Q, b: Q): Q => q(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a: Q, b: Q): Q => q(a.n * b.n, a.d * b.d);
export const div = (a: Q, b: Q): Q => {
  if (b.n === 0) throw new RangeError('div by zero');
  return q(a.n * b.d, a.d * b.n);
};
export const cmp = (a: Q, b: Q): -1 | 0 | 1 => {
  const l = a.n * b.d;
  const r = b.n * a.d;
  return l < r ? -1 : l > r ? 1 : 0;
};
export const eq = (a: Q, b: Q): boolean => cmp(a, b) === 0;
export const isInt = (a: Q): boolean => a.d === 1;
export const toStr = (a: Q): string => (a.d === 1 ? `${a.n}` : `${a.n}/${a.d}`);

/** Parse "3", "3/4", "-2/6". Returns null on malformed input. */
export function parseQ(s: string): Q | null {
  const m = String(s).trim().match(/^(-?\d+)(?:\s*\/\s*(\d+))?$/);
  if (!m) return null;
  const d = m[2] === undefined ? 1 : Number(m[2]);
  if (d === 0) return null;
  return q(Number(m[1]), d);
}
