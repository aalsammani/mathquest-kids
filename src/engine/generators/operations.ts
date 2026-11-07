/** Operations: add/subtract (objects → regrouping), composing numbers, equality, multiplication, division, properties. */
import { E, show, type Claim, type Expr } from '../../core/expr';
import { buildChoice, type OptSeed } from '../../core/options';
import type { Difficulty, Interaction } from '../../core/types';
import { pl } from '../../core/text';
import { byDiff, countList, numChoice, numeric, THINGS, type Draft, type GenDef } from '../genkit';
import type { Rng } from '../../core/rng';

const eqn = (claim: Claim, lo = 0, hi = 2000) => ({ kind: 'equation' as const, claim, lo, hi });
const isX = (e: Expr) => typeof e === 'object' && 'unknown' in e;
/** Choice at low difficulty / young levels; numeric keypad otherwise. */
function answerUI(rng: Rng, ans: number, useNumeric: boolean, misconceptions: number[], spread: number, max = 2000): Interaction {
  return useNumeric ? numeric(ans, 0, max) : numChoice(rng, ans, { min: 0, max, misconceptions, spread });
}
const claimsOpt = (label: string, claims: Claim[], value = label): OptSeed & { claims?: Claim[] } =>
  ({ label, value, claim: claims[claims.length - 1]!, ...(claims.length > 1 ? { claims } : {}) } as OptSeed);

/* ===================================================== Level 1: objects within 10 */
export const addObjects: GenDef = {
  id: 'add.objects', version: 2, mode: 'solve',
  gen(rng, diff) {
    const cap = byDiff(diff, 5, 8, 10);
    const a = rng.int(1, cap - 1), b = rng.int(1, cap - a), s = a + b;
    const t = rng.pick(THINGS);
    return {
      badge: '➕ Putting together', prompt: `${a} + ${b} = ?`,
      visual: { kind: 'twoGroups', e1: t.e, n1: a, e2: t.e, n2: b, label: t.many },
      interaction: numChoice(rng, s, { min: 0, max: 20, misconceptions: [s - 1, s + 1, Math.abs(a - b)], spread: 2 }),
      hints: [`Count all the ${t.many} together.`, `Start at ${a} and count on ${b} more: ${countList(a, b)}.`],
      explanation: `${a} ${a === 1 ? t.one : t.many} and ${b} more make ${s}. So ${a} + ${b} = ${s}.`,
      steps: [`Count the first group: ${a}.`, `Count on ${b}: ${countList(a, b)}.`, `${a} + ${b} = ${s}`],
      math: eqn({ left: E.add(a, b), rel: '=', right: E.X }), signature: `add:${Math.min(a, b)}+${Math.max(a, b)}`, answerText: String(s), readingDemand: 'pre-reader',
    };
  },
};

export const addTenFrame: GenDef = {
  id: 'add.tenframe', version: 2, mode: 'solve',
  gen(rng, diff) {
    const a = rng.int(2, byDiff(diff, 5, 7, 8)), b = rng.int(1, 10 - a), s = a + b;
    return {
      badge: '➕ Ten frame', prompt: `${a} + ${b} = ?`,
      visual: { kind: 'tenframe', a, b },
      interaction: numChoice(rng, s, { min: 0, max: 20, misconceptions: [s - 1, s + 1], spread: 2 }),
      hints: ['Count the blue dots, then keep counting through the striped dots.', `Start at ${a} and count up ${b}: ${countList(a, b)}.`],
      explanation: `${a} blue ${a === 1 ? 'dot' : 'dots'} and ${b} striped ${b === 1 ? 'dot' : 'dots'} make ${s} dots. ${a} + ${b} = ${s}.`,
      steps: [`${a} + ${b} = ${s}`],
      math: eqn({ left: E.add(a, b), rel: '=', right: E.X }), signature: `add:${Math.min(a, b)}+${Math.max(a, b)}`, answerText: String(s), readingDemand: 'pre-reader',
    };
  },
};

function changeExplain(id: string, add: boolean): GenDef {
  return {
    id, version: 1, mode: 'explain',
    gen(rng, diff) {
      const n = rng.int(add ? 3 : 4, byDiff(diff, 6, 9, 12));
      const t = rng.pick(THINGS);
      const r = add ? n + 1 : n - 1;
      const opts = [
        { label: `Now there ${r === 1 ? 'is' : 'are'} ${r}. ${add ? 'Adding 1 gives the next counting number.' : 'Taking away 1 gives the number just before.'}`, value: 'right', claim: { left: add ? E.add(n, 1) : E.sub(n, 1), rel: '=' as const, right: r } },
        { label: `There are still ${n}. Nothing changes.`, value: 'same', claim: { left: add ? E.add(n, 1) : E.sub(n, 1), rel: '=' as const, right: n } },
        { label: `Now there are ${add ? n + 2 : n - 2}.`, value: 'two', claim: { left: add ? E.add(n, 1) : E.sub(n, 1), rel: '=' as const, right: add ? n + 2 : n - 2 } },
        { label: `Now there are ${add ? n - 1 : n + 1}.`, value: 'wrongway', claim: { left: add ? E.add(n, 1) : E.sub(n, 1), rel: '=' as const, right: add ? n - 1 : n + 1 } },
      ];
      return {
        badge: '💬 What changes?', prompt: `There are ${n} ${t.many}. ${add ? `1 more ${t.one} comes.` : `1 ${t.one} goes away.`} Which is true?`,
        visual: add ? { kind: 'twoGroups', e1: t.e, n1: n, e2: t.e, n2: 1, label: t.many } : { kind: 'counters', emoji: t.e, count: n, cross: 1, label: t.many },
        interaction: buildChoice(rng, [opts[0]!], opts.slice(1), 4, 'list'),
        hints: [add ? 'When one more comes, count on by one.' : 'When one goes away, count back by one.', add ? `What comes after ${n}?` : `What comes before ${n}?`],
        explanation: add ? `${n} + 1 = ${r}. One more is the next number when we count.` : `${n} − 1 = ${r}. One less is the number just before.`,
        steps: [add ? `${n} → ${r}` : `${n} → ${r}`],
        math: { kind: 'claims' }, signature: `${id}:${n}`, answerText: String(r),
        reasoningObjective: 'Explain how a quantity changes when one object is added or removed.',
      };
    },
  };
}
export const addChange = changeExplain('add.what-changes', true);
export const subChange = changeExplain('sub.what-changes', false);

export const subObjects: GenDef = {
  id: 'sub.objects', version: 2, mode: 'solve',
  gen(rng, diff) {
    const start = rng.int(2, byDiff(diff, 5, 8, 10)), take = rng.int(1, start - 1), left = start - take;
    const t = rng.pick(THINGS);
    return {
      badge: '➖ Taking away', prompt: `${start} − ${take} = ?`,
      visual: { kind: 'counters', emoji: t.e, count: start, cross: take, label: t.many },
      interaction: numChoice(rng, left, { min: 0, max: 20, misconceptions: [start + take, left + 1, left - 1, take], spread: 2 }),
      hints: ['Count only the ones that are NOT crossed out.', `Start at ${start} and count back ${take}: ${countList(start, take, -1)}.`],
      explanation: `${start} take away ${take} leaves ${left}. So ${start} − ${take} = ${left}.`,
      steps: [`Start with ${start}.`, `Take away ${take}.`, `${left} are left.`],
      math: eqn({ left: E.sub(start, take), rel: '=', right: E.X }), signature: `sub:${start}-${take}`, answerText: String(left), readingDemand: 'pre-reader',
    };
  },
};

export const composeBond: GenDef = {
  id: 'compose.bond', version: 2, mode: 'solve',
  gen(rng, diff) {
    const total = rng.int(3, byDiff(diff, 5, 8, 10)), left = rng.int(1, total - 1), miss = total - left;
    const missLeft = rng.bool(0.3);
    return {
      badge: '🔗 Number bonds', prompt: missLeft ? `? + ${miss} = ${total}` : `${left} + ? = ${total}`,
      visual: { kind: 'bond', total, left: missLeft ? '?' : left, right: missLeft ? miss : '?' },
      interaction: numChoice(rng, missLeft ? left : miss, { min: 0, max: 10, misconceptions: [total, missLeft ? left + 1 : miss + 1, missLeft ? miss : left], spread: 2 }),
      hints: [`The two parts together make ${total}.`, `Count up from ${missLeft ? miss : left} to ${total}. How many counts?`],
      explanation: `${left} and ${miss} make ${total}, so the missing part is ${missLeft ? left : miss}.`,
      steps: [`${left} + ${miss} = ${total}`],
      math: eqn(missLeft ? { left: E.add(E.X, miss), rel: '=', right: total } : { left: E.add(left, E.X), rel: '=', right: total }, 0, 20),
      signature: `bond:${total},${left},${missLeft}`, answerText: String(missLeft ? left : miss), readingDemand: 'pre-reader',
    };
  },
};

