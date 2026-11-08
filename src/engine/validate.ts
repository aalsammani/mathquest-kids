/**
 * Independent mathematical validator.
 *
 * Design rule: this file NEVER trusts a generator's answer key. It recomputes the
 * correct response(s) from the question's givens (math spec, visual, and in some
 * cases the prompt text itself) using its OWN fact tables, then compares.
 * Any disagreement, ambiguity (two correct answers where one is expected), or
 * unrepresentable value is reported as an issue and the question is rejected.
 */
import { evaluate, holds, literals, solveInt, type Claim, type Expr } from '../core/expr';
import { cmp, eq, parseQ, q, type Q } from '../core/rational';
import type { Clue, CoinName, Interaction, Option, Question, ShapeName, VisualSpec } from '../core/types';
import { numberWord } from '../core/text';

/** Plural nouns used in the app; "1 <plural>" is a grammar error. */
const PLURALS = new Set(('apples stars balloons cookies butterflies flowers puppies bears strawberries ladybugs cars parts groups bags boxes rows columns '
  + 'minutes hours days weeks cents dollars units squares sides corners vertices spaces ticks jumps tens hundreds inches centimeters meters '
  + 'marbles stickers shells crayons pieces kittens bunnies rocks snacks crabs boards bolts ropes eggs muffins carrots tomatoes sunflowers '
  + 'coins gems feathers batteries gears wheels cupcakes presents sandwiches grapes books bookmarks trays tables baskets players volunteers '
  + 'medals pears lemons cones animals dots blocks rods cubes friends packs halves thirds fourths fifths sixths eighths tenths twelfths').split(/\s+/));

/* ============================================================ independent fact tables */
type ShapeFacts = { sides: number; equalSides: boolean; rightAngles: boolean; parallelPairs: number; round: boolean };
const SHAPES: Record<ShapeName, ShapeFacts> = {
  circle:    { sides: 0, equalSides: false, rightAngles: false, parallelPairs: 0, round: true },
  oval:      { sides: 0, equalSides: false, rightAngles: false, parallelPairs: 0, round: true },
  triangle:  { sides: 3, equalSides: false, rightAngles: false, parallelPairs: 0, round: false },
  square:    { sides: 4, equalSides: true,  rightAngles: true,  parallelPairs: 2, round: false },
  rectangle: { sides: 4, equalSides: false, rightAngles: true,  parallelPairs: 2, round: false },
  rhombus:   { sides: 4, equalSides: true,  rightAngles: false, parallelPairs: 2, round: false },
  trapezoid: { sides: 4, equalSides: false, rightAngles: false, parallelPairs: 1, round: false },
  pentagon:  { sides: 5, equalSides: true,  rightAngles: false, parallelPairs: 0, round: false },
  hexagon:   { sides: 6, equalSides: true,  rightAngles: false, parallelPairs: 3, round: false },
  octagon:   { sides: 8, equalSides: true,  rightAngles: false, parallelPairs: 4, round: false },
};
/** Could `name` correctly describe a figure drawn as `shape`? (inclusive definitions; trapezoid = at least one parallel pair) */
export function nameFits(shape: ShapeName, name: string): boolean {
  const f = SHAPES[shape];
  switch (name) {
    case 'circle': return shape === 'circle';
    case 'oval': return f.round; // a circle is a special ellipse
    case 'triangle': return f.sides === 3;
    case 'quadrilateral': return f.sides === 4;
    case 'square': return f.sides === 4 && f.equalSides && f.rightAngles;
    case 'rectangle': return f.sides === 4 && f.rightAngles;
    case 'rhombus': return f.sides === 4 && f.equalSides;
    case 'parallelogram': return f.sides === 4 && f.parallelPairs === 2;
    case 'trapezoid': return f.sides === 4 && f.parallelPairs >= 1;
    case 'pentagon': return f.sides === 5;
    case 'hexagon': return f.sides === 6;
    case 'octagon': return f.sides === 8;
    case 'polygon': return f.sides >= 3;
    default: return false;
  }
}
const SHAPE_PROPERTY: Record<string, (s: ShapeFacts) => boolean> = {
  'three-sides': s => s.sides === 3,
  'four-equal-sides-four-right-angles': s => s.sides === 4 && s.equalSides && s.rightAngles,
  'five-sides': s => s.sides === 5,
  'six-sides': s => s.sides === 6,
  'eight-sides': s => s.sides === 8,
  'round-no-corners': s => s.round && s.sides === 0,
  'four-right-angles': s => s.sides === 4 && s.rightAngles,
  'four-equal-sides': s => s.sides === 4 && s.equalSides,
  'one-pair-parallel': s => s.sides === 4 && s.parallelPairs === 1,
};
const COIN_CENTS: Record<CoinName, number> = { penny: 1, nickel: 5, dime: 10, quarter: 25 };
/** Typical magnitudes in base units (cm, g, mL). */
const MAGNITUDE: Record<string, { attr: 'length' | 'mass' | 'capacity'; base: number }> = {
  'the length of your finger': { attr: 'length', base: 7 },
  'the length of a soccer field': { attr: 'length', base: 10_000 },
  'the distance between two towns': { attr: 'length', base: 2_000_000 },
  'the length of a crayon': { attr: 'length', base: 9 },
  'the height of a giraffe': { attr: 'length', base: 500 },
  'the mass of an elephant': { attr: 'mass', base: 5_000_000 },
  'the mass of a paper clip': { attr: 'mass', base: 1 },
  'the mass of a bag of potatoes': { attr: 'mass', base: 5_000 },
  'the water in a bathtub': { attr: 'capacity', base: 150_000 },
  'one spoonful of medicine': { attr: 'capacity', base: 5 },
  'the water in a swimming pool': { attr: 'capacity', base: 50_000_000 },
};
const UNIT_SIZE: Record<string, { attr: 'length' | 'mass' | 'capacity'; base: number }> = {
  millimeters: { attr: 'length', base: 0.1 }, centimeters: { attr: 'length', base: 1 }, inches: { attr: 'length', base: 2.54 },
  meters: { attr: 'length', base: 100 }, kilometers: { attr: 'length', base: 100_000 },
  grams: { attr: 'mass', base: 1 }, kilograms: { attr: 'mass', base: 1000 },
  milliliters: { attr: 'capacity', base: 1 }, liters: { attr: 'capacity', base: 1000 },
};
const CONVERSION: Record<string, number> = { 'hours>minutes': 60, 'weeks>days': 7, 'dollars>cents': 100, 'days>hours': 24, 'meters>centimeters': 100, 'kilograms>grams': 1000, 'liters>milliliters': 1000 };

