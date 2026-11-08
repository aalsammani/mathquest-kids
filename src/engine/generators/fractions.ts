/** Fractions: equal parts, naming, shading, equivalence, comparison, number line. Exact rational arithmetic only. */
import { E } from '../../core/expr';
import { buildChoice, type OptSeed } from '../../core/options';
import { eq, q } from '../../core/rational';
import { fractionPartName, fractionWords, numberWord } from '../../core/text';
import { pl } from '../../core/text';
import { byDiff, numChoice, type GenDef } from '../genkit';

const fOpt = (n: number, d: number, words = false): OptSeed => ({ label: words ? fractionWords(n, d) : `${n}/${d}`, value: `${n}/${d}`, aria: fractionWords(n, d) });
/** Distractor fractions that are NOT equal in value to n/d (by exact comparison). */
function fracDistractors(n: number, d: number, cands: [number, number][]): [number, number][] {
  const seen: [number, number][] = [];
  for (const [a, b] of cands) {
    if (b <= 0 || a < 0) continue;
    if (eq(q(a, b), q(n, d))) continue;
    if (seen.some(([x, y]) => eq(q(x, y), q(a, b)) || (x === a && y === b))) continue;
    seen.push([a, b]);
  }
  return seen;
}

export const fracName: GenDef = {
  id: 'frac.name', version: 4, mode: 'solve',
  gen(rng, diff) {
    const den = rng.pick(byDiff(diff, [2, 3, 4], [2, 3, 4], [3, 4, 6, 8]));
    const num = diff === 1 ? 1 : rng.int(1, den - 1);
    const words = diff === 1;
    const circle = rng.bool(0.4);
    const cands: [number, number][] = [[den - num, den], [num, den - num], [num, den + 1], [num + 1, den], [Math.max(1, num - 1), den]];
    if (!words) cands.splice(2, 0, [den, num]); // numerator/denominator swap only once notation is used
    const ds = fracDistractors(num, den, cands.filter(([, b]) => !words || b > 1));
    return {
      badge: '🍫 Equal parts', prompt: 'What fraction of the shape is shaded?',
      visual: circle ? { kind: 'fraccircle', den, num } : { kind: 'fracbar', den, num },
      interaction: buildChoice(rng, [fOpt(num, den, words)], ds.map(([a, b]) => fOpt(a, b, words))),
      hints: ['First check: are all the parts the same size?', `There are ${den} equal parts. How many are shaded?`],
      explanation: `The whole is cut into ${den} equal parts and ${num} ${num === 1 ? 'is' : 'are'} shaded: ${fractionWords(num, den)}, or ${num}/${den}.`,
      steps: [`Equal parts in all (bottom number): ${den}`, `Shaded parts (top number): ${num}`, `${num}/${den}`],
      math: { kind: 'fraction', parts: den, shaded: num, equal: true, ask: 'name' }, signature: `fname:${num}/${den},${circle}`, answerText: words ? fractionWords(num, den) : `${num}/${den}`,
    };
  },
};

export const fracEqualParts: GenDef = {
  id: 'frac.equal-parts', version: 1, mode: 'explain',
  gen(rng) {
    const den = rng.pick([2, 3, 4]);
    const equal = rng.bool(0.45);
    let widths: number[];
    if (equal) widths = Array(den).fill(1);
    else {
      do { widths = Array.from({ length: den }, () => rng.int(1, 4)); } while (widths.every(w => w === widths[0]));
    }
    const name = fractionPartName(den, 2);
    return {
      badge: '💬 Equal parts?', prompt: 'True or false? Then pick the reason.',
      visual: { kind: 'fracbar', den, num: 1, widths },
      interaction: {
        type: 'tf', statement: `This bar is cut into ${name}.`, truth: equal,
        justifications: equal
          ? [
              { id: 'j1', label: `There are ${pl(den, 'part', 'parts')} and they are all the same size.`, value: 'eq', truth: true },
              { id: 'j2', label: `Any ${pl(den, 'part', 'parts')} make ${name}, even if they are different sizes.`, value: 'any', truth: false },
              { id: 'j3', label: 'Only shaded parts count.', value: 'shaded', truth: false },
            ]
          : [
              { id: 'j1', label: `The ${pl(den, 'part', 'parts')} are not the same size, so they are not ${name}.`, value: 'neq', truth: true },
              { id: 'j2', label: `There are ${pl(den, 'part', 'parts')}, so they must be ${name}.`, value: 'count', truth: false },
              { id: 'j3', label: 'The bar is too long to show fractions.', value: 'long', truth: false },
            ],
        correctJust: ['j1'],
      },
      hints: ['Fractions need EQUAL parts.', 'Compare the sizes of the parts.'],
      explanation: equal ? `True. The ${pl(den, 'part', 'parts')} are equal, so each is one ${fractionPartName(den)}.` : `False. The parts are different sizes. ${name.charAt(0).toUpperCase() + name.slice(1)} must be ${den} equal parts.`,
      steps: ['Count the parts.', 'Check that they are equal.'],
      math: { kind: 'fraction', parts: den, shaded: 1, equal, ask: 'equal-parts' }, signature: `feq:${den},${widths.join('')}`, answerText: equal ? 'True' : 'False',
      reasoningObjective: 'Explain why fractions require equal parts.',
    };
  },
};