export const composeWays: GenDef = {
  id: 'compose.ways', version: 2, mode: 'another-way',
  gen(rng, diff) {
    const total = rng.int(4, byDiff(diff, 6, 8, 10));
    const t = rng.pick(THINGS);
    const goods: [number, number][] = [];
    for (let a = 1; a < total; a++) goods.push([a, total - a]);
    const pickGood = rng.sample(goods, Math.min(2, goods.length));
    const bads: [number, number][] = [];
    while (bads.length < 4) {
      const a = rng.int(1, total), b = rng.int(1, total);
      if (a + b !== total && !bads.some(([x, y]) => x === a && y === b)) bads.push([a, b]);
    }
    const opt = ([a, b]: [number, number]) => ({ label: `${a} and ${b}`, value: `${a}+${b}`, claim: { left: E.add(a, b), rel: '=' as const, right: total } });
    return {
      badge: '🔗 Many ways', prompt: `Tap a way to split ${total} ${t.many} into two groups.`,
      visual: { kind: 'counters', emoji: t.e, count: total, label: t.many },
      interaction: buildChoice(rng, pickGood.map(opt), bads.map(opt), 4, 'grid'),
      hints: [`The two groups must have ${total} in all.`, `Try each pair: do the two numbers make ${total}?`],
      explanation: `There is more than one way! ${goods.map(([a, b]) => `${a} and ${b}`).join(', ')} all make ${total}.`,
      steps: goods.map(([a, b]) => `${a} + ${b} = ${total}`),
      math: { kind: 'decompose', total }, signature: `ways:${total}`, answerText: String(total), readingDemand: 'early',
      reasoningObjective: 'Recognize that a number can be split into parts in more than one way.',
    };
  },
};

/* ===================================================== Level 2: within 20 */
export const add20: GenDef = {
  id: 'add20.facts', version: 2, mode: 'solve',
  gen(rng, diff) {
    let a: number, b: number;
    if (diff === 1) { a = rng.int(2, 8); b = rng.int(1, 10 - a); }
    else if (diff === 2) { a = rng.int(6, 9); b = rng.int(11 - a, 9); }        // crosses ten
    else { a = rng.int(10, 17); b = rng.int(2, 20 - a); }
    const s = a + b;
    const visual = diff === 1
      ? { kind: 'numberline' as const, min: 0, max: 10, labelEvery: 1, hops: [{ from: a, to: s }], aria: `Hops from ${a} to ${s}` }
      : diff === 2 ? { kind: 'tenframe' as const, a, b } : undefined;
    return {
      badge: '➕ Adding to 20', prompt: `${a} + ${b} = ?`, ...(visual ? { visual } : {}),
      interaction: answerUI(rng, s, diff >= 2, [s - 1, s + 1, s + 10, Math.abs(a - b)], 2, 40),
      hints: [diff === 2 ? `Make a ten! How much does ${a} need to make 10?` : `Start at the greater number and count on.`, diff === 2 ? `${a} + ${10 - a} = 10, then add the ${b - (10 - a)} that are left.` : `${Math.max(a, b)} + ${Math.min(a, b)}: count on ${Math.min(a, b)}.`],
      explanation: diff === 2 ? `${a} + ${10 - a} = 10, and 10 + ${b - (10 - a)} = ${s}. So ${a} + ${b} = ${s}.` : `${a} + ${b} = ${s}.`,
      steps: diff === 2 ? [`Split ${b} into ${10 - a} and ${b - (10 - a)}.`, `${a} + ${10 - a} = 10`, `10 + ${b - (10 - a)} = ${s}`] : [`${a} + ${b} = ${s}`],
      math: eqn({ left: E.add(a, b), rel: '=', right: E.X }), signature: `add:${Math.min(a, b)}+${Math.max(a, b)}`, answerText: String(s),
    };
  },
};

export const add20MakeTen: GenDef = {
  id: 'add20.make-ten', version: 1, mode: 'another-way',
  gen(rng) {
    const a = rng.int(7, 9), b = rng.int(11 - a, 9), need = 10 - a, rest = b - need, s = a + b;
    const name = rng.pick(['Ava', 'Kai', 'Mia', 'Omar', 'Lina', 'Jin']);
    const good = claimsOpt(`${a} + ${need} = 10, then 10 + ${rest} = ${s}`, [{ left: E.add(a, need), rel: '=', right: 10 }, { left: E.add(need, rest), rel: '=', right: b }, { left: E.add(10, rest), rel: '=', right: s }]);
    const wrongs = [
      claimsOpt(`${a} + ${need} = 10, then 10 + ${b} = ${10 + b}`, [{ left: E.add(a, need), rel: '=', right: 10 }, { left: E.add(need, b), rel: '=', right: b }]),
      claimsOpt(`${a} + ${b} = 10, then 10 + ${rest} = ${10 + rest}`, [{ left: E.add(a, b), rel: '=', right: 10 }]),
      claimsOpt(`${a} + ${need + 1} = 10, then 10 + ${rest - 1} = ${9 + rest}`, [{ left: E.add(a, need + 1), rel: '=', right: 10 }]),
    ];
    return {
      badge: '🔀 Solve it another way', prompt: `${name} solves ${a} + ${b} by making a ten. Which shows ${name}'s way?`,
      visual: { kind: 'tenframe', a, b },
      interaction: buildChoice(rng, [good], wrongs, 4, 'list'),
      hints: [`How many more does ${a} need to make 10?`, `Take ${need} from the ${b}. What is left of the ${b}?`],
      explanation: `${b} is ${need} and ${rest}. ${a} + ${need} = 10, and 10 + ${rest} = ${s}. Counting on gives ${s} too — the strategies agree.`,
      steps: [`${b} = ${need} + ${rest}`, `${a} + ${need} = 10`, `10 + ${rest} = ${s}`],
      math: { kind: 'claims' }, signature: `maketen:${a}+${b}`, answerText: String(s),
      reasoningObjective: 'Use and recognize the make-ten strategy, and see why it gives the same sum as counting on.',
    };
  },
};

export const add20Mistake: GenDef = {
  id: 'add20.mistake', version: 1, mode: 'mistake',
  gen(rng) {
    const a = rng.int(4, 9), b = rng.int(2, 5), s = a + b;
    const name = rng.pick(['Max', 'Zoe', 'Sam', 'Nia', 'Theo', 'Hana']);
    const said = [a, ...Array.from({ length: b - 1 }, (_, i) => a + i + 1)];
    const opts = [
      { label: `${name} said ${a} again. Start at ${a}, then count on ${b}: ${countList(a, b)}.`, value: 'restart', claim: { left: E.add(a, b), rel: '=' as const, right: s } },
      { label: `${name} is correct. ${a} + ${b} = ${s - 1}.`, value: 'ok', claim: { left: E.add(a, b), rel: '=' as const, right: s - 1 } },
      { label: `${name} should count back instead.`, value: 'back', truth: false },
      { label: `${name} needed to count on ${b + 1} more.`, value: 'more', claim: { left: E.add(a, b + 1), rel: '=' as const, right: E.add(a, b) } },
    ];
    return {
      badge: '🔎 Find the mistake', prompt: `To find ${a} + ${b}, ${name} counts: ${said.join(', ')}. ${name} says the answer is ${s - 1}. What went wrong?`,
      visual: { kind: 'worked', title: `${name}'s counting`, lines: [`${a} + ${b}`, `${said.join(', ')}`, `Answer: ${s - 1}  ✗`] },
      interaction: buildChoice(rng, [opts[0]!], opts.slice(1), 4, 'list'),
      hints: ['When we count on, we start with the next number.', `After ${a} comes ${a + 1}. Count ${b} numbers after ${a}.`],
      explanation: `Counting on from ${a} means saying ${b} more numbers: ${countList(a, b)}. So ${a} + ${b} = ${s}, not ${s - 1}.`,
      steps: [`Start: ${a}`, `Count on: ${countList(a, b)}`, `${a} + ${b} = ${s}`],
      math: { kind: 'claims' }, signature: `cnton:${a}+${b}`, answerText: String(s),
      reasoningObjective: 'Find a counting-on error (counting the starting number).',
    };
  },
};

export const add20Doubles: GenDef = {
  id: 'add20.doubles', version: 1, mode: 'another-way',
  gen(rng) {
    const a = rng.int(4, 9), s = a + a + 1;
    const truth = rng.bool(0.6);
    const shown = truth ? `${a} + ${a + 1} = ${a} + ${a} + 1` : `${a} + ${a + 1} = ${a} + ${a} + 2`;
    const claim: Claim = truth ? { left: E.add(a, a + 1), rel: '=', right: E.add(E.add(a, a), 1) } : { left: E.add(a, a + 1), rel: '=', right: E.add(E.add(a, a), 2) };
    const just = truth
      ? [
          { id: 'j1', label: `${a + 1} is ${a} + 1, so ${a} + ${a + 1} is a double plus 1: ${a + a} + 1 = ${s}.`, value: 'ok', claim: { left: E.add(E.add(a, a), 1), rel: '=' as const, right: s } },
          { id: 'j2', label: `${a} + ${a} + 1 is ${s + 1}.`, value: 'bad', claim: { left: E.add(E.add(a, a), 1), rel: '=' as const, right: s + 1 } },
          { id: 'j3', label: `${a + 1} is ${a} + 2.`, value: 'bad2', claim: { left: a + 1, rel: '=' as const, right: E.add(a, 2) } },
        ]
      : [
          { id: 'j1', label: `${a + 1} is only 1 more than ${a}, so it should be ${a} + ${a} + 1 = ${s}, not ${s + 1}.`, value: 'ok', claim: { left: E.add(a, a + 1), rel: '=' as const, right: s } },
          { id: 'j2', label: `Both sides equal ${s + 1}.`, value: 'bad', claim: { left: E.add(a, a + 1), rel: '=' as const, right: s + 1 } },
          { id: 'j3', label: `${a + 1} is ${a} + 2.`, value: 'bad2', claim: { left: a + 1, rel: '=' as const, right: E.add(a, 2) } },
        ];
    return {
      badge: '🔀 Doubles plus one', prompt: 'True or false? Then pick the reason.',
      interaction: { type: 'tf', statement: shown, truth, claim, justifications: just, correctJust: ['j1'] },
      hints: [`What is ${a} + ${a}?`, `${a + 1} is one more than ${a}.`],
      explanation: `${a} + ${a + 1} = ${s}, and ${a} + ${a} + 1 = ${s}. ${truth ? 'True.' : `So the statement with + 2 (${s + 1}) is false.`}`,
      steps: [`${a} + ${a} = ${a + a}`, `${a + a} + 1 = ${s}`],
      math: { kind: 'claims' }, signature: `dbl:${a},${truth}`, answerText: truth ? 'True' : 'False',
      reasoningObjective: 'Relate a near-double to a double.',
    };
  },
};

