/** Math Detective, many-ways, sufficiency, always/sometimes/never. */
import { E } from '../../core/expr';
import { buildChoice, type OptSeed } from '../../core/options';
import type { Clue } from '../../core/types';
import { byDiff, numeric, type GenDef } from '../genkit';

/* Generator-side clue evaluator (the validator has its own). */
function holdsClue(c: Clue, n: number): boolean {
  const o = n % 10, t = Math.floor(n / 10) % 10;
  switch (c.type) {
    case 'between': return n > c.lo && n < c.hi;
    case 'parity': return (n % 2 === 0) === c.even;
    case 'multipleOf': return n % c.k === 0;
    case 'notMultipleOf': return n % c.k !== 0;
    case 'digitSum': return String(n).split('').reduce((s, d) => s + Number(d), 0) === c.sum;
    case 'onesDigit': return o === c.d;
    case 'tensDigit': return t === c.d;
    case 'onesGreaterThanTens': return o > t;
    case 'tensGreaterThanOnes': return t > o;
    case 'greaterThan': return n > c.n;
    case 'lessThan': return n < c.n;
  }
}
export function clueText(c: Clue): string {
  switch (c.type) {
    case 'between': return `I am greater than ${c.lo} and less than ${c.hi}.`;
    case 'parity': return c.even ? 'I am an even number.' : 'I am an odd number.';
    case 'multipleOf': return c.k === 10 ? 'You say me when you count by 10s.' : `You say me when you count by ${c.k}s from 0.`;
    case 'notMultipleOf': return `You do NOT say me when you count by ${c.k}s from 0.`;
    case 'digitSum': return `My digits add up to ${c.sum}.`;
    case 'onesDigit': return `My ones digit is ${c.d}.`;
    case 'tensDigit': return `My tens digit is ${c.d}.`;
    case 'onesGreaterThanTens': return 'My ones digit is greater than my tens digit.';
    case 'tensGreaterThanOnes': return 'My tens digit is greater than my ones digit.';
    case 'greaterThan': return `I am greater than ${c.n}.`;
    case 'lessThan': return `I am less than ${c.n}.`;
  }
}

function detectiveGen(id: string, domain: (d: 1 | 2 | 3) => [number, number]): GenDef {
  return {
    id, version: 2, mode: 'detective',
    gen(rng, diff) {
      const [lo, hi] = domain(diff);
      for (let attempt = 0; attempt < 200; attempt++) {
        const target = rng.int(lo, hi);
        const o = target % 10, t = Math.floor(target / 10) % 10;
        const width = rng.int(6, 14);
        const bLo = Math.max(lo - 1, target - rng.int(1, width - 1));
        const candidates: Clue[] = [
          { type: 'between', lo: bLo, hi: bLo + width },
          { type: 'parity', even: target % 2 === 0 },
          ...(target >= 10 ? [{ type: 'digitSum' as const, sum: String(target).split('').reduce((s, d) => s + Number(d), 0) }] : []),
          ...(target % 5 === 0 ? [{ type: 'multipleOf' as const, k: 5 }] : [{ type: 'notMultipleOf' as const, k: 5 }]),
          ...(target % 3 === 0 && diff >= 2 ? [{ type: 'multipleOf' as const, k: 3 }] : []),
          ...(target >= 10 && o > t ? [{ type: 'onesGreaterThanTens' as const }] : []),
          ...(target >= 10 && t > o ? [{ type: 'tensGreaterThanOnes' as const }] : []),
          ...(target >= 10 ? [{ type: 'onesDigit' as const, d: o }] : []),
        ];
        const chosen: Clue[] = [candidates[0]!];
        for (const cl of rng.shuffle(candidates.slice(1))) {
          const sols = rangeSolutions(lo, hi, chosen);
          if (sols.length === 1) break;
          const next = rangeSolutions(lo, hi, [...chosen, cl]);
          if (next.length < sols.length && next.includes(target)) chosen.push(cl);
          if (chosen.length > 4) break;
        }
        const sols = rangeSolutions(lo, hi, chosen);
        if (sols.length !== 1 || sols[0] !== target || chosen.length < 2) continue;
        return {
          badge: '🕵️ Math Detective', prompt: `Who am I? ${chosen.map((c, i) => `Clue ${i + 1}: ${clueText(c)}`).join(' ')}`,
          interaction: numeric(target, lo, hi),
          hints: ['Start with Clue 1. List the numbers that fit.', 'Cross out numbers that do not fit each new clue.'],
          explanation: `${target} is the only number from ${lo} to ${hi} that fits every clue. ${chosen.map(c => clueText(c).replace(/^I am/, `${target} is`).replace(/^My/, 'Its').replace(/my/g, 'its').replace(/^You say me/, `You say ${target}`).replace(/^You do NOT say me/, `You do not say ${target}`)).join(' ')}`,
          steps: chosen.map((_c, i) => `After clue ${i + 1}: ${rangeSolutions(lo, hi, chosen.slice(0, i + 1)).slice(0, 12).join(', ')}${rangeSolutions(lo, hi, chosen.slice(0, i + 1)).length > 12 ? ', …' : ''}`),
          math: { kind: 'clues', lo, hi, clues: chosen }, signature: `det:${target},${chosen.map(c => c.type).join(',')}`, answerText: String(target),
          reasoningObjective: 'Use logical deduction to narrow possibilities until only one number fits.',
        };
      }
      throw new Error(`${id}: could not build a uniquely solvable puzzle`);
    },
  };
}
function rangeSolutions(lo: number, hi: number, clues: Clue[]): number[] {
  const out: number[] = [];
  for (let n = lo; n <= hi; n++) if (clues.every(c => holdsClue(c, n))) out.push(n);
  return out;
}
export const detective2 = detectiveGen('detective.clues-50', d => byDiff(d, [1, 20], [10, 50], [10, 50]));
export const detective3 = detectiveGen('detective.clues-100', d => byDiff(d, [10, 60], [10, 99], [10, 99]));