export const fracShade: GenDef = {
  id: 'frac.shade', version: 1, mode: 'solve',
  gen(rng, diff) {
    const den = rng.pick(byDiff(diff, [2, 3, 4], [3, 4, 6], [4, 6, 8]));
    const num = rng.int(1, den - 1);
    const shape = rng.pick(['bar', 'circle'] as const);
    return {
      badge: '🍫 Build a fraction', prompt: `Tap parts to shade ${num}/${den} of the ${shape === 'bar' ? 'bar' : 'circle'}.`,
      interaction: { type: 'shade', shape, parts: den, answer: num },
      hints: [`The ${shape} has ${den} equal parts.`, `Shade ${numberWord(num)} of them.`],
      explanation: `${num}/${den} means ${num} of ${den} equal parts ${num === 1 ? 'is' : 'are'} shaded.`,
      steps: [`${den} equal parts`, `Shade ${num}`],
      math: { kind: 'fraction', parts: den, shaded: num, equal: true, ask: 'shade' }, signature: `fshade:${num}/${den}`, answerText: `${num}/${den}`,
    };
  },
};

export const fracWhole: GenDef = {
  id: 'frac.whole', version: 2, mode: 'solve',
  gen(rng) {
    const den = rng.pick([2, 3, 4, 6, 8]);
    return {
      badge: '🍫 One whole', prompt: `How many ${fractionPartName(den, 2)} make one whole?`,
      visual: { kind: 'fracbar', den, num: den, label: `${den}/${den} = 1 whole` },
      interaction: numChoice(rng, den, { min: 1, max: 12, misconceptions: [1, den - 1, den + 1], spread: 2 }),
      hints: ['One whole means every part is shaded.', `Count the equal parts in the bar: there are ${den}.`],
      explanation: `${den} ${fractionPartName(den, 2)} make one whole: ${den}/${den} = 1.`,
      steps: [`${den}/${den} = 1`],
      math: { kind: 'fraction', parts: den, shaded: den, equal: true, ask: 'whole' }, signature: `fwhole:${den}`, answerText: String(den),
    };
  },
};

/* ---------------------------------------------------------------- equivalence */
const EQUIV: [number, number, number][] = [ // n/d = (n*k)/(d*k), results within eighths/twelfths
  [1, 2, 2], [1, 2, 3], [1, 2, 4], [1, 3, 2], [2, 3, 2], [1, 4, 2], [3, 4, 2], [1, 3, 3], [2, 3, 3], [1, 2, 5],
];
export const fracEquivMissing: GenDef = {
  id: 'fequiv.missing', version: 1, mode: 'solve',
  gen(rng, diff) {
    const [n, d, k] = rng.pick(diff === 1 ? EQUIV.slice(0, 5) : EQUIV);
    const D = d * k, N = n * k;
    return {
      badge: '🍕 Equal fractions', prompt: `${n}/${d} = ?/${D}`,
      visual: { kind: 'fracstack', fracs: [[n, d], [0, D]] },
      interaction: numChoice(rng, N, { min: 0, max: 12, misconceptions: [n, n + (D - d), D - N, N + 1], spread: 2 }),
      hints: [`The bottom bar is cut into ${pl(D, 'part', 'parts')}. Each ${fractionPartName(d)} is ${k} of those parts.`, `${n} × ${k} = ?`],
      explanation: `Each ${fractionPartName(d)} is the same as ${k} ${fractionPartName(D, 2)}, so ${n}/${d} = ${N}/${D}. Both cover the same amount of the whole.`,
      steps: [`${d} × ${k} = ${D}`, `${n} × ${k} = ${N}`],
      math: { kind: 'equation', claim: { left: E.frac(n, d), rel: '=', right: E.div(E.X, D) }, lo: 0, hi: 24 }, signature: `feqm:${n}/${d}=${N}/${D}`, answerText: String(N),
    };
  },
};