export const sub20: GenDef = {
  id: 'sub20.facts', version: 2, mode: 'solve',
  gen(rng, diff) {
    let a: number, b: number;
    if (diff === 1) { a = rng.int(4, 10); b = rng.int(1, a - 1); }
    else if (diff === 2) { a = rng.int(11, 18); b = rng.int(a - 9, 9); }      // crosses ten
    else { a = rng.int(12, 20); b = rng.int(2, a - 1); }
    const d = a - b;
    const swapErr = a >= 10 && b < 10 && a % 10 < b ? 10 + (b - (a % 10)) : d + 2;
    return {
      badge: '➖ Subtracting to 20', prompt: `${a} − ${b} = ?`,
      ...(diff === 1 ? { visual: { kind: 'numberline' as const, min: 0, max: 10, labelEvery: 1, hops: [{ from: a, to: d }], aria: `Hops back from ${a} to ${d}` } } : {}),
      interaction: answerUI(rng, d, diff >= 2, [a + b, d + 1, d - 1, swapErr], 2, 40),
      hints: [diff === 2 ? `Go back to 10 first: ${a} − ${a - 10} = 10.` : `Start at ${a} and count back ${b}.`, diff === 2 ? `Then take away the rest: 10 − ${b - (a - 10)}.` : `Or think addition: ${b} + ? = ${a}.`],
      explanation: diff === 2 ? `${a} − ${a - 10} = 10, then 10 − ${b - (a - 10)} = ${d}. So ${a} − ${b} = ${d}.` : `${a} − ${b} = ${d}, because ${b} + ${d} = ${a}.`,
      steps: [`${a} − ${b} = ${d}`, `Check: ${b} + ${d} = ${a}`],
      math: eqn({ left: E.sub(a, b), rel: '=', right: E.X }), signature: `sub:${a}-${b}`, answerText: String(d),
    };
  },
};

export const sub20ThinkAdd: GenDef = {
  id: 'sub20.think-addition', version: 1, mode: 'another-way',
  gen(rng) {
    const a = rng.int(11, 18), b = rng.int(a - 9, 9), d = a - b;
    const good = claimsOpt(`${b} + ${d} = ${a}`, [{ left: E.add(b, d), rel: '=', right: a }]);
    const wrongs = [
      claimsOpt(`${b} + ${a} = ${a + b}`, [{ left: E.add(b, a), rel: '=', right: E.sub(a, b) }]),
      claimsOpt(`${b} + ${d + 1} = ${a}`, [{ left: E.add(b, d + 1), rel: '=', right: a }]),
      claimsOpt(`${d} + ${a} = ${a + d}`, [{ left: E.add(d, a), rel: '=', right: E.sub(a, b) }]),
    ];
    return {
      badge: '🔀 Think addition', prompt: `Which addition fact helps you solve ${a} − ${b}?`,
      interaction: buildChoice(rng, [good], wrongs, 4, 'grid'),
      hints: [`Subtraction asks: ${b} plus what makes ${a}?`, `Count up from ${b} to ${a}.`],
      explanation: `${b} + ${d} = ${a}, so ${a} − ${b} = ${d}. Addition and subtraction are connected.`,
      steps: [`${b} + ? = ${a}`, `? = ${d}`],
      math: { kind: 'claims' }, signature: `thinkadd:${a}-${b}`, answerText: `${b} + ${d} = ${a}`,
      reasoningObjective: 'Use the inverse relationship between addition and subtraction.',
    };
  },
};

/* ===================================================== missing numbers & equality */
export const missingNumber: GenDef = {
  id: 'missing.number', version: 2, mode: 'solve',
  gen(rng, diff) {
    const hi = byDiff(diff, 10, 20, 50);
    const a = rng.int(1, hi - 2), b = rng.int(1, hi - a), c = a + b;
    const form = rng.int(0, diff === 1 ? 1 : 4);
    let text: string, claim: Claim, ans: number;
    switch (form) {
      case 0: text = `${a} + ? = ${c}`; claim = { left: E.add(a, E.X), rel: '=', right: c }; ans = b; break;
      case 1: text = `? + ${b} = ${c}`; claim = { left: E.add(E.X, b), rel: '=', right: c }; ans = a; break;
      case 2: text = `${c} − ? = ${a}`; claim = { left: E.sub(c, E.X), rel: '=', right: a }; ans = b; break;
      case 3: text = `? − ${b} = ${a}`; claim = { left: E.sub(E.X, b), rel: '=', right: a }; ans = c; break;
      default: text = `${c} = ${a} + ?`; claim = { left: c, rel: '=', right: E.add(a, E.X) }; ans = b;
    }
    return {
      badge: '❓ Missing number', prompt: `What number makes this true?  ${text}`,
      interaction: answerUI(rng, ans, diff >= 2, [c, a + c, ans + 1, ans - 1], 2, 200),
      hints: [form === 4 ? 'The equal sign means both sides have the same value.' : 'Think about what you know and what is hidden.', form === 3 ? `What number take away ${b} leaves ${a}? Try ${a} + ${b}.` : `Count up from the smaller number, or think ${c} − ${form === 1 ? b : a}.`],
      explanation: `${text.replace('?', String(ans))} is true. ${form <= 1 || form === 4 ? `${c} − ${form === 1 ? b : a} = ${ans}.` : form === 2 ? `${c} − ${a} = ${ans}.` : `${a} + ${b} = ${ans}.`}`,
      steps: [`Unknown: ?`, `? = ${ans}`, `Check: ${text.replace('?', String(ans))}`],
      math: eqn(claim, 0, 200), signature: `miss:${text}`, answerText: String(ans),
    };
  },
};

const tfEq = (left: Expr, right: Expr): Claim => ({ left, rel: '=', right });
export const equalityTF: GenDef = {
  id: 'equality.tf', version: 2, mode: 'explain',
  gen(rng, diff) {
    const hi = byDiff(diff, 10, 20, 30);
    const a = rng.int(2, hi - 3), b = rng.int(1, hi - a), s = a + b;
    const kind = rng.int(0, 3);
    let left: Expr, right: Expr;
    if (kind === 0) { const c = rng.int(1, s - 1); left = E.add(a, b); right = E.add(c, s - c); }         // true, two sums
    else if (kind === 1) { left = s; right = E.add(a, b); }                                            // true, answer on the left
    else if (kind === 2) { const c = rng.int(1, s - 1); left = E.add(a, b); right = E.add(c, s - c + rng.pick([1, 2])); } // false
    else { left = E.add(a, b); right = E.add(s, rng.int(1, 3)); }                                       // false: "answer then keep going"
    const lv = Number(show(left).split(' + ').reduce((acc, x) => acc + Number(x), 0));
    const rv = Number(show(right).split(' + ').reduce((acc, x) => acc + Number(x), 0));
    const truth = lv === rv;
    const just = truth
      ? [
          { id: 'j1', label: `${show(left)} is ${lv} and ${show(right)} is ${rv}. Both sides are the same amount.`, value: 'ok', claim: { left, rel: '=' as const, right } },
          { id: 'j2', label: 'The answer always comes right after the equal sign.', value: 'operational', truth: false },
          { id: 'j3', label: `${show(left)} is ${lv + 1}.`, value: 'calc', claim: { left, rel: '=' as const, right: lv + 1 } },
        ]
      : [
          { id: 'j1', label: `${show(left)} is ${lv}, but ${show(right)} is ${rv}. The sides are not equal.`, value: 'ok', claim: { left, rel: '≠' as const, right } },
          { id: 'j2', label: 'It is true because both sides use plus signs.', value: 'sym', truth: false },
          { id: 'j3', label: `Both sides are ${lv}.`, value: 'calc', claim: { left: right, rel: '=' as const, right: lv } },
        ];
    return {
      badge: '⚖️ Balance & equal', prompt: 'Is this equation true or false? Then pick the reason.',
      visual: { kind: 'balance', left: show(left), right: show(right), tilt: 'unknown' },
      interaction: { type: 'tf', statement: `${show(left)} = ${show(right)}`, truth, claim: tfEq(left, right), justifications: just, correctJust: ['j1'] },
      hints: ['The equal sign means "is the same amount as."', `Find the value of each side: ${show(left)} and ${show(right)}.`],
      explanation: truth ? `True. Both sides equal ${lv}.` : `False. The left side is ${lv} and the right side is ${rv}.`,
      steps: [`Left: ${show(left)} = ${lv}`, `Right: ${show(right)} = ${rv}`],
      math: { kind: 'claims' }, signature: `eqtf:${show(left)}=${show(right)}`, answerText: truth ? 'True' : 'False',
      reasoningObjective: 'Understand the equal sign as a relationship of equal value.',
    };
  },
};