export const waysToMake: GenDef = {
  id: 'detective.ways-to-make', version: 1, mode: 'another-way',
  gen(rng, diff) {
    const total = rng.pick(byDiff(diff, [10, 12], [15, 20], [20, 30, 50]));
    const goods: string[][] = [];
    const used = new Set<string>();
    while (goods.length < 2) {
      const a = rng.int(1, total - 1);
      const k = `${a}+${total - a}`;
      if (!used.has(k)) { used.add(k); goods.push([String(a), String(total - a)]); }
    }
    if (diff >= 2) {
      // one "three addends" way
      const a = rng.int(1, total - 2), b = rng.int(1, total - a - 1);
      goods[1] = [String(a), String(b), String(total - a - b)];
    }
    const toOpt = (xs: string[], value: number): OptSeed => ({ label: xs.join(' + '), value: xs.join('+'), claim: { left: E.sum(...xs.map(Number)), rel: '=', right: value } });
    const bad: string[][] = [];
    while (bad.length < 3) {
      const a = rng.int(1, total), b = rng.int(1, total);
      if (a + b !== total && a + b !== 0 && !bad.some(x => x[0] === String(a) && x[1] === String(b))) bad.push([String(a), String(b)]);
    }
    return {
      badge: '🔀 Many ways', prompt: `Which of these make ${total}? Tap one that works.`,
      interaction: buildChoice(rng, goods.map(g => toOpt(g, total)), bad.map(b => toOpt(b, total)), 4, 'grid'),
      hints: ['Add each one. Does it make exactly the target?', 'More than one answer is right!'],
      explanation: `${goods.map(g => `${g.join(' + ')} = ${total}`).join(' and ')}. Different parts can make the same total.`,
      steps: goods.map(g => `${g.join(' + ')} = ${total}`),
      math: { kind: 'claims' }, signature: `ways:${total},${goods.map(g => g.join('+')).join('|')}`, answerText: String(total),
      reasoningObjective: 'Find and compare more than one way to make a total.',
    };
  },
};