export const fracEquivWhich: GenDef = {
  id: 'fequiv.which', version: 1, mode: 'solve',
  gen(rng) {
    const [n, d, k] = rng.pick(EQUIV);
    const N = n * k, D = d * k;
    const ds = fracDistractors(n, d, [[n, D], [N, d * (k + 1)], [n + k, D], [N + 1, D], [d, D], [N, D + 1]]);
    return {
      badge: '🍕 Equal fractions', prompt: `Which fraction is equal to ${n}/${d}?`,
      visual: { kind: 'fracbar', den: d, num: n },
      interaction: buildChoice(rng, [fOpt(N, D)], ds.map(([a, b]) => fOpt(a, b))),
      hints: ['Equal fractions cover the same amount of the same whole.', `Cut each ${fractionPartName(d)} into ${k} equal pieces. How many pieces are shaded now?`],
      explanation: `${n}/${d} = ${N}/${D}. Cutting each part into ${k} pieces gives ${D} pieces, and ${N} are shaded.`,
      steps: [`${n}/${d} = ${n * k}/${d * k}`],
      math: { kind: 'fraction', parts: d, shaded: n, equal: true, ask: 'name' }, signature: `feqw:${n}/${d},${k}`, answerText: `${N}/${D}`,
    };
  },
};

export const fracEquivMistake: GenDef = {
  id: 'fequiv.mistake', version: 1, mode: 'mistake',
  gen(rng) {
    const k = rng.pick([2, 3, 4]);
    const name = rng.pick(['Sam', 'Nia', 'Mateo', 'Hana', 'Leo', 'Zara']);
    const opts = [
      { label: `${k}/${2 * k} and 1/2 cover the same amount of the whole, so they are equal.`, value: 'eq', claim: { left: E.frac(k, 2 * k), rel: '=' as const, right: E.frac(1, 2) } },
      { label: `${name} is right: ${k}/${2 * k} is greater.`, value: 'gt', claim: { left: E.frac(k, 2 * k), rel: '>' as const, right: E.frac(1, 2) } },
      { label: `1/2 is greater, because 2 is less than ${2 * k}.`, value: 'lt', claim: { left: E.frac(1, 2), rel: '>' as const, right: E.frac(k, 2 * k) } },
    ];
    return {
      badge: '🔎 Find the mistake', prompt: `${name} says ${k}/${2 * k} is greater than 1/2, because ${k} is greater than 1. What is true?`,
      visual: { kind: 'fracstack', fracs: [[1, 2], [k, 2 * k]] },
      interaction: buildChoice(rng, [opts[0]!], opts.slice(1), 3, 'list'),
      hints: ['Compare the shaded amounts in the two bars.', `The parts in ${k}/${2 * k} are smaller, but there are more of them.`],
      explanation: `${k}/${2 * k} = 1/2. The pieces are smaller, but ${k} of them cover exactly half. You cannot compare fractions by only looking at the top numbers.`,
      steps: [`${k}/${2 * k} = 1/2`],
      math: { kind: 'claims' }, signature: `feqx:${k}`, answerText: `1/2`,
      reasoningObjective: 'Explain why a larger numerator alone does not mean a larger fraction.',
    };
  },
};