export const equalityBalance: GenDef = {
  id: 'equality.balance', version: 1, mode: 'solve',
  gen(rng, diff) {
    const hi = byDiff(diff, 10, 15, 20);
    const a = rng.int(3, hi - 3), b = rng.int(2, hi - a), s = a + b;
    let c = rng.int(1, s - 1);
    while (c === a || c === b) c = rng.int(1, s - 1);
    const ans = s - c;
    return {
      badge: '⚖️ Balance', prompt: `What number makes both sides equal?  ${a} + ${b} = ? + ${c}`,
      visual: { kind: 'balance', left: `${a} + ${b}`, right: `? + ${c}`, tilt: 'level' },
      interaction: answerUI(rng, ans, diff >= 2, [s, s + c, ans + 1], 2, 60),
      hints: [`First find the value of the left side: ${a} + ${b}.`, `${a} + ${b} = ${s}. What plus ${c} makes ${s}?`],
      explanation: `${a} + ${b} = ${s}, and ${ans} + ${c} = ${s}. Both sides equal ${s}. (The answer is not ${s} — that only finds the left side!)`,
      steps: [`Left side: ${s}`, `? + ${c} = ${s}`, `? = ${ans}`],
      math: eqn({ left: E.add(a, b), rel: '=', right: E.add(E.X, c) }, 0, 60), signature: `bal:${a}+${b}=?+${c}`, answerText: String(ans),
    };
  },
};

/* ===================================================== Level 3: two-digit with regrouping */
export const add2: GenDef = {
  id: 'add2.regroup', version: 2, mode: 'solve',
  gen(rng, diff) {
    let a: number, b: number;
    if (diff === 1) { a = rng.int(1, 4) * 10 + rng.int(0, 4); b = rng.int(1, 4) * 10 + rng.int(0, 9 - (a % 10)); }
    else { const ao = rng.int(5, 9), bo = rng.int(10 - ao, 9); a = rng.int(1, diff === 2 ? 5 : 8) * 10 + ao; b = rng.int(1, diff === 2 ? 3 : 8) * 10 + bo; }
    const s = a + b, oa = a % 10, ob = b % 10, re = oa + ob >= 10;
    const noCarry = Math.floor(a / 10) * 10 + Math.floor(b / 10) * 10 + ((oa + ob) % 10);
    return {
      badge: '➕ Two-digit adding', prompt: `${a} + ${b} = ?`,
      interaction: answerUI(rng, s, diff >= 2, [noCarry, s + 10, s - 1, s + 1], 10, 300),
      hints: [`Add the ones first: ${oa} + ${ob} = ${oa + ob}.${re ? ' That is 10 or more — make a new ten!' : ''}`, `Tens: ${Math.floor(a / 10)} + ${Math.floor(b / 10)}${re ? ' + 1 new ten' : ''} = ${pl(Math.floor(s / 10), 'ten', 'tens')}.`],
      explanation: `${a} + ${b} = ${s}.${re ? ` The ones made ${oa + ob}, which is 1 ten and ${pl((oa + ob) % 10, 'one', 'ones')}.` : ''}`,
      steps: [`Ones: ${oa} + ${ob} = ${oa + ob}`, ...(re ? [`Regroup: ${oa + ob} = 1 ten + ${pl((oa + ob) % 10, 'one', 'ones')}`] : []), `Tens: ${Math.floor(a / 10)} + ${Math.floor(b / 10)}${re ? ' + 1' : ''} = ${Math.floor(s / 10)}`, `${a} + ${b} = ${s}`],
      math: eqn({ left: E.add(a, b), rel: '=', right: E.X }), signature: `add:${Math.min(a, b)}+${Math.max(a, b)}`, answerText: String(s),
    };
  },
};

export const add2Mistake: GenDef = {
  id: 'add2.mistake', version: 1, mode: 'mistake',
  gen(rng) {
    const ao = rng.int(5, 9), bo = rng.int(10 - ao, 9);
    const a = rng.int(1, 5) * 10 + ao, b = rng.int(1, 3) * 10 + bo, s = a + b;
    const wrong = Math.floor(a / 10) * 10 + Math.floor(b / 10) * 10 + ((ao + bo) % 10);
    const name = rng.pick(['Lina', 'Omar', 'Ella', 'Mateo', 'Amara', 'Ben']);
    const opts = [
      { label: `The ones make ${ao + bo}. ${name} forgot to add the new ten. The answer is ${s}.`, value: 'carry', claim: { left: E.add(a, b), rel: '=' as const, right: s } },
      { label: `${name} is right: ${a} + ${b} = ${wrong}.`, value: 'ok', claim: { left: E.add(a, b), rel: '=' as const, right: wrong } },
      { label: `${name} added the tens wrong. ${Math.floor(a / 10)} + ${Math.floor(b / 10)} = ${Math.floor(a / 10) + Math.floor(b / 10) + 2}.`, value: 'tens', claim: { left: E.add(Math.floor(a / 10), Math.floor(b / 10)), rel: '=' as const, right: Math.floor(a / 10) + Math.floor(b / 10) + 2 } },
      { label: `${name} should subtract the ones instead.`, value: 'sub', truth: false },
    ];
    return {
      badge: '🔎 Find the mistake', prompt: `${name} added ${a} + ${b} and got ${wrong}. What went wrong?`,
      visual: { kind: 'worked', title: `${name}'s work`, lines: [`  ${a}`, `+ ${b}`, `  ${wrong}  ✗`] },
      interaction: buildChoice(rng, [opts[0]!], opts.slice(1), 4, 'list'),
      hints: [`Add the ones: ${ao} + ${bo}. Is that more than 9?`, `${pl(ao + bo, 'one', 'ones')} = 1 ten and ${pl((ao + bo) % 10, 'one', 'ones')}. Where does that ten go?`],
      explanation: `${ao} + ${bo} = ${ao + bo}, which is 1 ten and ${pl((ao + bo) % 10, 'one', 'ones')}. Adding that ten to the tens gives ${s}.`,
      steps: [`Ones: ${ao + bo} → write ${(ao + bo) % 10}, regroup 1 ten`, `Tens: ${Math.floor(a / 10)} + ${Math.floor(b / 10)} + 1 = ${Math.floor(s / 10)}`, `Answer: ${s}`],
      math: { kind: 'claims' }, signature: `add2m:${a}+${b}`, answerText: String(s),
      reasoningObjective: 'Identify a missed regrouping in addition.',
    };
  },
};

export const add2AnotherWay: GenDef = {
  id: 'add2.another-way', version: 1, mode: 'another-way',
  gen(rng) {
    const ao = rng.int(6, 9), bo = rng.int(10 - ao + 1, 9);
    const a = rng.int(2, 5) * 10 + ao, b = rng.int(1, 3) * 10 + bo, s = a + b;
    const up = 10 - ao;
    const kai = [`${a - ao} + ${b - bo} = ${a - ao + b - bo}`, `${ao} + ${bo} = ${ao + bo}`, `${a - ao + b - bo} + ${ao + bo} = ${s}`];
    const lina = [`${a} + ${up} = ${a + up}`, `${b} − ${up} = ${b - up}`, `${a + up} + ${b - up} = ${s}`];
    const allTrue: Claim[] = [
      { left: E.add(a - ao, b - bo), rel: '=', right: a - ao + b - bo }, { left: E.add(ao, bo), rel: '=', right: ao + bo },
      { left: E.add(a - ao + b - bo, ao + bo), rel: '=', right: s }, { left: E.add(a, up), rel: '=', right: a + up },
      { left: E.add(a + up, b - up), rel: '=', right: s },
    ];
    const opts = [
      { label: `Both are correct. They split the numbers in different ways, and both get ${s}.`, value: 'both', claim: { left: E.add(a, b), rel: '=' as const, right: s }, claims: allTrue },
      { label: 'Only Kai is correct.', value: 'kai', truth: false },
      { label: 'Only Lina is correct.', value: 'lina', truth: false },
      { label: `Neither is correct. The answer is ${s - 10}.`, value: 'neither', claim: { left: E.add(a, b), rel: '=' as const, right: s - 10 } },
    ];
    return {
      badge: '🔀 Compare strategies', prompt: `Kai and Lina both solve ${a} + ${b}. Which is true?`,
      visual: { kind: 'worked', title: 'Two ways', lines: ['Kai: tens and ones', ...kai, 'Lina: make a ten', ...lina] },
      interaction: buildChoice(rng, [opts[0] as OptSeed], opts.slice(1) as OptSeed[], 4, 'list'),
      hints: ['Check each line of Kai\'s work. Then check Lina\'s.', `Lina moved ${up} from ${b} to ${a}. Does that change the total?`],
      explanation: `Kai adds tens and ones separately. Lina moves ${up} to make ${a + up}. Moving an amount from one addend to the other keeps the sum the same, so both get ${s}.`,
      steps: [...kai, ...lina],
      math: { kind: 'claims' }, signature: `add2w:${a}+${b}`, answerText: String(s),
      reasoningObjective: 'Compare two valid strategies and explain why they agree.',
    };
  },
};