function clueHolds(c: Clue, n: number): boolean {
  const digits = String(n).split('').map(Number);
  const ones = digits[digits.length - 1]!, tens = digits.length >= 2 ? digits[digits.length - 2]! : 0;
  switch (c.type) {
    case 'between': return c.lo < n && n < c.hi;
    case 'parity': return c.even ? n % 2 === 0 : n % 2 === 1;
    case 'multipleOf': return n % c.k === 0;
    case 'notMultipleOf': return n % c.k !== 0;
    case 'digitSum': return digits.reduce((a, b) => a + b, 0) === c.sum;
    case 'onesDigit': return ones === c.d;
    case 'tensDigit': return tens === c.d;
    case 'onesGreaterThanTens': return ones > tens;
    case 'tensGreaterThanOnes': return tens > ones;
    case 'greaterThan': return n > c.n;
    case 'lessThan': return n < c.n;
  }
}
/** Always/sometimes/never predicates, checked by brute force over small whole numbers. */
const ASN: Record<string, { arity: 1 | 2; pred: (x: number, y: number) => boolean | null }> = {
  'even+even': { arity: 2, pred: (x, y) => (x % 2 === 0 && y % 2 === 0 ? (x + y) % 2 === 0 : null) },
  'odd+odd': { arity: 2, pred: (x, y) => (x % 2 === 1 && y % 2 === 1 ? (x + y) % 2 === 1 : null) },
  'odd+even': { arity: 2, pred: (x, y) => (x % 2 === 1 && y % 2 === 0 ? (x + y) % 2 === 0 : null) },
  'x*2': { arity: 1, pred: x => (x * 2) % 2 === 0 },
  'x*5-ends5': { arity: 1, pred: x => (x * 5) % 10 === 5 },
  'x+10-ones': { arity: 1, pred: x => (x + 10) % 10 === x % 10 },
  'a-b<a': { arity: 2, pred: (x, y) => (y <= x ? x - y < x : null) },
  'x*0': { arity: 1, pred: x => x * 0 === 0 },
  'x*4-even': { arity: 1, pred: x => (x * 4) % 2 === 1 },
};

/* ============================================================ helpers */
const roundHalfUp = (n: number, to: number) => Math.floor((n + to / 2) / to) * to;
const timeStr = (h: number, m: number) => `${h}:${m < 10 ? '0' : ''}${m}`;
function relOf(a: Q, b: Q): '<' | '>' | '=' { const c = cmp(a, b); return c < 0 ? '<' : c > 0 ? '>' : '='; }
function ev(e: Expr): Q { return evaluate(e, undefined, true); }
function optionTrue(o: Option): boolean | null {
  const claims = o.claims ?? (o.claim ? [o.claim] : []);
  if (claims.length === 0) return o.truth === undefined ? null : o.truth;
  let ok: boolean;
  try { ok = claims.every(c => holds(c)); } catch { ok = false; }
  if (o.truth === false) return false;
  return ok;
}
function numTokens(text: string): number[] {
  // Times like 4:15 are one token; fractions like 3/4 contribute both parts.
  return (text.replace(/\d+:\d\d/g, ' ').match(/\d+/g) || []).map(Number);
}
const sameMultiset = (a: number[], b: number[]) => { const x = a.slice().sort((p, r) => p - r), y = b.slice().sort((p, r) => p - r); return x.length === y.length && x.every((v, i) => v === y[i]); };

/** The set of option ids the validator believes are correct, given a predicate on option values. */
function correctIds(inter: Extract<Interaction, { type: 'choice' }>, isCorrect: (o: Option) => boolean): string[] {
  return inter.options.filter(isCorrect).map(o => o.id);
}
function compareKey(issues: string[], inter: Extract<Interaction, { type: 'choice' }>, expected: string[], what: string) {
  const a = inter.correct.slice().sort().join(','), b = expected.slice().sort().join(',');
  if (expected.length === 0) issues.push(`${what}: no option is mathematically correct`);
  else if (a !== b) issues.push(`${what}: answer key [${a}] ≠ validator [${b}] (options: ${inter.options.map(o => `${o.id}=${o.label}`).join(' | ')})`);
}
/** Single expected numeric/string value against any interaction type. */
function checkValue(issues: string[], inter: Interaction, expected: number | string, what: string) {
  if (inter.type === 'choice') compareKey(issues, inter, correctIds(inter, o => String(o.value) === String(expected)), what);
  else if (inter.type === 'numeric') { if (inter.answer !== expected) issues.push(`${what}: numeric key ${inter.answer} ≠ ${expected}`); }
  else issues.push(`${what}: unsupported interaction ${inter.type}`);
}

