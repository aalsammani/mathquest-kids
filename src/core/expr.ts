/**
 * Tiny expression language used to describe the mathematics of a question
 * independently of its wording. Validators evaluate these exactly.
 */
import { add, cmp, div, mul, q, sub, type Q } from './rational';

export type Op = '+' | '-' | '×' | '÷';
export type Expr =
  | number
  | { frac: [number, number] }
  | { op: Op; a: Expr; b: Expr }
  | { unknown: true };

export type Rel = '=' | '<' | '>' | '≠';

export interface Claim {
  left: Expr;
  rel: Rel;
  right: Expr;
}

export const E = {
  add: (a: Expr, b: Expr): Expr => ({ op: '+', a, b }),
  sub: (a: Expr, b: Expr): Expr => ({ op: '-', a, b }),
  mul: (a: Expr, b: Expr): Expr => ({ op: '×', a, b }),
  div: (a: Expr, b: Expr): Expr => ({ op: '÷', a, b }),
  frac: (n: number, d: number): Expr => ({ frac: [n, d] }),
  X: { unknown: true } as Expr,
  sum: (...xs: Expr[]): Expr => xs.reduce((acc, x) => ({ op: '+', a: acc, b: x })),
};

export class EvalError extends Error {}

/** Evaluate exactly. `x` substitutes the unknown. Division must be exact
 *  when `integerDivision` is true (the default for elementary problems). */
export function evaluate(e: Expr, x?: Q, integerDivision = true): Q {
  if (typeof e === 'number') return q(e);
  if ('frac' in e) return q(e.frac[0], e.frac[1]);
  if ('unknown' in e) {
    if (!x) throw new EvalError('unknown without substitution');
    return x;
  }
  const a = evaluate(e.a, x, integerDivision);
  const b = evaluate(e.b, x, integerDivision);
  switch (e.op) {
    case '+':
      return add(a, b);
    case '-':
      return sub(a, b);
    case '×':
      return mul(a, b);
    case '÷': {
      if (b.n === 0) throw new EvalError('division by zero');
      const r = div(a, b);
      if (integerDivision && a.d === 1 && b.d === 1 && r.d !== 1) throw new EvalError('non-exact division');
      return r;
    }
  }
}

export function holds(c: Claim, x?: Q): boolean {
  const l = evaluate(c.left, x, false);
  const r = evaluate(c.right, x, false);
  const k = cmp(l, r);
  switch (c.rel) {
    case '=':
      return k === 0;
    case '<':
      return k < 0;
    case '>':
      return k > 0;
    case '≠':
      return k !== 0;
  }
}

export function containsUnknown(e: Expr): boolean {
  if (typeof e === 'number' || 'frac' in e) return false;
  if ('unknown' in e) return true;
  return containsUnknown(e.a) || containsUnknown(e.b);
}

/** All integer literals appearing in an expression (for text consistency checks). */
export function literals(e: Expr): number[] {
  if (typeof e === 'number') return [e];
  if ('frac' in e) return [e.frac[0], e.frac[1]];
  if ('unknown' in e) return [];
  return [...literals(e.a), ...literals(e.b)];
}

/** Integer solutions of `left = right` for x in [lo, hi]. */
export function solveInt(c: Claim, lo: number, hi: number): number[] {
  const out: number[] = [];
  for (let v = lo; v <= hi; v++) {
    try {
      if (holds(c, q(v))) out.push(v);
    } catch {
      /* non-exact or undefined: not a solution */
    }
  }
  return out;
}

const PREC: Record<Op, number> = { '+': 1, '-': 1, '×': 2, '÷': 2 };
/** Render with the minimum parentheses (left-assoc). */
export function show(e: Expr, parentPrec = 0, rightSide = false): string {
  if (typeof e === 'number') return String(e);
  if ('frac' in e) return `${e.frac[0]}/${e.frac[1]}`;
  if ('unknown' in e) return '?';
  const p = PREC[e.op];
  const sym = e.op === '-' ? '−' : e.op;
  const s = `${show(e.a, p)} ${sym} ${show(e.b, p, true)}`;
  const need = p < parentPrec || (rightSide && p === parentPrec);
  return need ? `(${s})` : s;
}