export const sub2: GenDef = {
  id: 'sub2.regroup', version: 2, mode: 'solve',
  gen(rng, diff) {
    let a: number, b: number;
    if (diff === 1) { const at = rng.int(3, 9), ao = rng.int(3, 9); a = at * 10 + ao; b = rng.int(1, at - 1) * 10 + rng.int(0, ao); }
    else { const at = rng.int(3, 9), ao = rng.int(0, 4); a = at * 10 + ao; b = rng.int(1, at - 1) * 10 + rng.int(ao + 1, 9); }
    const d = a - b;
    const oa = a % 10, ob = b % 10, br = oa < ob;
    const smallFromLarge = (Math.floor(a / 10) - Math.floor(b / 10)) * 10 + Math.abs(oa - ob);
    return {
      badge: '➖ Two-digit subtracting', prompt: `${a} − ${b} = ?`,
      interaction: answerUI(rng, d, diff >= 2, [smallFromLarge, d + 10, a + b, d - 10], 10, 200),
      hints: [br ? `Look at the ones: ${oa} − ${ob}. There are not enough ones — regroup 1 ten as 10 ones.` : `Subtract the ones: ${oa} − ${ob} = ${oa - ob}.`, br ? `Now ${oa + 10} − ${ob} = ${pl(oa + 10 - ob, 'one', 'ones')}, and ${Math.floor(a / 10) - 1} − ${pl(Math.floor(b / 10), 'ten', 'tens')}.` : `Then the tens: ${Math.floor(a / 10)} − ${Math.floor(b / 10)} = ${Math.floor(a / 10) - Math.floor(b / 10)}.`],
      explanation: `${a} − ${b} = ${d}.${br ? ' One ten was regrouped as 10 ones.' : ''} Check: ${b} + ${d} = ${a}.`,
      steps: br ? [`Regroup: ${a} = ${pl(Math.floor(a / 10) - 1, 'ten', 'tens')} and ${pl(oa + 10, 'one', 'ones')}`, `Ones: ${oa + 10} − ${ob} = ${oa + 10 - ob}`, `Tens: ${Math.floor(a / 10) - 1} − ${Math.floor(b / 10)} = ${Math.floor(a / 10) - 1 - Math.floor(b / 10)}`, `Answer: ${d}`] : [`Ones: ${oa} − ${ob} = ${oa - ob}`, `Tens: ${Math.floor(a / 10)} − ${Math.floor(b / 10)}`, `Answer: ${d}`],
      math: eqn({ left: E.sub(a, b), rel: '=', right: E.X }), signature: `sub:${a}-${b}`, answerText: String(d),
    };
  },
};

export const sub2Mistake: GenDef = {
  id: 'sub2.mistake', version: 1, mode: 'mistake',
  gen(rng) {
    const at = rng.int(4, 9), ao = rng.int(0, 5), bt = rng.int(1, at - 1), bo = rng.int(ao + 1, 9);
    const a = at * 10 + ao, b = bt * 10 + bo, d = a - b;
    const wrong = (at - bt) * 10 + (bo - ao);
    const name = rng.pick(['Zoe', 'Jin', 'Diego', 'Priya', 'Sam', 'Nia']);
    const opts = [
      { label: `In the ones, ${name} did ${bo} − ${ao} instead of regrouping. ${ao + 10} − ${bo} = ${ao + 10 - bo}, so the answer is ${d}.`, value: 'flip', claim: { left: E.sub(a, b), rel: '=' as const, right: d } },
      { label: `${name} is right: ${a} − ${b} = ${wrong}.`, value: 'ok', claim: { left: E.sub(a, b), rel: '=' as const, right: wrong } },
      { label: `${name} should add instead: ${a + b}.`, value: 'add', claim: { left: E.sub(a, b), rel: '=' as const, right: a + b } },
      { label: `${name} subtracted the tens wrong.`, value: 'tens', truth: false },
    ];
    return {
      badge: '🔎 Find the mistake', prompt: `${name} says ${a} − ${b} = ${wrong}. What went wrong?`,
      visual: { kind: 'worked', title: `${name}'s work`, lines: [`  ${a}`, `− ${b}`, `  ${wrong}  ✗`] },
      interaction: buildChoice(rng, [opts[0] as OptSeed], opts.slice(1) as OptSeed[], 4, 'list'),
      hints: [`Look at the ones: ${ao} − ${bo}. Can you take ${bo} from ${ao}?`, `Regroup a ten: ${ao + 10} − ${bo}. Check the answer: ${b} + ${wrong} = ${b + wrong}, not ${a}.`],
      explanation: `${name} subtracted the smaller digit from the larger one. Regroup 1 ten: ${ao + 10} − ${bo} = ${pl(ao + 10 - bo, 'one', 'ones')} and ${at - 1} − ${bt} = ${pl(at - 1 - bt, 'ten', 'tens')}. ${a} − ${b} = ${d}.`,
      steps: [`Check ${name}'s answer: ${b} + ${wrong} = ${b + wrong} ≠ ${a}`, `Correct: ${a} − ${b} = ${d}`],
      math: { kind: 'claims' }, signature: `sub2m:${a}-${b}`, answerText: String(d),
      reasoningObjective: 'Identify the "smaller from larger" subtraction error and check with addition.',
    };
  },
};

/* ===================================================== equal groups, arrays, division (Level 3) */
export const groupsRepeated: GenDef = {
  id: 'groups.repeated', version: 1, mode: 'solve',
  gen(rng, diff) {
    const g = rng.int(2, byDiff(diff, 3, 4, 5)), p = rng.int(2, byDiff(diff, 4, 5, 6));
    const t = rng.pick(THINGS.filter(x => x.e !== '🐶'));
    const sentence = (addend: number, times: number) => Array(times).fill(addend).join(' + ');
    const correct = { label: sentence(p, g), value: `${p}*${g}` };
    const wrongs = [{ label: sentence(p, g + 1), value: `${p}*${g + 1}` }, { label: sentence(p + 1, g), value: `${p + 1}*${g}` }, { label: `${g} + ${p}`, value: `sum:${g}+${p}` }];
    const asking = diff === 1 || rng.bool(0.5);
    if (asking) {
      return {
        badge: '🧺 Equal groups', prompt: 'Which addition matches the groups?',
        visual: { kind: 'divgroups', groups: g, per: p, emoji: t.e },
        interaction: buildChoice(rng, [correct], wrongs, 4, 'list'),
        hints: ['How many groups are there? How many in each group?', `There are ${pl(g, 'group', 'groups')} with ${p} in each group.`],
        explanation: `${pl(g, 'group', 'groups')} of ${p} means adding ${p}, ${g} times: ${sentence(p, g)} = ${g * p}.`,
        steps: [`${pl(g, 'group', 'groups')}`, `${p} in each`, `${sentence(p, g)} = ${g * p}`],
        math: { kind: 'array-count', rows: g, cols: p }, signature: `grp-s:${g}x${p}`, answerText: sentence(p, g), readingDemand: 'early',
      };
    }
    return {
      badge: '🧺 Equal groups', prompt: `There are ${pl(g, 'group', 'groups')} with ${p} ${t.many} in each group. How many ${t.many} in all?`,
      visual: { kind: 'divgroups', groups: g, per: p, emoji: t.e },
      interaction: numChoice(rng, g * p, { min: 1, max: 100, misconceptions: [g + p, g * p + p, g * p - p], spread: 3 }),
      hints: [`Skip count by ${p}s.`, `${countList(0, g, p)}.`],
      explanation: `${sentence(p, g)} = ${g * p}. There are ${g * p} ${t.many}.`,
      steps: [`${sentence(p, g)} = ${g * p}`],
      math: { kind: 'equation', claim: { left: E.mul(g, p), rel: '=', right: E.X }, lo: 0, hi: 200 }, signature: `grp:${g}x${p}`, answerText: String(g * p), readingDemand: 'early',
    };
  },
};