const ENOUGH_ITEMS = [
  { have: 'marbles', give: 'gives', other: 'Leo' },
  { have: 'stickers', give: 'gives', other: 'Mia' },
  { have: 'shells', give: 'gives', other: 'Kai' },
  { have: 'crayons', give: 'shares', other: 'Ava' },
];
export const enoughInfo: GenDef = {
  id: 'detective.enough-info', version: 1, mode: 'detective',
  gen(rng, diff) {
    const it = rng.pick(ENOUGH_ITEMS);
    const name = rng.pick(['Omar', 'Lina', 'Theo', 'Priya', 'Jin', 'Sofia']);
    const a = rng.int(byDiff(diff, 8, 15, 30), byDiff(diff, 15, 40, 90)), b = rng.int(2, Math.min(9, a - 2));
    const sufficient = rng.bool(0.5);
    const story = sufficient
      ? `${name} has ${a} ${it.have}. ${name} ${it.give} ${b} to ${it.other}.`
      : `${name} has some ${it.have}. ${name} ${it.give} ${b} to ${it.other}.`;
    const question = `How many ${it.have} does ${name} have now?`;
    const opts: OptSeed[] = sufficient
      ? [
          { label: `Yes. ${a} − ${b} = ${a - b}.`, value: 'yes', claim: { left: E.sub(a, b), rel: '=', right: a - b } },
          { label: `No. We need to know how many ${it.have} ${it.other} has.`, value: 'no-other', truth: false },
          { label: `Yes. ${a} + ${b} = ${a + b}.`, value: 'yes-add', claim: { left: E.sub(a, b), rel: '=', right: a + b } },
        ]
      : [
          { label: `No. We need to know how many ${it.have} ${name} had at the start.`, value: 'no-start', truth: true },
          { label: `Yes. The answer is ${b}.`, value: 'yes-b', truth: false },
          { label: `No. We need to know how old ${it.other} is.`, value: 'no-age', truth: false },
        ];
    return {
      badge: '🕵️ Enough information?', story, prompt: `${question} Is there enough information to answer?`,
      interaction: buildChoice(rng, [opts[0]!], opts.slice(1), 3, 'list'),
      hints: ['What do you need to know to answer the question?', sufficient ? 'Find the start amount and the change.' : `Do we know how many ${it.have} ${name} started with?`],
      explanation: sufficient ? `Yes. We know the start (${a}) and how many were given away (${b}). ${a} − ${b} = ${a - b}.` : `No. Without the starting number, we cannot know how many ${it.have} are left. "Some" does not tell us how many.`,
      steps: sufficient ? [`${a} − ${b} = ${a - b}`] : ['Start: unknown', 'Not enough information'],
      math: { kind: 'story', structure: 'separate-result', expr: E.sub(sufficient ? a : 0, b), givens: sufficient ? [a, b] : [b], irrelevant: [], sufficient },
      signature: `enough:${sufficient},${a},${b}`, answerText: sufficient ? String(a - b) : 'No',
      reasoningObjective: 'Decide whether a problem gives enough information, and name what is missing.',
    };
  },
};

/* Always / sometimes / never — the VALIDATOR re-derives the answer by brute force. */
const ASN: { key: string; text: string; ans: 'always' | 'sometimes' | 'never'; why: string; ex?: string }[] = [
  { key: 'even+even', text: 'When you add two even numbers, the sum is even.', ans: 'always', why: 'Even numbers are made of pairs. Pairs plus pairs are still pairs.' },
  { key: 'odd+odd', text: 'When you add two odd numbers, the sum is odd.', ans: 'never', why: 'Each odd number has one left over. The two leftovers make a pair, so the sum is even.', ex: '3 + 5 = 8' },
  { key: 'odd+even', text: 'When you add an odd number and an even number, the sum is even.', ans: 'never', why: 'The odd number has one left over that has no partner, so the sum is odd.', ex: '3 + 4 = 7' },
  { key: 'x*2', text: 'A whole number times 2 is even.', ans: 'always', why: 'Times 2 means two equal groups, so it can always be split into pairs.' },
  { key: 'x*5-ends5', text: 'A whole number times 5 ends in 5.', ans: 'sometimes', why: 'It ends in 5 for odd numbers (3 × 5 = 15) but in 0 for even numbers (4 × 5 = 20).', ex: '4 × 5 = 20' },
  { key: 'x+10-ones', text: 'Adding 10 to a number does not change its ones digit.', ans: 'always', why: 'Adding 10 adds one ten. The ones stay the same.' },
  { key: 'a-b<a', text: 'When you subtract a whole number from another, the answer is less than the first number.', ans: 'sometimes', why: 'It is less, unless you subtract 0: 7 − 0 = 7.', ex: '7 − 0 = 7' },
  { key: 'x*0', text: 'A whole number times 0 is 0.', ans: 'always', why: 'Zero groups of anything, or any number of groups of zero, is zero.' },
  { key: 'x*4-even', text: 'A whole number times 4 is odd.', ans: 'never', why: '4 is 2 × 2, so times 4 is always even.', ex: '3 × 4 = 12' },
];
export const alwaysSometimesNever: GenDef = {
  id: 'patterns.asn', version: 1, mode: 'explain',
  gen(rng) {
    const s = rng.pick(ASN);
    const words = { always: 'Always true', sometimes: 'Sometimes true', never: 'Never true' } as const;
    return {
      badge: '💬 Always, sometimes, or never?', prompt: `"${s.text}" Is this always, sometimes, or never true?`,
      interaction: buildChoice(rng, [{ label: words[s.ans], value: s.ans }], (['always', 'sometimes', 'never'] as const).filter(x => x !== s.ans).map(x => ({ label: words[x], value: x })), 3, 'list', true),
      hints: ['Try some examples with small numbers.', s.ex ? `Try this one: ${s.ex}.` : 'Try at least three different examples. Can you find one that does not work?'],
      explanation: `${words[s.ans]}. ${s.why}`,
      steps: ['Try examples.', 'Look for a reason that works for every number.'],
      math: { kind: 'asn', key: s.key }, signature: `asn:${s.key}`, answerText: words[s.ans],
      reasoningObjective: 'Test a general claim with examples and justify it.',
    };
  },
};