/* ---------------------------------------------------------------- comparison */
export const fracCompare: GenDef = {
  id: 'fcmp.compare', version: 1, mode: 'solve',
  gen(rng, diff) {
    const sameDen = rng.bool();
    let a: [number, number], b: [number, number];
    if (sameDen) {
      const d = rng.pick([3, 4, 6, 8]);
      const n1 = rng.int(1, d - 1);
      let n2 = rng.int(1, d - 1);
      while (n2 === n1) n2 = rng.int(1, d - 1);
      a = [n1, d]; b = [n2, d];
    } else {
      const n = rng.int(1, 3);
      const ds = rng.sample([2, 3, 4, 6, 8].filter(x => x > n), 2) as [number, number];
      a = [n, ds[0]]; b = [n, ds[1]];
    }
    const symbols = diff >= 2 && rng.bool(0.5);
    const gt = eq(q(a[0], a[1]), q(b[0], b[1])) ? '=' : a[0] * b[1] > b[0] * a[1] ? '>' : '<';
    const reason = sameDen
      ? `Both are ${fractionPartName(a[1], 2)}. ${pl(Math.max(a[0], b[0]), 'part', 'parts')} is more than ${Math.min(a[0], b[0])} ${Math.min(a[0], b[0]) === 1 ? 'part' : 'parts'}.`
      : `Both have ${a[0]} ${a[0] === 1 ? 'part' : 'parts'}. ${fractionPartName(Math.min(a[1], b[1]), 2).replace(/^./, c => c.toUpperCase())} are bigger pieces than ${fractionPartName(Math.max(a[1], b[1]), 2)}.`;
    const visual = diff === 1 ? { visual: { kind: 'fracstack' as const, fracs: [a, b] } } : {};
    if (symbols) {
      const opts = [{ label: '>', value: '>', aria: 'is greater than' }, { label: '<', value: '<', aria: 'is less than' }, { label: '=', value: '=', aria: 'is equal to' }];
      return {
        badge: '🥧 Comparing fractions', prompt: `Both fractions are parts of the same-size whole. Which symbol makes this true?  ${a[0]}/${a[1]} ___ ${b[0]}/${b[1]}`, ...visual,
        interaction: buildChoice(rng, opts.filter(o => o.value === gt), opts.filter(o => o.value !== gt), 3, 'grid', true),
        hints: [sameDen ? 'Same bottom number: the parts are the same size.' : 'Same top number: compare the size of the pieces.', 'More pieces cut from a whole means each piece is smaller.'],
        explanation: `${a[0]}/${a[1]} ${gt} ${b[0]}/${b[1]}. ${reason}`,
        steps: [reason],
        math: { kind: 'compare', a: E.frac(a[0], a[1]), b: E.frac(b[0], b[1]) }, signature: `fcmp:${a.join('/')}?${b.join('/')}`, answerText: gt,
      };
    }
    const big = gt === '>' ? a : b;
    return {
      badge: '🥧 Comparing fractions', prompt: `Both fractions are parts of the same-size whole. Which is greater: ${a[0]}/${a[1]} or ${b[0]}/${b[1]}?`, ...visual,
      interaction: buildChoice(rng, [fOpt(big[0], big[1])], [fOpt(...(big === a ? b : a))], 2, 'two'),
      hints: [sameDen ? 'The pieces are the same size. Who has more pieces?' : 'Same number of pieces. Which pieces are bigger?', 'Picture both on the same-size bar.'],
      explanation: `${big[0]}/${big[1]} is greater. ${reason}`,
      steps: [reason],
      math: { kind: 'extreme', which: 'max', items: [{ value: `${a[0]}/${a[1]}`, expr: E.frac(a[0], a[1]) }, { value: `${b[0]}/${b[1]}`, expr: E.frac(b[0], b[1]) }] },
      signature: `fcmpg:${a.join('/')},${b.join('/')}`, answerText: `${big[0]}/${big[1]}`,
    };
  },
};