export const arrayCount: GenDef = {
  id: 'mult.array-count', version: 1, mode: 'solve',
  gen(rng, diff) {
    const rows = rng.int(2, byDiff(diff, 3, 4, 5)), cols = rng.int(2, byDiff(diff, 4, 5, 6));
    const emoji = rng.pick(['⭐', '🌸', '🍬', '🐞', '🍩']);
    const total = rows * cols;
    const sentence = (addend: number, times: number) => Array(times).fill(addend).join(' + ');
    if (rng.bool(0.5)) {
      return {
        badge: '🧮 Arrays', prompt: `How many in all? (${pl(rows, 'row', 'rows')} of ${cols})`,
        visual: { kind: 'array', rows, cols, emoji },
        interaction: numChoice(rng, total, { min: 1, max: 100, misconceptions: [rows + cols, total + cols, total - cols], spread: 3 }),
        hints: [`Count one row: ${cols}. There are ${pl(rows, 'row', 'rows')}.`, `${sentence(cols, rows)} = ?`],
        explanation: `${pl(rows, 'row', 'rows')} of ${cols}: ${sentence(cols, rows)} = ${total}, so ${rows} × ${cols} = ${total}.`,
        steps: [`${rows} × ${cols} = ${total}`],
        math: { kind: 'equation', claim: { left: E.mul(rows, cols), rel: '=', right: E.X }, lo: 0, hi: 200 }, signature: `arr:${rows}x${cols}`, answerText: String(total),
      };
    }
    const correct = [{ label: sentence(cols, rows), value: `${cols}*${rows}` }];
    if (rows !== cols) correct.push({ label: sentence(rows, cols), value: `${rows}*${cols}` });
    const wrongs = [{ label: sentence(cols + 1, rows), value: `${cols + 1}*${rows}` }, { label: sentence(cols, rows + 1), value: `${cols}*${rows + 1}` }, { label: `${rows} + ${cols}`, value: `sum:${rows}+${cols}` }];
    return {
      badge: '🧮 Arrays', prompt: 'Which addition matches the array? (More than one may be right — tap one.)',
      visual: { kind: 'array', rows, cols, emoji },
      interaction: buildChoice(rng, correct.slice(0, 2), wrongs, 4, 'list'),
      hints: ['You can add the rows OR the columns.', `${pl(rows, 'row', 'rows')} of ${cols}, or ${cols} columns of ${rows}.`],
      explanation: `Adding rows: ${sentence(cols, rows)} = ${total}.${rows !== cols ? ` Adding columns: ${sentence(rows, cols)} = ${total}.` : ''} Both describe the same array.`,
      steps: [`${rows} × ${cols} = ${total}`],
      math: { kind: 'array-count', rows, cols }, signature: `arr-s:${rows}x${cols}`, answerText: sentence(cols, rows),
      reasoningObjective: 'See an array as rows or as columns.',
    };
  },
};

export const arrayBuild: GenDef = {
  id: 'mult.build-array', version: 1, mode: 'another-way',
  gen(rng, diff) {
    const product = rng.pick(byDiff(diff, [4, 6, 8, 9, 10], [6, 8, 10, 12, 15, 16], [12, 16, 18, 20, 24]));
    const fixed = diff === 1 ? rng.pick([2, 3].filter(r => product % r === 0 && product / r <= 6)) : undefined;
    const pairs: [number, number][] = [];
    for (let r = 1; r <= 6; r++) if (product % r === 0 && product / r <= 6) pairs.push([r, product / r]);
    return {
      badge: '🧮 Build an array', prompt: fixed ? `Build an array with ${pl(fixed, 'row', 'rows')} that shows ${product}.` : `Build an array that shows ${product}. There is more than one way!`,
      interaction: { type: 'array', maxRows: 6, maxCols: 6, product, ...(fixed ? { fixedRows: fixed } : {}) },
      hints: ['Rows × items in each row = total.', fixed ? `${pl(fixed, 'row', 'rows')}. How many in each row to make ${product}? Skip count by ${fixed}s.` : `Try ${pl(pairs[0]![0], 'row', 'rows')}. How many in each row?`],
      explanation: `Arrays for ${product}: ${pairs.map(([r, c]) => `${r} × ${c}`).join(', ')}. Turning an array on its side swaps rows and columns but keeps the total.`,
      steps: pairs.map(([r, c]) => `${pl(r, 'row', 'rows')} × ${c} = ${product}`),
      math: { kind: 'array-product', product, ...(fixed ? { fixedRows: fixed } : {}) }, signature: `arrb:${product},${fixed ?? ''}`, answerText: String(product),
      reasoningObjective: 'Find different arrays (factor pairs) with the same total.',
    };
  },
};

export const multCommutative: GenDef = {
  id: 'mult.commutative', version: 1, mode: 'explain',
  gen(rng) {
    const a = rng.int(2, 6);
    let b = rng.int(2, 6);
    while (b === a) b = rng.int(2, 6);
    const p = a * b;
    return {
      badge: '💬 Explain your thinking', prompt: 'True or false? Then pick the reason.',
      visual: { kind: 'array', rows: a, cols: b, emoji: '⭐' },
      interaction: {
        type: 'tf', statement: `${a} × ${b} = ${b} × ${a}`, truth: true, claim: { left: E.mul(a, b), rel: '=', right: E.mul(b, a) },
        justifications: [
          { id: 'j1', label: `Turn the array on its side: ${pl(a, 'row', 'rows')} of ${b} becomes ${pl(b, 'row', 'rows')} of ${a}. It is still ${p}.`, value: 'turn', claim: { left: E.mul(b, a), rel: '=', right: p } },
          { id: 'j2', label: `${a} × ${b} is bigger because ${a} comes first.`, value: 'order', claim: { left: E.mul(a, b), rel: '>', right: E.mul(b, a) } },
          { id: 'j3', label: 'They are different because the numbers are in a different order.', value: 'diff', truth: false },
        ],
        correctJust: ['j1'],
      },
      hints: ['Picture the array. Now turn it on its side.', `${a} × ${b} = ${p}. What is ${b} × ${a}?`],
      explanation: `True. ${a} × ${b} = ${p} and ${b} × ${a} = ${p}. Changing the order of the factors does not change the product.`,
      steps: [`${a} × ${b} = ${p}`, `${b} × ${a} = ${p}`],
      math: { kind: 'claims' }, signature: `comm:${Math.min(a, b)}x${Math.max(a, b)}`, answerText: 'True',
      reasoningObjective: 'Explain the commutative property using an array.',
    };
  },
};

export const divShare: GenDef = {
  id: 'div.share', version: 2, mode: 'solve',
  gen(rng, diff) {
    const g = rng.int(2, byDiff(diff, 3, 4, 5)), per = rng.int(2, byDiff(diff, 4, 5, 6)), total = g * per;
    const t = rng.pick(THINGS.filter(x => x.e !== '🐶' && x.e !== '🦋'));
    return {
      badge: '🍪 Fair sharing', prompt: `Share ${total} ${t.many} equally into ${g} bags. How many go in each bag?`,
      visual: { kind: 'divgroups', groups: g, per, emoji: t.e, mystery: true },
      interaction: numChoice(rng, per, { min: 1, max: 50, misconceptions: [g, total - g, per + 1, per - 1], spread: 2 }),
      hints: [`Deal them out one at a time: one for each bag, then again.`, `${g} bags × how many = ${total}? Skip count by ${g}s.`],
      explanation: `${total} shared into ${g} equal groups is ${per} in each, because ${g} × ${per} = ${total}. So ${total} ÷ ${g} = ${per}.`,
      steps: [`${total} ÷ ${g} = ?`, `${g} × ${per} = ${total}`, `${per} in each bag`],
      math: { kind: 'equation', claim: { left: E.div(total, g), rel: '=', right: E.X }, lo: 0, hi: 100 }, signature: `share:${total}/${g}`, answerText: String(per), readingDemand: 'early',
    };
  },
};

export const divGroupsOf: GenDef = {
  id: 'div.groups-of', version: 1, mode: 'solve',
  gen(rng, diff) {
    const per = rng.int(2, byDiff(diff, 3, 5, 6)), g = rng.int(2, byDiff(diff, 4, 5, 6)), total = g * per;
    const t = rng.pick(THINGS.filter(x => x.e !== '🐶'));
    return {
      badge: '🍪 Equal groups', prompt: `There are ${total} ${t.many}. Put ${per} in each basket. How many baskets do you need?`,
      ...(total <= 20 ? { visual: { kind: 'counters' as const, emoji: t.e, count: total, label: t.many } } : {}),
      interaction: numChoice(rng, g, { min: 1, max: 50, misconceptions: [per, total - per, g + 1], spread: 2 }),
      hints: [`Make groups of ${per}. Count the groups.`, `Skip count by ${per}s until you reach ${total}: ${countList(0, g, per)}.`],
      explanation: `${pl(g, 'group', 'groups')} of ${per} make ${total}, so ${total} ÷ ${per} = ${g}. You need ${g} baskets.`,
      steps: [`${total} ÷ ${per} = ${g}`],
      math: { kind: 'equation', claim: { left: E.div(total, per), rel: '=', right: E.X }, lo: 0, hi: 100 }, signature: `grpof:${total}/${per}`, answerText: String(g), readingDemand: 'early',
    };
  },
};