/* ============================================================ visual checks */
function checkVisual(v: VisualSpec | undefined, issues: string[]) {
  if (!v) return;
  const intIn = (x: unknown, lo: number, hi: number, name: string) => { if (typeof x !== 'number' || !Number.isInteger(x) || x < lo || x > hi) issues.push(`visual ${v.kind}: ${name}=${String(x)} out of [${lo},${hi}]`); };
  switch (v.kind) {
    case 'counters': intIn(v.count, 1, 20, 'count'); if (v.cross !== undefined) intIn(v.cross, 1, v.count - 1, 'cross'); break;
    case 'twoGroups': intIn(v.n1, 1, 12, 'n1'); intIn(v.n2, 1, 12, 'n2'); break;
    case 'tenframe': intIn(v.a, 0, 20, 'a'); if (v.b !== undefined) intIn(v.a + v.b, 1, 20, 'a+b'); break;
    case 'numberline': {
      const d = v.denom ?? 1;
      if (!(v.max > v.min)) issues.push('numberline: max must exceed min');
      if ((v.max - v.min) * d > 60) issues.push('numberline: too many ticks to read');
      for (const m of v.marks ?? []) { const val = q(m.value[0], m.value[1]); if (cmp(val, q(v.min)) < 0 || cmp(val, q(v.max)) > 0) issues.push('numberline: mark outside line'); if ((m.value[0] * d) % m.value[1] !== 0) issues.push('numberline: mark not on a tick'); }
      for (const h of v.hops ?? []) if (h.from < v.min || h.to > v.max || h.to < v.min || h.from > v.max) issues.push('numberline: hop outside line');
      break;
    }
    case 'placevalue': intIn(v.h ?? 0, 0, 9, 'h'); intIn(v.t, 0, 9, 't'); intIn(v.o, 0, 9, 'o'); break;
    case 'clock': intIn(v.h, 1, 12, 'h'); intIn(v.m, 0, 59, 'm'); break;
    case 'fracbar':
      intIn(v.den, 1, 12, 'den'); intIn(v.num, 0, v.den, 'num');
      if (v.widths && v.widths.length !== v.den) issues.push('fracbar: widths length ≠ den');
      if (v.widths && v.widths.some(w => !(w > 0))) issues.push('fracbar: non-positive width');
      break;
    case 'fraccircle': intIn(v.den, 2, 12, 'den'); intIn(v.num, 0, v.den, 'num'); break;
    case 'fracstack': v.fracs.forEach(([n, d]) => { intIn(d, 1, 12, 'den'); intIn(n, 0, d, 'num'); }); break;
    case 'array': intIn(v.rows, 1, 10, 'rows'); intIn(v.cols, 1, 10, 'cols'); break;
    case 'divgroups': intIn(v.groups, 1, 10, 'groups'); intIn(v.per, 1, 12, 'per'); break;
    case 'ruler': intIn(v.len, 1, 10, 'len'); intIn((v.start ?? 0) + v.len, 1, 10, 'end'); break;
    case 'lengthpair': intIn(v.a, 1, 10, 'a'); intIn(v.b, 1, 10, 'b'); if (v.a === v.b) issues.push('lengthpair: equal lengths'); break;
    case 'areagrid': intIn(v.w, 1, 20, 'w'); intIn(v.h, 1, 15, 'h'); if (v.showGrid && (v.w > 12 || v.h > 10)) issues.push('areagrid: grid too large'); break;
    case 'bargraph':
      if (v.data.length < 2 || v.data.length > 5) issues.push('bargraph: needs 2–5 bars');
      v.data.forEach(d => { if (d.val <= 0 || d.val % v.scale !== 0) issues.push(`bargraph: ${d.label}=${d.val} not a positive multiple of scale ${v.scale}`); if (d.val / v.scale > 12) issues.push('bargraph: too tall for scale'); });
      if (new Set(v.data.map(d => d.label)).size !== v.data.length) issues.push('bargraph: duplicate labels');
      break;
    case 'posgrid': if (v.cells.length !== 9) issues.push('posgrid: needs 9 cells'); break;
    case 'compareGroups': v.boxes.forEach(b => intIn(b.n, 0, 12, 'n')); break;
    case 'compareBars': v.rows.forEach(b => intIn(b.n, 0, 14, 'n')); break;
    default: break;
  }
}