export const fracCompareExplain: GenDef = {
  id: 'fcmp.explain', version: 1, mode: 'explain',
  gen(rng) {
    const [d1, d2] = rng.sample([2, 3, 4, 6, 8], 2).sort((x, y) => x - y) as [number, number];
    const opts = [
      { label: `A whole cut into ${d1} equal parts has bigger parts than the same whole cut into ${d2} equal parts.`, value: 'size', claim: { left: E.frac(1, d1), rel: '>' as const, right: E.frac(1, d2) } },
      { label: `${d2} is greater than ${d1}, so 1/${d2} is greater.`, value: 'den', claim: { left: E.frac(1, d2), rel: '>' as const, right: E.frac(1, d1) } },
      { label: 'They are equal because both have a 1 on top.', value: 'eq', claim: { left: E.frac(1, d1), rel: '=' as const, right: E.frac(1, d2) } },
    ];
    return {
      badge: '💬 Explain your thinking', prompt: `Both are parts of the same-size whole. Why is 1/${d1} greater than 1/${d2}?`,
      visual: { kind: 'fracstack', fracs: [[1, d1], [1, d2]] },
      interaction: buildChoice(rng, [opts[0]!], opts.slice(1), 3, 'list'),
      hints: ['Look at the shaded piece in each bar.', 'When you share a whole with more people, does each piece get bigger or smaller?'],
      explanation: `The more equal parts a whole is cut into, the smaller each part is. So 1/${d1} > 1/${d2}.`,
      steps: [`1/${d1} > 1/${d2}`],
      math: { kind: 'claims' }, signature: `fcmpx:${d1},${d2}`, answerText: `1/${d1}`,
      reasoningObjective: 'Justify comparisons of unit fractions by reasoning about the size of the parts.',
    };
  },
};

/* ---------------------------------------------------------------- number line */
export const fracLinePlace: GenDef = {
  id: 'fline.place', version: 1, mode: 'solve',
  gen(rng, diff) {
    const den = rng.pick(byDiff(diff, [2, 4], [3, 4, 6], [4, 6, 8]));
    const max = diff === 3 ? 2 : 1;
    let num = rng.int(1, den * max - 1);
    if (num === den) num += 1;
    return {
      badge: '📏 Fraction number line', prompt: `Put the dot at ${num}/${den}.`,
      interaction: { type: 'numberline', min: 0, max, denom: den, answer: [num, den], labelEvery: den },
      hints: [`The space from 0 to 1 is cut into ${den} equal parts.`, `Each jump is 1/${den}. Make ${pl(num, 'jump', 'jumps')} from 0.`],
      explanation: `From 0, ${pl(num, 'jump', 'jumps')} of 1/${den} lands on ${num}/${den}.`,
      steps: [`1 whole = ${pl(den, 'jump', 'jumps')} of 1/${den}`, `${pl(num, 'jump', 'jumps')} → ${num}/${den}`],
      math: { kind: 'equation', claim: { left: E.frac(num, den), rel: '=', right: E.div(E.X, den) }, lo: 0, hi: 24 }, signature: `flp:${num}/${den}`, answerText: `${num}/${den}`,
    };
  },
};

export const fracLineRead: GenDef = {
  id: 'fline.read', version: 1, mode: 'solve',
  gen(rng, diff) {
    const den = rng.pick(byDiff(diff, [2, 4], [3, 4, 6], [4, 6, 8]));
    const num = rng.int(1, den - 1);
    const ds = fracDistractors(num, den, [[num, den + 1], [num + 1, den], [den - num, den], [num, den - 1]]);
    return {
      badge: '📏 Fraction number line', prompt: 'What fraction is at the red dot?',
      visual: { kind: 'numberline', min: 0, max: 1, denom: den, labelEvery: den, marks: [{ value: [num, den] }], aria: `A number line from 0 to 1 cut into ${den} equal parts, with a dot after ${pl(num, 'part', 'parts')}` },
      interaction: buildChoice(rng, [fOpt(num, den)], ds.map(([a, b]) => fOpt(a, b))),
      hints: ['Count the SPACES between 0 and 1, not the tick marks.', `There are ${den} equal spaces. The dot is ${pl(num, 'space', 'spaces')} from 0.`],
      explanation: `0 to 1 is cut into ${den} equal spaces, and the dot is ${pl(num, 'space', 'spaces')} from 0: ${num}/${den}.`,
      steps: [`Spaces from 0 to 1: ${den}`, `Spaces to the dot: ${num}`],
      math: { kind: 'fraction', parts: den, shaded: num, equal: true, ask: 'name' }, signature: `flr:${num}/${den}`, answerText: `${num}/${den}`,
    };
  },
};