/* ===================================================== Level 4: facts, properties, multi-step */
export const multFacts: GenDef = {
  id: 'mult.facts', version: 2, mode: 'solve',
  gen(rng, diff) {
    const a = diff === 1 ? rng.pick([2, 5, 10]) : rng.int(diff === 2 ? 0 : 2, diff === 2 ? 6 : 10);
    const b = rng.int(diff === 1 ? 1 : 0, diff === 1 ? 10 : 10);
    const [x, y] = rng.bool() ? [a, b] : [b, a];
    const p = x * y;
    return {
      badge: '✖️ Multiplication', prompt: `${x} × ${y} = ?`,
      ...(diff === 1 && x > 0 && y > 0 && x <= 6 && y <= 6 ? { visual: { kind: 'array' as const, rows: x, cols: y, emoji: '⭐' } } : {}),
      interaction: answerUI(rng, p, diff >= 2, [x + y, x * (y + 1), x * Math.max(0, y - 1), p + 1].filter(v => v !== p), 4, 120),
      hints: [x === 0 || y === 0 ? 'Zero groups, or groups with zero in each, make zero.' : x === 1 || y === 1 ? 'One group of a number is just that number.' : `Think of ${pl(x, 'group', 'groups')} of ${y}.`, x > 0 && y > 0 ? `Skip count by ${y}, ${x} times: ${countList(0, Math.min(x, 10), y)}.` : `${x} × ${y} = 0.`],
      explanation: `${x} × ${y} = ${p}.${x === 0 || y === 0 ? ' Anything times zero is zero.' : ''}`,
      steps: [`${pl(x, 'group', 'groups')} of ${y}`, `${x} × ${y} = ${p}`],
      math: eqn({ left: E.mul(x, y), rel: '=', right: E.X }, 0, 200), signature: `mul:${Math.min(x, y)}x${Math.max(x, y)}`, answerText: String(p),
    };
  },
};

export const multDistributive: GenDef = {
  id: 'mult.break-apart', version: 1, mode: 'another-way',
  gen(rng) {
    const a = rng.int(3, 9), b = rng.int(6, 9), b1 = 5, b2 = b - 5, p = a * b;
    const good = { label: `${a} × ${b1} + ${a} × ${b2} = ${a * b1} + ${a * b2} = ${p}`, value: 'good', claim: { left: E.add(E.mul(a, b1), E.mul(a, b2)), rel: '=' as const, right: p }, claims: [{ left: E.add(E.mul(a, b1), E.mul(a, b2)), rel: '=' as const, right: E.mul(a, b) }, { left: E.add(a * b1, a * b2), rel: '=' as const, right: p }] };
    const wrongs = [
      { label: `${a} × ${b1} + ${b2} = ${a * b1 + b2}`, value: 'w1', claim: { left: E.add(E.mul(a, b1), b2), rel: '=' as const, right: E.mul(a, b) } },
      { label: `${a} + ${b1} × ${b2} = ${a + b1 * b2}`, value: 'w2', claim: { left: E.add(a, E.mul(b1, b2)), rel: '=' as const, right: E.mul(a, b) } },
      { label: `${a} × ${b1} + ${a} × ${b2} = ${a * b1} + ${a * b2} = ${p - 10}`, value: 'w3', claim: { left: E.add(a * b1, a * b2), rel: '=' as const, right: p - 10 } },
    ];
    return {
      badge: '🔀 Break apart', prompt: `Break ${b} into ${b1} + ${b2} to find ${a} × ${b}. Which is correct?`,
      visual: { kind: 'worked', title: `${a} × ${b}`, lines: [`${b} = ${b1} + ${b2}`, `${a} × ${b} = ${a} × ${b1} + ${a} × ?`] },
      interaction: buildChoice(rng, [good as OptSeed], wrongs, 4, 'list'),
      hints: [`${a} × ${b} means ${pl(a, 'group', 'groups')} of ${b}. Each group of ${b} is a group of ${b1} and a group of ${b2}.`, `${a} × ${b1} = ${a * b1}. ${a} × ${b2} = ${a * b2}.`],
      explanation: `${a} × ${b} = ${a} × ${b1} + ${a} × ${b2} = ${a * b1} + ${a * b2} = ${p}. Both parts must be multiplied by ${a}.`,
      steps: [`${a} × ${b1} = ${a * b1}`, `${a} × ${b2} = ${a * b2}`, `${a * b1} + ${a * b2} = ${p}`],
      math: { kind: 'claims' }, signature: `dist:${a}x${b}`, answerText: String(p),
      reasoningObjective: 'Use the distributive property to break apart a factor.',
    };
  },
};

export const multMistake: GenDef = {
  id: 'mult.mistake', version: 1, mode: 'mistake',
  gen(rng) {
    const a = rng.int(3, 9), b = rng.int(3, 8), p = a * b, wrong = a * (b + 1);
    const name = rng.pick(['Ivy', 'Kai', 'Amara', 'Leo', 'Hana', 'Omar']);
    const opts = [
      { label: `${name} found ${a} × ${b + 1}. ${a} × ${b} is one group of ${a} less: ${wrong} − ${a} = ${p}.`, value: 'ok', claim: { left: E.sub(wrong, a), rel: '=' as const, right: E.mul(a, b) } },
      { label: `${name} is right: ${a} × ${b} = ${wrong}.`, value: 'right', claim: { left: E.mul(a, b), rel: '=' as const, right: wrong } },
      { label: `${a} × ${b} = ${a + b}, because times means add.`, value: 'add', claim: { left: E.mul(a, b), rel: '=' as const, right: a + b } },
      { label: `${name} should subtract 1: ${wrong - 1}.`, value: 'minus1', claim: { left: E.mul(a, b), rel: '=' as const, right: wrong - 1 } },
    ];
    return {
      badge: '🔎 Find the mistake', prompt: `${name} says ${a} × ${b} = ${wrong}. What went wrong?`,
      interaction: buildChoice(rng, [opts[0]!], opts.slice(1), 4, 'list'),
      hints: [`Skip count by ${a}, ${b} times. Where do you stop?`, `${wrong} is ${pl(b + 1, 'group', 'groups')} of ${a}.`],
      explanation: `${wrong} = ${a} × ${b + 1}. Take away one group of ${a}: ${wrong} − ${a} = ${p}. So ${a} × ${b} = ${p}.`,
      steps: [`${a} × ${b + 1} = ${wrong}`, `${wrong} − ${a} = ${p}`],
      math: { kind: 'claims' }, signature: `mulm:${a}x${b}`, answerText: String(p),
      reasoningObjective: 'Find an off-by-one-group error and use a known fact to correct it.',
    };
  },
};

export const divFacts: GenDef = {
  id: 'div.facts', version: 2, mode: 'solve',
  gen(rng, diff) {
    const d = rng.int(byDiff(diff, 2, 2, 3), byDiff(diff, 5, 8, 10)), q_ = rng.int(byDiff(diff, 2, 1, 2), byDiff(diff, 5, 8, 10)), n = d * q_;
    return {
      badge: '➗ Division', prompt: `${n} ÷ ${d} = ?`,
      ...(diff === 1 ? { visual: { kind: 'divgroups' as const, groups: d, per: q_, emoji: '🍪', mystery: true } } : {}),
      interaction: answerUI(rng, q_, diff >= 2, [n - d, d, q_ + 1, q_ - 1].filter(v => v !== q_), 2, 100),
      hints: [`Think: ${d} × ? = ${n}.`, `Skip count by ${d}s until you reach ${n}. How many jumps?`],
      explanation: `${d} × ${q_} = ${n}, so ${n} ÷ ${d} = ${q_}.`,
      steps: [`${d} × ? = ${n}`, `? = ${q_}`],
      math: eqn({ left: E.div(n, d), rel: '=', right: E.X }, 0, 100), signature: `div:${n}/${d}`, answerText: String(q_),
    };
  },
};

export const divMissingFactor: GenDef = {
  id: 'div.unknown-factor', version: 1, mode: 'solve',
  gen(rng, diff) {
    const a = rng.int(2, byDiff(diff, 5, 9, 10)), b = rng.int(2, byDiff(diff, 5, 9, 10)), p = a * b;
    const unknownFirst = rng.bool();
    return {
      badge: '➗ Unknown factor', prompt: unknownFirst ? `? × ${b} = ${p}` : `${a} × ? = ${p}`,
      interaction: answerUI(rng, unknownFirst ? a : b, diff >= 2, [p - (unknownFirst ? b : a), unknownFirst ? b : a, (unknownFirst ? a : b) + 1], 2, 100),
      hints: [`Which number times ${unknownFirst ? b : a} makes ${p}?`, `${p} ÷ ${unknownFirst ? b : a} = ?`],
      explanation: `${a} × ${b} = ${p}, so the unknown factor is ${unknownFirst ? a : b}.`,
      steps: [`${p} ÷ ${unknownFirst ? b : a} = ${unknownFirst ? a : b}`],
      math: eqn(unknownFirst ? { left: E.mul(E.X, b), rel: '=', right: p } : { left: E.mul(a, E.X), rel: '=', right: p }, 0, 100),
      signature: `uf:${a}x${b},${unknownFirst}`, answerText: String(unknownFirst ? a : b),
    };
  },
};