/* ============================================================ main entry */
export function validateQuestion(qn: Question): string[] {
  const issues: string[] = [];
  const inter = qn.interaction;

  // ---- generic text checks
  const textAll = `${qn.story ?? ''} ${qn.prompt}`;
  if (!qn.prompt?.trim()) issues.push('empty prompt');
  if (qn.prompt.length > 260) issues.push('prompt too long');
  if ((qn.story ?? '').length > 420) issues.push('story too long');
  const allText = [qn.prompt, qn.story ?? '', ...qn.hints, qn.explanation, ...qn.steps, JSON.stringify(inter)].join(' ');
  if (/\bundefined\b|\bNaN\b|\[object |Infinity/.test(allText)) issues.push('text contains undefined/NaN/Infinity');
  for (const t of [qn.prompt, qn.story ?? '', qn.explanation, ...qn.hints]) {
    for (const mm of t.matchAll(/(?:^|[^\d/.:])1 ([a-z]+)/g)) if (PLURALS.has(mm[1]!)) issues.push(`grammar: "1 ${mm[1]}"`);
  }
  if (qn.hints.length < 2 || qn.hints.some(h => !h.trim())) issues.push('needs ≥ 2 non-empty hints');
  if (new Set(qn.hints).size !== qn.hints.length) issues.push('duplicate hints');
  if (!qn.explanation.trim()) issues.push('empty explanation');
  if (!qn.answerText || !qn.explanation.toLowerCase().includes(qn.answerText.toLowerCase())) issues.push(`explanation does not state the answer "${qn.answerText}"`);
  for (const t of [...qn.hints, qn.explanation]) {
    const m = t.match(/the answer is (\d+)/i);
    if (m && String(m[1]) !== qn.answerText && !qn.answerText.startsWith(String(m[1]))) issues.push(`text claims a different answer: "${m[0]}"`);
  }
  if (/that means (add|subtract|multiply|divide)|means divide|key ?word tells/i.test([...qn.hints, qn.explanation].join(' '))) issues.push('keyword-rule hint');

  // ---- interaction structure
  checkInteractionStructure(inter, issues);
  checkVisual(qn.visual, issues);
  inter.type === 'choice' && inter.options.forEach(o => checkVisual(o.visual, issues));
  inter.type === 'match' && inter.left.forEach(o => checkVisual(o.visual, issues));

  // ---- semantic (spec) checks
  try { checkSpec(qn, issues, textAll); } catch (e) { issues.push(`validator exception: ${(e as Error).message}`); }

  // ---- story phases
  if (qn.phases) checkPhases(qn, issues);
  return issues;
}

function checkInteractionStructure(inter: Interaction, issues: string[]) {
  switch (inter.type) {
    case 'choice': {
      const o = inter.options;
      if (o.length < 2 || o.length > 6) issues.push(`choice: ${o.length} options`);
      if (new Set(o.map(x => x.id)).size !== o.length) issues.push('choice: duplicate ids');
      if (new Set(o.map(x => x.label.trim().toLowerCase())).size !== o.length) issues.push('choice: duplicate labels');
      if (new Set(o.map(x => String(x.value))).size !== o.length) issues.push('choice: duplicate values');
      if (inter.correct.length === 0) issues.push('choice: no correct option');
      if (inter.correct.some(id => !o.some(x => x.id === id))) issues.push('choice: correct id not an option');
      if (o.some(x => !x.label.trim())) issues.push('choice: empty label');
      break;
    }
    case 'numeric':
      if (!Number.isInteger(inter.answer)) issues.push('numeric: non-integer answer');
      if (inter.answer < inter.min || inter.answer > inter.max) issues.push('numeric: answer outside [min,max]');
      if (String(inter.answer).length > 4) issues.push('numeric: answer too long for keypad');
      break;
    case 'order':
      if (new Set(inter.items.map(i => String(i.value))).size !== inter.items.length) issues.push('order: duplicate values');
      if (inter.correctOrder.length !== inter.items.length || new Set(inter.correctOrder).size !== inter.items.length) issues.push('order: correctOrder not a permutation');
      break;
    case 'numberline': {
      const v = q(inter.answer[0], inter.answer[1]);
      if (cmp(v, q(inter.min)) < 0 || cmp(v, q(inter.max)) > 0) issues.push('numberline: answer off the line');
      if ((inter.answer[0] * inter.denom) % inter.answer[1] !== 0) issues.push('numberline: answer not on a tick');
      if ((inter.max - inter.min) * inter.denom > 60) issues.push('numberline: too many ticks');
      break;
    }
    case 'shade': if (inter.parts < 2 || inter.parts > 12 || inter.answer < 1 || inter.answer > inter.parts) issues.push('shade: invalid parts/answer'); break;
    case 'array': {
      const ok = pairsWithin(inter.product, inter.maxRows, inter.maxCols).filter(([r]) => inter.fixedRows === undefined || r === inter.fixedRows);
      if (ok.length === 0) issues.push('array: no buildable array within limits');
      break;
    }
    case 'tf': {
      if (new Set(inter.justifications.map(j => j.id)).size !== inter.justifications.length) issues.push('tf: duplicate justification ids');
      if (inter.correctJust.length === 0) issues.push('tf: no correct justification');
      if (inter.claim) { let t: boolean; try { t = holds(inter.claim); } catch { t = false; } if (t !== inter.truth) issues.push(`tf: statement truth ${inter.truth} ≠ computed ${t}`); }
      const expected = inter.justifications.filter(j => optionTrue(j) === true).map(j => j.id);
      if (inter.justifications.some(j => optionTrue(j) === null)) issues.push('tf: justification without claim or truth');
      if (expected.slice().sort().join() !== inter.correctJust.slice().sort().join()) issues.push(`tf: justification key [${inter.correctJust}] ≠ validator [${expected}]`);
      break;
    }
    case 'match': {
      if (inter.left.length !== inter.right.length) issues.push('match: unequal sides');
      if (new Set(inter.left.map(l => String(l.value))).size !== inter.left.length) issues.push('match: ambiguous left values');
      for (const [l, r] of inter.pairs) {
        const L = inter.left.find(x => x.id === l), R = inter.right.find(x => x.id === r);
        if (!L || !R) { issues.push('match: bad pair id'); continue; }
        if (String(L.value) !== String(R.value)) issues.push(`match: ${L.label} ≠ ${R.label}`);
        if (L.visual?.kind === 'counters' && L.visual.count !== Number(L.value)) issues.push('match: counters do not show the value');
        if (!/[a-z]/i.test(R.label) && Number(R.label) !== Number(R.value) && !/[×+−(]/.test(R.label)) issues.push('match: label/value mismatch');
      }
      if (new Set(inter.pairs.map(p => p[1])).size !== inter.pairs.length) issues.push('match: right side reused');
      break;
    }
  }
}
function pairsWithin(p: number, maxR: number, maxC: number): [number, number][] {
  const out: [number, number][] = [];
  for (let r = 1; r <= maxR; r++) if (p % r === 0 && p / r <= maxC) out.push([r, p / r]);
  return out;
}

function checkSpec(qn: Question, issues: string[], text: string) {
  const m = qn.math, inter = qn.interaction, v = qn.visual;
  switch (m.kind) {
    case 'equation': {
      const sols = solveInt(m.claim, m.lo, m.hi);
      if (sols.length !== 1) { issues.push(`equation: ${sols.length} integer solutions in [${m.lo},${m.hi}]`); return; }
      const s = sols[0]!;
      if (inter.type === 'numberline') {
        const val = inter.answer[1] === inter.denom && inter.denom > 1 ? q(inter.answer[0], inter.denom) : q(inter.answer[0], inter.answer[1]);
        const want = inter.denom > 1 ? q(s, inter.denom) : q(s);
        if (!eq(val, want)) issues.push(`equation/numberline: key ${inter.answer.join('/')} ≠ ${s}`);
      } else checkValue(issues, inter, s, 'equation');
      for (const lit of literals(m.claim.left).concat(literals(m.claim.right))) {
        const shownAsWord = lit <= 9999 && new RegExp(`\\b${numberWord(lit)}\\b`).test(text.toLowerCase());
        if (lit >= 2 && !numTokens(text).includes(lit) && !shownAsWord && !(v && JSON.stringify(v).includes(String(lit)))) issues.push(`equation: literal ${lit} not shown to the child`);
      }
      break;
    }
    case 'count': {
      const shown = v?.kind === 'counters' ? (v.cross ? NaN : v.count) : v?.kind === 'tenframe' ? v.a + (v.b ?? 0) : NaN;
      if (shown !== m.n) issues.push(`count: visual shows ${shown}, spec ${m.n}`);
      checkValue(issues, inter, m.n, 'count');
      break;
    }
    case 'compare': {
      const r = relOf(ev(m.a), ev(m.b));
      if (inter.type !== 'choice') { issues.push('compare: needs choice'); break; }
      compareKey(issues, inter, correctIds(inter, o => o.value === r), 'compare');
      if (v?.kind === 'compareGroups' && (v.boxes[0]!.n !== Number(m.a) || v.boxes[1]!.n !== Number(m.b))) issues.push('compare: visual counts differ');
      break;
    }
    case 'extreme': {
      const vals = m.items.map(i => ({ v: i.value, q: ev(i.expr) }));
      const best = vals.reduce((acc, x) => (cmp(x.q, acc.q) * (m.which === 'max' ? 1 : -1) > 0 ? x : acc));
      if (vals.filter(x => eq(x.q, best.q)).length !== 1) issues.push('extreme: tie');
      if (inter.type !== 'choice') { issues.push('extreme: needs choice'); break; }
      compareKey(issues, inter, correctIds(inter, o => String(o.value) === best.v), 'extreme');
      if (inter.options.some(o => !vals.some(x => x.v === String(o.value)))) issues.push('extreme: option not among compared items');
      break;
    }
    case 'order': {
      if (inter.type !== 'order') { issues.push('order: needs order interaction'); break; }
      const sorted = m.items.map(i => ({ id: i.id, q: ev(i.expr) })).sort((a, b) => cmp(a.q, b.q) * (m.direction === 'ascending' ? 1 : -1));
      if (sorted.some((x, i) => i > 0 && eq(x.q, sorted[i - 1]!.q))) issues.push('order: ties');
      if (sorted.map(s => s.id).join() !== inter.correctOrder.join()) issues.push('order: key mismatch');
      break;
    }
    case 'clock': {
      if (v?.kind !== 'clock' || v.h !== m.h || v.m !== m.m) issues.push('clock: visual mismatch');
      checkValue(issues, inter, timeStr(m.h, m.m), 'clock');
      break;
    }
    case 'elapsed': {
      const t = qn.prompt.match(/(\d{1,2}):(\d\d)/g) || [];
      const toMin = (s: string) => { const [h, mm] = s.split(':').map(Number); return (h! % 12) * 60 + mm!; };
      if (m.ask === 'end') {
        const dur = Number((qn.prompt.match(/lasts (\d+) minutes/) || [])[1]);
        if (t.length < 1 || !dur) { issues.push('elapsed: cannot parse prompt'); break; }
        const end = (toMin(t[0]!) + dur) % 720;
        const eh = Math.floor(end / 60) === 0 ? 12 : Math.floor(end / 60);
        checkValue(issues, inter, timeStr(eh, end % 60), 'elapsed-end');
      } else {
        if (t.length < 2) { issues.push('elapsed: cannot parse prompt'); break; }
        const d = (toMin(t[1]!) - toMin(t[0]!) + 720) % 720;
        checkValue(issues, inter, d, 'elapsed-duration');
      }
      break;
    }
    case 'shape': {
      if (v?.kind === 'shape' && v.name !== m.shape) issues.push('shape: visual mismatch');
      const f = SHAPES[m.shape];
      if (m.ask === 'name') {
        if (inter.type !== 'choice') break;
        compareKey(issues, inter, correctIds(inter, o => nameFits(m.shape, String(o.value))), 'shape-name');
      } else checkValue(issues, inter, f.sides, `shape-${m.ask}`);
      break;
    }
    case 'shape-property': {
      if (inter.type !== 'choice') break;
      const p = SHAPE_PROPERTY[m.property];
      if (!p) { issues.push('shape-property: unknown property'); break; }
      compareKey(issues, inter, correctIds(inter, o => SHAPES[o.value as ShapeName] !== undefined && p(SHAPES[o.value as ShapeName])), 'shape-property');
      break;
    }
    case 'shape-family': {
      if (inter.type !== 'tf') { issues.push('shape-family: needs tf'); break; }
      const truth = nameFits(m.subject, m.category);
      if (truth !== inter.truth) issues.push(`shape-family: every ${m.subject} is ${m.category} should be ${truth}`);
      break;
    }
    case 'repeating-pattern': {
      const seq = m.seq;
      if (seq[seq.length - 1] !== '?' || seq.filter(x => x === '?').length !== 1) { issues.push('pattern: needs one trailing ?'); break; }
      const shown = seq.slice(0, -1);
      let period = 0;
      for (let p = 1; p <= Math.floor(shown.length / 2); p++) if (shown.every((x, i) => i < p || x === shown[i - p])) { period = p; break; }
      if (!period) { issues.push('pattern: no repeating unit with two full repeats'); break; }
      if (new Set(shown.slice(0, period)).size < 2) issues.push('pattern: unit has only one element');
      checkValue(issues, inter, shown[shown.length - period]!, 'pattern');
      if (v?.kind === 'pattern' && v.seq.join() !== seq.join()) issues.push('pattern: visual mismatch');
      break;
    }
    case 'arith-sequence': {
      const idx = m.terms.findIndex(t => t === null);
      if (idx < 0 || m.terms.filter(t => t === null).length !== 1) { issues.push('sequence: needs exactly one gap'); break; }
      let d: number | null = null;
      for (let i = 1; i < m.terms.length; i++) { const a = m.terms[i - 1], b = m.terms[i]; if (a != null && b != null) { d = b - a; break; } }
      if (d === null) { issues.push('sequence: cannot infer step'); break; }
      const first = m.terms[0] ?? m.terms[1]! - d;
      if (m.terms.some((t, i) => t !== null && t !== first + i * d)) issues.push('sequence: not arithmetic');
      checkValue(issues, inter, first + idx * d, 'sequence');
      break;
    }
    case 'place': {
      if (v?.kind === 'placevalue' && ((v.h ?? 0) !== m.h || v.t !== m.t || v.o !== m.o)) issues.push('place: visual mismatch');
      const val = m.ask === 'value' ? 100 * m.h + 10 * m.t + m.o : m.ask === 'hundreds' ? m.h : m.ask === 'tens' ? m.t : m.o;
      const nInPrompt = numTokens(text);
      if (m.ask !== 'value' && !nInPrompt.includes(100 * m.h + 10 * m.t + m.o)) issues.push('place: number missing from prompt');
      checkValue(issues, inter, val, 'place');
      break;
    }
    case 'fraction': {
      if (!m.equal && m.ask !== 'equal-parts') issues.push('fraction: unequal parts cannot name a fraction');
      if (v?.kind === 'fracbar') {
        const equalW = !v.widths || v.widths.every(w => w === v.widths![0]);
        if (v.den !== m.parts) issues.push('fraction: visual parts mismatch');
        if (m.ask !== 'equal-parts' && v.num !== m.shaded) issues.push('fraction: visual shading mismatch');
        if (equalW !== m.equal) issues.push('fraction: visual equality mismatch');
      }
      if (v?.kind === 'fraccircle' && (v.den !== m.parts || v.num !== m.shaded)) issues.push('fraction: circle mismatch');
      if (v?.kind === 'numberline') { const mk = v.marks?.[0]; if (!mk || !eq(q(mk.value[0], mk.value[1]), q(m.shaded, m.parts)) || (v.denom ?? 1) !== m.parts) issues.push('fraction: number line mismatch'); }
      const target = q(m.shaded, m.parts);
      if (m.ask === 'name') {
        if (inter.type !== 'choice') break;
        compareKey(issues, inter, correctIds(inter, o => { const f = parseQ(String(o.value)); return !!f && eq(f, target); }), 'fraction-name');
      } else if (m.ask === 'equal-parts') {
        if (inter.type !== 'tf') break;
        if (inter.truth !== m.equal) issues.push('fraction: tf truth ≠ equal-parts fact');
      } else if (m.ask === 'shade') {
        if (inter.type !== 'shade' || inter.parts !== m.parts || inter.answer !== m.shaded) issues.push('fraction: shade key mismatch');
      } else checkValue(issues, inter, m.parts, 'fraction-whole');
      break;
    }
    case 'money': {
      if (v?.kind === 'coins' && v.list.join() !== m.coins.join()) issues.push('money: visual mismatch');
      const total = m.coins.reduce((s, c) => s + COIN_CENTS[c], 0);
      checkValue(issues, inter, total, `money-${m.ask}`);
      break;
    }
    case 'change': {
      const nums = numTokens(text);
      if (!nums.includes(m.price)) issues.push('change: price not in prompt');
      if (m.paid <= m.price) issues.push('change: paid must exceed price');
      checkValue(issues, inter, m.paid - m.price, 'change');
      break;
    }
    case 'length': {
      if (v?.kind !== 'ruler' || v.len !== m.len || v.unit !== m.unit) issues.push('length: visual mismatch');
      checkValue(issues, inter, m.len, 'length');
      break;
    }
    case 'length-compare': case 'size-compare': {
      if (v && (v.kind === 'lengthpair' || v.kind === 'sizepair') && (v.a !== m.a || v.b !== m.b)) issues.push(`${m.kind}: visual mismatch`);
      if (m.a === m.b) issues.push(`${m.kind}: equal sizes`);
      const big = m.ask === 'longer' || m.ask === 'bigger';
      checkValue(issues, inter, (big ? m.a > m.b : m.a < m.b) ? 'A' : 'B', m.kind);
      break;
    }
    case 'unit-choice': {
      const obj = MAGNITUDE[m.object];
      if (!obj || inter.type !== 'choice') { issues.push('unit-choice: unknown object'); break; }
      const dist = (u: string) => { const s = UNIT_SIZE[u]; if (!s || s.attr !== obj.attr) return Infinity; const val = obj.base / s.base; return val < 1 ? Math.log10(1 / val) : val > 100 ? Math.log10(val / 100) : 0; };
      const scored = inter.options.map(o => ({ id: o.id, d: dist(String(o.value)) })).sort((a, b) => a.d - b.d);
      if (scored.length > 1 && scored[1]!.d - scored[0]!.d < 0.5) issues.push(`unit-choice: ambiguous between ${scored[0]!.id} and ${scored[1]!.id}`);
      compareKey(issues, inter, [scored[0]!.id], 'unit-choice');
      break;
    }
    case 'convert': {
      const f = CONVERSION[`${m.from}>${m.to}`];
      if (!f) { issues.push('convert: unknown conversion'); break; }
      checkValue(issues, inter, m.amount * f, 'convert');
      break;
    }
    case 'data': {
      if (v?.kind !== 'bargraph') { issues.push('data: needs bargraph'); break; }
      const get = (l?: string) => v.data.find(d => d.label === l)?.val;
      if (m.ask === 'read') checkValue(issues, inter, get(m.target) ?? NaN, 'data-read');
      else if (m.ask === 'total') checkValue(issues, inter, v.data.reduce((s, d) => s + d.val, 0), 'data-total');
      else if (m.ask === 'diff') { const a = get(m.target), b = get(m.other); if (a === undefined || b === undefined) issues.push('data: diff labels'); else checkValue(issues, inter, Math.abs(a - b), 'data-diff'); }
      else {
        const vals = v.data.map(d => d.val), ext = m.ask === 'most' ? Math.max(...vals) : Math.min(...vals);
        if (vals.filter(x => x === ext).length !== 1) issues.push('data: tie for most/least');
        checkValue(issues, inter, v.data.find(d => d.val === ext)!.label, `data-${m.ask}`);
      }
      break;
    }
    case 'rect': {
      if (v?.kind === 'areagrid' && (v.w !== m.w || v.h !== m.h)) issues.push('rect: visual mismatch');
      checkValue(issues, inter, m.ask === 'area' ? m.w * m.h : 2 * m.w + 2 * m.h, `rect-${m.ask}`);
      break;
    }
    case 'clues': {
      const sols: number[] = [];
      for (let n = m.lo; n <= m.hi; n++) if (m.clues.every(c => clueHolds(c, n))) sols.push(n);
      if (sols.length !== 1) { issues.push(`clues: ${sols.length} solutions`); break; }
      checkValue(issues, inter, sols[0]!, 'clues');
      break;
    }
    case 'claims': {
      if (inter.type === 'choice') {
        if (inter.options.some(o => optionTrue(o) === null)) issues.push('claims: option without claim or truth');
        compareKey(issues, inter, correctIds(inter, o => optionTrue(o) === true), 'claims');
      }
      break; // tf & match are checked structurally above
    }
    case 'round': checkValue(issues, inter, roundHalfUp(m.n, m.to), 'round'); break;
    case 'estimate': {
      const ra = roundHalfUp(m.a, m.to), rb = roundHalfUp(m.b, m.to);
      checkValue(issues, inter, m.op === '+' ? ra + rb : ra - rb, 'estimate');
      if (inter.type === 'choice' && inter.options.some(o => Number(o.value) === (m.op === '+' ? m.a + m.b : m.a - m.b) && !inter.correct.includes(o.id))) issues.push('estimate: exact answer offered as a wrong option');
      break;
    }
    case 'classify': {
      const counts = new Map<string, number>();
      m.items.forEach(i => counts.set(i.group, (counts.get(i.group) ?? 0) + 1));
      const odd = m.items.filter(i => counts.get(i.group) === 1);
      if (odd.length !== 1 || counts.size !== 2) { issues.push('classify: not exactly one odd item'); break; }
      checkValue(issues, inter, odd[0]!.value, 'classify');
      break;
    }
    case 'position': {
      const ti = m.cells.indexOf(m.target), ai = m.cells.indexOf(m.anchor);
      const [tr, tc, ar, ac] = [Math.floor(ti / 3), ti % 3, Math.floor(ai / 3), ai % 3];
      const rel = tc === ac && tr === ar - 1 ? 'above' : tc === ac && tr === ar + 1 ? 'below' : tr === ar && Math.abs(tc - ac) === 1 ? 'next to' : 'none';
      if (rel === 'none') issues.push('position: no single relation');
      checkValue(issues, inter, rel, 'position');
      break;
    }
    case 'decompose': {
      if (inter.type !== 'choice') break;
      compareKey(issues, inter, correctIds(inter, o => { const ps = String(o.value).split('+').map(Number); return ps.every(Number.isInteger) && ps.every(p => p >= 0) && ps.reduce((a, b) => a + b, 0) === m.total; }), 'decompose');
      if (v?.kind === 'counters' && v.count !== m.total) issues.push('decompose: visual count mismatch');
      break;
    }
    case 'array-product': if (inter.type !== 'array' || inter.product !== m.product) issues.push('array-product: mismatch'); break;
    case 'array-count': {
      const rows = v?.kind === 'array' ? v.rows : v?.kind === 'divgroups' ? v.groups : NaN;
      const cols = v?.kind === 'array' ? v.cols : v?.kind === 'divgroups' ? v.per : NaN;
      if (rows !== m.rows || cols !== m.cols) issues.push('array-count: visual mismatch');
      if (inter.type === 'choice') {
        compareKey(issues, inter, correctIds(inter, o => {
          const s = String(o.value);
          if (s.startsWith('sum:')) return false;
          const [addend, times] = s.split('*').map(Number);
          return (addend === m.cols && times === m.rows) || (v?.kind === 'array' && addend === m.rows && times === m.cols);
        }), 'array-count');
      } else checkValue(issues, inter, m.rows * m.cols, 'array-count');
      break;
    }
    case 'story': {
      const nums = numTokens(`${qn.story ?? ''} ${qn.prompt}`);
      if (!sameMultiset(nums, [...m.givens, ...m.irrelevant])) issues.push(`story: numbers in text [${nums}] ≠ givens+irrelevant [${[...m.givens, ...m.irrelevant]}]`);
      if (m.sufficient) {
        let val: Q;
        try { val = ev(m.expr); } catch (e) { issues.push(`story: expression invalid (${(e as Error).message})`); break; }
        if (val.d !== 1 || val.n < 0) issues.push('story: answer is not a whole number');
        if (literals(m.expr).some(l => !m.givens.includes(l))) issues.push('story: expression uses a number not in the story');
        if (m.givens.some(g => !literals(m.expr).includes(g))) issues.push('story: a given is unused (mark it irrelevant)');
        if (inter.type === 'choice' && inter.options.some(o => typeof o.value === 'string' && /^(yes|no)/.test(o.value))) { /* sufficiency item, checked by claims */ if (inter.options.some(o => optionTrue(o) === null)) issues.push('story: sufficiency option unverifiable'); compareKey(issues, inter, correctIds(inter, o => optionTrue(o) === true), 'story-sufficient'); }
        else checkValue(issues, inter, val.n, 'story');
        // visual must match the structure (C4 regression)
        if (v?.kind === 'counters' && v.cross && m.structure.startsWith('compare')) issues.push('story: comparison drawn as take-away');
        if (v?.kind === 'counters' && v.cross && m.structure === 'separate-result' && (v.count !== m.givens[0] || v.cross !== m.givens[1])) issues.push('story: take-away visual numbers mismatch');
        if (v?.kind === 'twoGroups' && (v.n1 + v.n2 !== val.n)) issues.push('story: two-groups visual does not total the answer');
      } else {
        if (inter.type !== 'choice') { issues.push('story: insufficient item needs choice'); break; }
        if (inter.options.some(o => optionTrue(o) === null)) issues.push('story: option unverifiable');
        compareKey(issues, inter, correctIds(inter, o => optionTrue(o) === true), 'story-insufficient');
        if (inter.options.filter(o => inter.correct.includes(o.id)).some(o => /^yes/.test(String(o.value)))) issues.push('story: insufficient problem keyed as answerable');
      }
      break;
    }
    case 'function-table': {
      // Parse the examples from the PROMPT TEXT, infer the linear rule exactly, predict the query.
      const ex = [...qn.prompt.matchAll(/In (\d+) → Out (\d+)/g)].map(mm => [Number(mm[1]), Number(mm[2])] as [number, number]);
      const qq = Number((qn.prompt.match(/In (\d+) → Out \?/) || [])[1]);
      if (ex.length < 2 || !Number.isFinite(qq)) { issues.push('function-table: cannot parse examples'); break; }
      if (JSON.stringify(ex) !== JSON.stringify(m.pairs) || qq !== m.query) issues.push('function-table: prompt and spec disagree');
      const [x1, y1] = ex[0]!, [x2, y2] = ex[1]!;
      if (x1 === x2) { issues.push('function-table: repeated input'); break; }
      const slope = q(y2 - y1, x2 - x1);                       // exact rational slope
      const at = (x: number): Q => q(y1 * slope.d + slope.n * (x - x1), slope.d); // y1 + slope·(x − x1)
      if (ex.some(([x, y]) => !eq(at(x), q(y)))) issues.push('function-table: examples not on one line');
      const pred = at(qq);
      if (pred.d !== 1) { issues.push('function-table: non-integer prediction'); break; }
      checkValue(issues, inter, pred.n, 'function-table');
      break;
    }
    case 'asn': {
      const p = ASN[m.key];
      if (!p) { issues.push('asn: unknown key'); break; }
      let t = 0, f = 0;
      for (let x = 0; x <= 30; x++) for (let y = 0; y <= (p.arity === 2 ? 30 : 0); y++) { const r = p.pred(x, y); if (r === true) t++; else if (r === false) f++; }
      const ans = f === 0 ? 'always' : t === 0 ? 'never' : 'sometimes';
      checkValue(issues, inter, ans, 'asn');
      break;
    }
  }
}

function checkPhases(qn: Question, issues: string[]) {
  const ph = qn.phases!;
  const m = qn.math;
  if (m.kind !== 'story') { issues.push('phases on non-story'); return; }
  const ans = ev(m.expr).n;
  // plan: correct ⇔ the equation's unique whole-number solution is the answer
  compareKey(issues, ph.plan.interaction, correctIds(ph.plan.interaction, o => { const s = o.claim ? solveInt(o.claim, 0, 5000) : []; return s.length === 1 && s[0] === ans; }), 'plan');
  // understand: exactly one option describes the unknown
  const u = ph.understand.interaction;
  if (u.options.filter(o => o.truth === true).length !== 1) issues.push('understand: needs exactly one true option');
  compareKey(issues, u, correctIds(u, o => o.truth === true), 'understand');
  // explain: claims
  const ex = ph.explain.interaction;
  if (ex.options.some(o => optionTrue(o) === null)) issues.push('explain: unverifiable option');
  compareKey(issues, ex, correctIds(ex, o => optionTrue(o) === true), 'explain');
  if (!ph.check.includes(String(ans))) issues.push('check: does not mention the answer');
}

export type { Claim };
