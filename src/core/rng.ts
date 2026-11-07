/**
 * Deterministic pseudo-random generator (mulberry32).
 * Every generated question is reproducible from (generatorId, seed),
 * which lets automated validation replay any failure exactly.
 */
export class Rng {
  private state: number;
  readonly seed: number;

  constructor(seed: number) {
    this.seed = seed >>> 0;
    this.state = this.seed || 0x9e3779b9;
  }

  /** Float in [0, 1). */
  next(): number {
    let t = (this.state = (this.state + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [a, b] inclusive. Throws if the range is empty. */
  int(a: number, b: number): number {
    if (!Number.isInteger(a) || !Number.isInteger(b) || b < a) {
      throw new RangeError(`Rng.int: empty or non-integer range [${a}, ${b}]`);
    }
    return a + Math.floor(this.next() * (b - a + 1));
  }

  bool(p = 0.5): boolean {
    return this.next() < p;
  }

  pick<T>(arr: readonly T[]): T {
    if (arr.length === 0) throw new RangeError('Rng.pick: empty array');
    return arr[Math.floor(this.next() * arr.length)]!;
  }

  shuffle<T>(arr: readonly T[]): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j]!, a[i]!];
    }
    return a;
  }

  /** k distinct elements, order randomized. */
  sample<T>(arr: readonly T[], k: number): T[] {
    if (k > arr.length) throw new RangeError('Rng.sample: k > length');
    return this.shuffle(arr).slice(0, k);
  }

  /** Derive an independent child generator (for sub-steps). */
  fork(salt: number): Rng {
    return new Rng((this.seed ^ Math.imul(salt + 1, 0x85ebca6b)) >>> 0);
  }
}

/** Fresh seed from the platform RNG (used only at the session boundary). */
export function freshSeed(): number {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0]!;
  }
  return Math.floor(Math.random() * 2 ** 32) >>> 0;
}