export const divExplain: GenDef = {
  id: 'div.explain', version: 1, mode: 'explain',
  gen(rng) {
    const d = rng.int(3, 9), q_ = rng.int(3, 9), n = d * q_;
    const opts = [
      { label: `Because ${d} × ${q_} = ${n}.`, value: 'mult', claim: { left: E.mul(d, q_), rel: '=' as const, right: n } },
      { label: `Because ${n} − ${d} = ${q_}.`, value: 'sub', claim: { left: E.sub(n, d), rel: '=' as const, right: q_ } },
      { label: `Because ${d} + ${q_} = ${n}.`, value: 'add', claim: { left: E.add(d, q_), rel: '=' as const, right: n } },
      { label: `Because ${d} × ${q_ + 1} = ${n}.`, value: 'off', claim: { left: E.mul(d, q_ + 1), rel: '=' as const, right: n } },
    ];
    return {
      badge: '💬 Explain your thinking', prompt: `Why is ${n} ÷ ${d} = ${q_}?`,
      interaction: buildChoice(rng, [opts[0]!], opts.slice(1), 4, 'list'),
      hints: ['Division and multiplication undo each other.', `If ${n} is shared into ${d} equal groups of ${q_}, what multiplication is that?`],
      explanation: `${pl(d, 'group', 'groups')} of ${q_} make ${n}: ${d} × ${q_} = ${n}. That is why ${n} ÷ ${d} = ${q_}.`,
      steps: [`${d} × ${q_} = ${n}`],
      math: { kind: 'claims' }, signature: `divx:${n}/${d}`, answerText: `${d} × ${q_} = ${n}`,
      reasoningObjective: 'Justify a division fact with the related multiplication fact.',
    };
  },
};

export const propertiesTF: GenDef = {
  id: 'properties.tf', version: 1, mode: 'explain',
  gen(rng) {
    const a = rng.int(2, 9), c = rng.int(2, 5);
    let b = rng.int(2, 9);
    while (b === a) b = rng.int(2, 9);
    const kinds: { st: [Expr, Expr]; truthNote: string; reason: string; badReason: string }[] = [
      { st: [E.mul(a, b), E.mul(b, a)], truthNote: 'Changing the order of factors keeps the product.', reason: `Turn the array: ${pl(a, 'row', 'rows')} of ${b} or ${pl(b, 'row', 'rows')} of ${a} — same total.`, badReason: 'The first number is always the biggest.' },
      { st: [E.mul(E.mul(a, b), c), E.mul(a, E.mul(b, c))], truthNote: 'Grouping factors differently keeps the product.', reason: `(${a} × ${b}) × ${c} = ${a * b} × ${c} = ${a * b * c}, and ${a} × (${b} × ${c}) = ${a} × ${b * c} = ${a * b * c}.`, badReason: 'Parentheses always change the answer.' },
      { st: [E.mul(a, E.add(c, 2)), E.add(E.mul(a, c), E.mul(a, 2))], truthNote: 'Break apart a factor and multiply each part.', reason: `${a} × ${c + 2} = ${a * (c + 2)}, and ${a * c} + ${a * 2} = ${a * (c + 2)}.`, badReason: `You only multiply the first part by ${a}.` },
      { st: [E.mul(a, 0), a], truthNote: '', reason: `${pl(a, 'group', 'groups')} of 0 is 0, not ${a}.`, badReason: 'Multiplying by zero leaves the number the same.' },
      { st: [E.mul(a, 1), 1], truthNote: '', reason: `${a} × 1 is one group of ${a}, which is ${a}, not 1.`, badReason: 'Anything times 1 is 1.' },
      { st: [E.mul(a, E.add(b, c)), E.add(E.mul(a, b), c)], truthNote: '', reason: `${a} × (${b} + ${c}) = ${a * (b + c)}, but ${a} × ${b} + ${c} = ${a * b + c}.`, badReason: 'Both sides use the same numbers, so they are equal.' },
    ];
    const k = rng.pick(kinds);
    const claim: Claim = { left: k.st[0], rel: '=', right: k.st[1] };
    const truthVal = evalNum(k.st[0]) === evalNum(k.st[1]);
    return {
      badge: '🔁 Number rules', prompt: 'Always true for these numbers? True or false — then pick the reason.',
      interaction: {
        type: 'tf', statement: `${show(k.st[0])} = ${show(k.st[1])}`, truth: truthVal, claim,
        justifications: [
          { id: 'j1', label: k.reason, value: 'good', claim: truthVal ? claim : { left: k.st[0], rel: '≠', right: k.st[1] } },
          { id: 'j2', label: k.badReason, value: 'bad', truth: false },
          { id: 'j3', label: `Both sides equal ${evalNum(k.st[0]) + 1}.`, value: 'calc', claim: { left: k.st[0], rel: '=', right: evalNum(k.st[0]) + 1 } },
        ],
        correctJust: ['j1'],
      },
      hints: ['Work out each side.', 'Then decide if the two sides are the same amount.'],
      explanation: (truthVal ? `True. ${show(k.st[0])} = ${evalNum(k.st[0])} and ${show(k.st[1])} = ${evalNum(k.st[1])}. ${k.truthNote}` : typeof k.st[1] === 'number' ? `False. ${show(k.st[0])} = ${evalNum(k.st[0])}, not ${k.st[1]}.` : `False. ${show(k.st[0])} = ${evalNum(k.st[0])}, but ${show(k.st[1])} = ${evalNum(k.st[1])}.`).trim(),
      steps: [`Left: ${evalNum(k.st[0])}`, `Right: ${evalNum(k.st[1])}`],
      math: { kind: 'claims' }, signature: `prop:${show(k.st[0])}=${show(k.st[1])}`, answerText: truthVal ? 'True' : 'False',
      reasoningObjective: 'Use properties of operations to decide whether expressions are equal.',
    };
  },
};

export const propertiesMatch: GenDef = {
  id: 'properties.match', version: 1, mode: 'explain',
  gen(rng) {
    let a = rng.int(2, 9), b = rng.int(2, 9), c = rng.int(2, 4);
    while (a === b) b = rng.int(2, 9);
    const pairs: [string, string, number][] = [
      [`${a} × ${b}`, `${b} × ${a}`, a * b],
      [`${c} × (${a} + 2)`, `${c} × ${a} + ${c} × 2`, c * (a + 2)],
      [`(2 × ${c}) × ${b}`, `2 × (${c} × ${b})`, 2 * c * b],
    ];
    while (new Set(pairs.map(p => p[2])).size < 3) { a += 1; pairs[0] = [`${a} × ${b}`, `${b} × ${a}`, a * b]; pairs[1] = [`${c} × (${a} + 2)`, `${c} × ${a} + ${c} × 2`, c * (a + 2)]; }
    const left = pairs.map((p, i) => ({ id: `L${i}`, label: p[0], value: p[2] }));
    const right = rng.shuffle(pairs.map((p, i) => ({ id: `R${i}`, label: p[1], value: p[2] })));
    return {
      badge: '🔁 Match equal expressions', prompt: 'Match each expression to one with the same value.',
      interaction: { type: 'match', left, right, pairs: left.map(l => [l.id, right.find(r => r.value === l.value)!.id] as [string, string]) },
      hints: ['Look for the same numbers in a different order or grouping.', 'Or work out the value of each expression.'],
      explanation: pairs.map(p => `${p[0]} = ${p[1]} = ${p[2]}`).join('. ') + '.',
      steps: pairs.map(p => `${p[0]} = ${p[2]}`),
      math: { kind: 'claims' }, signature: `pmatch:${a},${b},${c}`, answerText: String(pairs[0]![2]),
      reasoningObjective: 'Recognize equivalent expressions using properties.',
    };
  },
};

function evalNum(e: Expr): number {
  if (typeof e === 'number') return e;
  if ('frac' in e || 'unknown' in e) throw new Error('evalNum');
  const a = evalNum(e.a), b = evalNum(e.b);
  return e.op === '+' ? a + b : e.op === '-' ? a - b : e.op === '×' ? a * b : a / b;
}

export const multiStepExpr: GenDef = {
  id: 'multistep.expr', version: 1, mode: 'solve',
  gen(rng, diff) {
    const a = rng.int(2, 9), b = rng.int(2, 9), c = rng.int(2, 9);
    const forms: Expr[] = diff === 1
      ? [E.add(E.mul(a, b), c), E.sub(E.mul(a, b), Math.min(c, a * b))]
      : diff === 2
        ? [E.mul(E.add(a, b), c), E.add(E.mul(a, b), E.mul(a, c)), E.sub(E.mul(a, b), c)]
        : [E.add(a, E.mul(b, c)), E.sub(E.mul(a, c), b), E.mul(E.sub(Math.max(a, b) + 2, Math.min(a, b)), c)];
    const valid = forms.filter(f => evalNum(f) >= 0 && Number.isInteger(evalNum(f)));
    const e = rng.pick(valid.length ? valid : [E.add(E.mul(a, b), c)]);
    const v = evalNum(e);
    const leftToRight = (() => { // common error: ignore conventional order
      const s = show(e);
      const m = s.match(/^(\d+) ([+−]) (\d+) × (\d+)$/);
      if (!m) return v + c;
      const x = Number(m[1]), y = Number(m[3]), z = Number(m[4]);
      return (m[2] === '+' ? x + y : x - y) * z;
    })();
    return {
      badge: '🪜 Multi-step', prompt: `${show(e)} = ?`,
      interaction: numeric(v, 0, 500),
      hints: [show(e).includes('(') ? 'Work inside the parentheses first.' : 'Multiply before you add or subtract.', `Do one step at a time, then write down the result.`],
      explanation: `${show(e)} = ${v}.${!show(e).includes('(') && leftToRight !== v ? ` Multiplication comes first, so it is not ${leftToRight}.` : ''}`,
      steps: [`${show(e)}`, `= ${v}`],
      math: eqn({ left: e, rel: '=', right: E.X }, 0, 1000), signature: `ms:${show(e)}`, answerText: String(v),
    };
  },
};

export type { Difficulty, Draft };
export { isX };
