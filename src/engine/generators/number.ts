/** Number sense: counting, numerals, comparing, ordering, place value, number lines, skip counting, rounding. */
import { E } from '../../core/expr';
import { buildChoice, numericDistractors, numOpt } from '../../core/options';
import { cap, numberWord } from '../../core/text';
import type { Option } from '../../core/types';
import { pl } from '../../core/text';
import { byDiff, countList, numChoice, textChoice, THINGS, type GenDef } from '../genkit';

const eqX = (value: number, lo: number, hi: number) => ({ kind: 'equation' as const, claim: { left: E.X, rel: '=' as const, right: value }, lo, hi });

/* ------------------------------------------------------------------ counting */
export const countObjects: GenDef = {
  id: 'count.objects', version: 2, mode: 'solve',
  gen(rng, diff) {
    const n = byDiff(diff, rng.int(2, 5), rng.int(4, 10), rng.int(8, 20));
    const t = rng.pick(THINGS);
    return {
      badge: '🔢 Counting', prompt: `How many ${t.many} do you see?`,
      visual: { kind: 'counters', emoji: t.e, count: n, label: t.many },
      interaction: numChoice(rng, n, { min: 1, max: 20, misconceptions: [n - 1, n + 1], spread: 2 }),
      hints: [`Touch each ${t.one} one time as you count.`, n > 10 ? 'Count the first 10, then keep going: 11, 12…' : 'Say one number for each one. The last number you say tells how many.', `Count with me: ${countList(0, n)}.`],
      explanation: `Counting each ${t.one} once, the last number is ${n}. There ${n === 1 ? 'is' : 'are'} ${n} ${n === 1 ? t.one : t.many}.`,
      steps: ['Start at one end.', 'Touch and count each object once.', `The last number, ${n}, tells how many.`],
      math: { kind: 'count', n }, signature: `count:${n}`, answerText: String(n), readingDemand: 'pre-reader',
    };
  },
};

export const countTenFrame: GenDef = {
  id: 'count.tenframe', version: 2, mode: 'solve',
  gen(rng, diff) {
    const n = byDiff(diff, rng.int(3, 10), rng.int(6, 10), rng.int(11, 20));
    return {
      badge: '🔢 Ten frames', prompt: n > 10 ? 'How many dots are in the ten frames?' : 'How many dots are in the ten frame?',
      visual: { kind: 'tenframe', a: n },
      interaction: numChoice(rng, n, { min: 1, max: 20, misconceptions: [n - 1, n + 1, n > 10 ? n - 10 : 10], spread: 2 }),
      hints: ['A full ten frame has 10 dots.', n > 10 ? `One frame is full: that is 10. Count on with the other frame.` : `How many empty boxes are there? 10 take away the empty boxes.`],
      explanation: n > 10 ? `One full frame is 10, plus ${n - 10} more makes ${n}.` : n === 10 ? 'The frame is full, so there are 10 dots.' : `There are ${n} dots and ${10 - n} empty ${10 - n === 1 ? 'box' : 'boxes'}. ${n} + ${10 - n} = 10.`,
      steps: ['Look for full rows of 5.', 'Count on from 5 or 10.'],
      math: { kind: 'count', n }, signature: `tenframe:${n}`, answerText: String(n), readingDemand: 'pre-reader',
    };
  },
};

export const countExplain: GenDef = {
  id: 'count.explain', version: 1, mode: 'explain',
  gen(rng, diff) {
    const n = byDiff(diff, rng.int(4, 6), rng.int(6, 9), rng.int(9, 12));
    const t = rng.pick(THINGS);
    const name = rng.pick(['Sam', 'Ava', 'Kai', 'Mia', 'Omar', 'Lina']);
    const opts = [
      { label: `${name} touched each ${t.one} once, and the last number said was ${n}.`, value: 'last-number', truth: true },
      { label: `${name} counted some ${t.many} two times.`, value: 'double-count', truth: false },
      { label: `The last ${t.one} ${name} touched is the biggest one.`, value: 'label-not-amount', truth: false },
      { label: `${name} started counting at ${n}.`, value: 'start-wrong', truth: false },
    ];
    return {
      badge: '💬 Explain your thinking', prompt: `${name} counts the ${t.many}: ${countList(0, n)}. How do we know there are ${n}?`,
      visual: { kind: 'counters', emoji: t.e, count: n, label: t.many },
      interaction: buildChoice(rng, [opts[0]!], opts.slice(1), 4, 'list'),
      hints: ['Think about how good counters count.', 'When you count each object exactly once, the LAST number tells how many in all.'],
      explanation: `Each ${t.one} was counted once, and the last number was ${n}, so there are ${n}.`,
      steps: ['Count each object once.', 'The last number names the whole group.'],
      math: { kind: 'claims' }, signature: `count-explain:${n}`, answerText: String(n),
      reasoningObjective: 'Explain why the last number counted tells how many (cardinality).',
    };
  },
};

export const countSameAnyOrder: GenDef = {
  id: 'count.any-order', version: 1, mode: 'explain',
  gen(rng) {
    const n = rng.int(5, 9);
    const t = rng.pick(THINGS);
    return {
      badge: '💬 True or false?', prompt: 'Is this true or false? Then pick the reason.',
      visual: { kind: 'counters', emoji: t.e, count: n, label: t.many },
      interaction: {
        type: 'tf', statement: `If you count these ${t.many} starting from the other end, you get a different number.`, truth: false,
        justifications: [
          { id: 'j1', label: `The number of ${t.many} stays ${n} no matter where you start.`, value: 'same', truth: true },
          { id: 'j2', label: 'Starting from the other end always gives one more.', value: 'plus-one', truth: false },
          { id: 'j3', label: 'You have to start with the biggest one.', value: 'biggest', truth: false },
        ],
        correctJust: ['j1'],
      },
      hints: ['Try it! Count from the left, then count from the right.', `Both ways, you count every ${t.one} once.`],
      explanation: `False. There are ${n} ${t.many} no matter which one you count first.`,
      steps: ['Count from the left.', 'Count from the right.', 'Compare: the numbers are the same.'],
      math: { kind: 'claims' }, signature: `count-order:${n}`, answerText: 'False',
      reasoningObjective: 'Understand that counting order does not change how many.',
    };
  },
};

/* ------------------------------------------------------------------ numerals */
export const numeralWord: GenDef = {
  id: 'numerals.word', version: 1, mode: 'solve',
  gen(rng, diff) {
    const n = byDiff(diff, rng.int(1, 10), rng.int(6, 15), rng.int(11, 20));
    const swap = n >= 13 ? Number(String(n).split('').reverse().join('')) : n + 10;
    return {
      badge: '🔤 Number friends', prompt: `Tap the number ${numberWord(n)}.`,
      interaction: numChoice(rng, n, { min: 0, max: 99, misconceptions: [swap, n + 1, n - 1, n % 10], spread: 3 }),
      hints: [`Say the number out loud: ${numberWord(n)}.`, n > 10 ? `${cap(numberWord(n))} is 10 and ${n - 10} more.` : `Count up from one until you say ${numberWord(n)}.`],
      explanation: `${cap(numberWord(n))} is written ${n}.`,
      steps: [`${cap(numberWord(n))} → ${n}`],
      math: eqX(n, 0, 99), signature: `word:${n}`, answerText: String(n), readingDemand: 'early',
    };
  },
};

export const numeralMatch: GenDef = {
  id: 'numerals.match', version: 1, mode: 'solve',
  gen(rng, diff) {
    const pool = byDiff(diff, [1, 2, 3, 4, 5], [2, 3, 4, 5, 6, 7, 8], [4, 5, 6, 7, 8, 9, 10]);
    const ns = rng.sample(pool, 3);
    const t = rng.pick(THINGS);
    const left: Option[] = ns.map((n, i) => ({ id: `L${i}`, label: `${n} ${n === 1 ? t.one : t.many}`, value: n, aria: `A group of ${n} ${n === 1 ? t.one : t.many}`, visual: { kind: 'counters', emoji: t.e, count: n, label: t.many } }));
    const right: Option[] = rng.shuffle(ns).map((n, i) => ({ id: `R${i}`, label: String(n), value: n }));
    return {
      badge: '🔤 Match it', prompt: 'Match each group to its number.',
      interaction: { type: 'match', left, right, pairs: left.map(l => [l.id, right.find(r => r.value === l.value)!.id] as [string, string]) },
      hints: ['Count one group. Then find that number.', 'Do one group at a time.'],
      explanation: `The groups have ${ns.map(n => `${n} ${n === 1 ? t.one : t.many}`).join(', ')}. So the numbers are ${ns.join(', ')}.`,
      steps: ns.map(n => `${n} objects → ${n}`),
      math: { kind: 'claims' }, signature: `match:${ns.join(',')}`, answerText: ns.join(', '), readingDemand: 'pre-reader',
    };
  },
};

/* ------------------------------------------------------------------ comparing */
const relOf = (a: number, b: number) => (a > b ? '>' : a < b ? '<' : '=');

export const compareGroups: GenDef = {
  id: 'compare.groups', version: 2, mode: 'solve',
  gen(rng, diff) {
    const [t1, t2] = rng.sample(THINGS, 2) as [typeof THINGS[number], typeof THINGS[number]];
    const cap_ = byDiff(diff, 5, 8, 10);
    const a = rng.int(1, cap_);
    let b = rng.int(1, cap_);
    const allowSame = diff >= 2 && rng.bool(0.3);
    if (allowSame) b = a;
    else while (b === a) b = rng.int(1, cap_);
    const boxes = [{ name: t1.many, emoji: t1.e, n: a }, { name: t2.many, emoji: t2.e, n: b }];
    const visual = { kind: 'compareGroups' as const, boxes };
    const hints = ['Count each group carefully.', `${t1.many.charAt(0).toUpperCase() + t1.many.slice(1)}: ${a}. ${t2.many.charAt(0).toUpperCase() + t2.many.slice(1)}: ${b}. Which number comes later when you count?`];
    if (diff >= 2) {
      const opts = [
        { label: `There are more ${t1.many}.`, value: '>' },
        { label: `There are more ${t2.many}.`, value: '<' },
        { label: 'Both groups have the same number.', value: '=' },
      ];
      const r = relOf(a, b);
      return {
        badge: '⚖️ Comparing', prompt: 'Compare the groups. Which is true?', visual,
        interaction: buildChoice(rng, opts.filter(o => o.value === r), opts.filter(o => o.value !== r), 3, 'list'),
        hints: [hints[0]!, hints[1]!.replace('Which number comes later when you count?', 'Are the numbers the same or different?')],
        explanation: r === '=' ? `Both groups have ${a}. They have the same number.` : `${Math.max(a, b)} is more than ${Math.min(a, b)}, so there are more ${r === '>' ? t1.many : t2.many}.`,
        steps: [`${t1.many}: ${a}`, `${t2.many}: ${b}`, `Compare ${a} and ${b}.`],
        math: { kind: 'compare', a, b }, signature: `cmpg:${a},${b}`, answerText: r === '=' ? 'same' : String(Math.max(a, b)), readingDemand: 'early',
      };
    }
    const askMore = rng.bool();
    const opts = askMore
      ? [{ label: `The ${t1.many}`, value: '>' }, { label: `The ${t2.many}`, value: '<' }]
      : [{ label: `The ${t1.many}`, value: '<' }, { label: `The ${t2.many}`, value: '>' }];
    const r = relOf(a, b);
    const winner = (askMore ? a > b : a < b) ? t1.many : t2.many;
    return {
      badge: '⚖️ Comparing', prompt: `Which group has ${askMore ? 'more' : 'fewer'}?`, visual,
      interaction: buildChoice(rng, opts.filter(o => o.value === r), opts.filter(o => o.value !== r), 2, 'two'),
      hints,
      explanation: `There ${a === 1 ? 'is' : 'are'} ${a} ${a === 1 ? t1.one : t1.many} and ${b} ${b === 1 ? t2.one : t2.many}. The ${winner} ${askMore ? 'have more' : 'have fewer'}.`,
      steps: [`Count: ${a} and ${b}.`, `${Math.max(a, b)} is more than ${Math.min(a, b)}.`],
      math: { kind: 'compare', a, b }, signature: `cmpg:${a},${b},${askMore}`, answerText: winner, readingDemand: 'pre-reader',
    };
  },
};

export const compareNumbers: GenDef = {
  id: 'compare.numbers', version: 2, mode: 'solve',
  gen(rng, diff) {
    const hi = byDiff(diff, 10, 15, 20);
    const a = rng.int(0, hi);
    let b = rng.int(0, hi);
    while (b === a) b = rng.int(0, hi);
    const askGreater = rng.bool();
    const ans = askGreater ? Math.max(a, b) : Math.min(a, b);
    return {
      badge: '⚖️ Comparing', prompt: `Which number is ${askGreater ? 'greater' : 'less'}: ${a} or ${b}?`,
      interaction: buildChoice(rng, [numOpt(ans)], [numOpt(ans === a ? b : a)], 2, 'two'),
      hints: ['Numbers get greater as you count up.', `Count up from 0. Do you say ${a} or ${b} first?`],
      explanation: `${Math.max(a, b)} comes later when counting, so ${Math.max(a, b)} is greater and ${Math.min(a, b)} is less.`,
      steps: [`Count: … ${Math.min(a, b)} … ${Math.max(a, b)}`],
      math: { kind: 'extreme', which: askGreater ? 'max' : 'min', items: [{ value: String(a), expr: a }, { value: String(b), expr: b }] },
      signature: `cmpn:${a},${b},${askGreater}`, answerText: String(ans), readingDemand: 'early',
    };
  },
};

export const compareSameNumber: GenDef = {
  id: 'compare.same-number', version: 1, mode: 'explain',
  gen(rng) {
    const big = rng.pick([{ e: '🐘', one: 'elephant', many: 'elephants' }, { e: '🐳', one: 'whale', many: 'whales' }, { e: '🦒', one: 'giraffe', many: 'giraffes' }]);
    const small = rng.pick([{ e: '🐜', one: 'ant', many: 'ants' }, { e: '🐞', one: 'ladybug', many: 'ladybugs' }, { e: '🐝', one: 'bee', many: 'bees' }]);
    const same = rng.bool();
    const a = rng.int(3, 6);
    const b = same ? a : a + rng.int(1, 3);
    const statement = same
      ? `A group of ${a} ${big.many} and a group of ${b} ${small.many} have the same number of animals.`
      : `There are more ${big.many} than ${small.many}, because ${big.many} are bigger.`;
    const truth = same;
    const just = same
      ? [
          { id: 'j1', label: `Both groups have ${a}. Big or small, each animal counts as 1.`, value: 'count', claim: { left: a, rel: '=' as const, right: b } },
          { id: 'j2', label: `The ${big.many} are bigger, so there are more of them.`, value: 'size', claim: { left: a, rel: '>' as const, right: b } },
          { id: 'j3', label: `The ${small.many} are smaller, so there are more of them.`, value: 'size2', claim: { left: b, rel: '>' as const, right: a } },
        ]
      : [
          { id: 'j1', label: `There are ${b} ${small.many} and only ${a} ${big.many}. Size does not change how many.`, value: 'count', claim: { left: b, rel: '>' as const, right: a } },
          { id: 'j2', label: `Bigger animals always count as more.`, value: 'size', truth: false },
          { id: 'j3', label: `The groups have the same number.`, value: 'same', claim: { left: a, rel: '=' as const, right: b } },
        ];
    return {
      badge: '💬 True or false?', prompt: 'Is this true or false? Then pick the reason.',
      visual: { kind: 'compareGroups', boxes: [{ name: big.many, emoji: big.e, n: a }, { name: small.many, emoji: small.e, n: b }] },
      interaction: { type: 'tf', statement, truth, claim: same ? { left: a, rel: '=' as const, right: b } : { left: a, rel: '>' as const, right: b }, justifications: just, correctJust: ['j1'] },
      hints: ['Count each group. Do not look at how big the animals are.', `${big.many}: ${a}. ${small.many}: ${b}.`],
      explanation: same ? `True. Both groups have ${a}. How big things are does not change how many there are.` : `False. There are ${b} ${small.many} and ${a} ${big.many}. ${b} is more than ${a}.`,
      steps: [`Count ${big.many}: ${a}.`, `Count ${small.many}: ${b}.`, 'Compare the numbers, not the sizes.'],
      math: { kind: 'claims' }, signature: `same-number:${a},${b}`, answerText: same ? 'True' : 'False',
      reasoningObjective: 'Recognize that quantity does not depend on object size.',
    };
  },
};

/* ------------------------------------------------------------------ ordering */
export const orderNextBefore: GenDef = {
  id: 'order.next-before', version: 1, mode: 'solve',
  gen(rng, diff) {
    const hi = byDiff(diff, 9, 19, 19);
    const after = rng.bool(0.6);
    const n = after ? rng.int(1, hi) : rng.int(2, hi + 1);
    const ans = after ? n + 1 : n - 1;
    return {
      badge: '🪜 Number order', prompt: `What number comes just ${after ? 'after' : 'before'} ${n}?`,
      visual: { kind: 'numberline', min: 0, max: hi + 1 > 10 ? 20 : 10, labelEvery: hi + 1 > 10 ? 5 : 1, marks: [{ value: [n, 1], label: String(n) }], aria: `A number line with ${n} marked` },
      interaction: numChoice(rng, ans, { min: 0, max: 21, misconceptions: [after ? n - 1 : n + 1, n, ans + 1], spread: 2 }),
      hints: [after ? 'Count up. What do you say next?' : 'Count back. What do you say just before?', after ? `${Math.max(0, n - 2)}, ${Math.max(0, n - 1)}, ${n}, …?` : `…?, ${n}, ${n + 1}, ${n + 2}`],
      explanation: after ? `When we count, ${n + 1} comes just after ${n}.` : `When we count, ${n - 1} comes just before ${n}.`,
      steps: [after ? `${n} + 1 = ${n + 1}` : `${n} − 1 = ${n - 1}`],
      math: { kind: 'equation', claim: { left: E.X, rel: '=', right: after ? E.add(n, 1) : E.sub(n, 1) }, lo: 0, hi: 30 },
      signature: `nb:${n},${after}`, answerText: String(ans), readingDemand: 'early',
    };
  },
};

export const orderMissing: GenDef = {
  id: 'order.missing', version: 1, mode: 'solve',
  gen(rng, diff) {
    const start = byDiff(diff, rng.int(0, 5), rng.int(3, 12), rng.int(8, 16));
    const terms: (number | null)[] = [0, 1, 2, 3, 4].map(i => start + i);
    const gap = rng.int(1, 3);
    const ans = terms[gap] as number;
    terms[gap] = null;
    return {
      badge: '🪜 Number order', prompt: `What number is missing? ${terms.map(t => (t === null ? '___' : t)).join(', ')}`,
      interaction: numChoice(rng, ans, { min: 0, max: 25, misconceptions: [ans + 1, ans - 1, ans + 2], spread: 2 }),
      hints: ['Read the numbers out loud in order.', `What comes just after ${terms[gap - 1]}?`],
      explanation: `Counting by ones: ${terms.map(t => (t === null ? ans : t)).join(', ')}. The missing number is ${ans}.`,
      steps: [`${terms[gap - 1]} + 1 = ${ans}`],
      math: { kind: 'arith-sequence', terms }, signature: `miss-seq:${start},${gap}`, answerText: String(ans), readingDemand: 'early',
    };
  },
};

export const orderSort: GenDef = {
  id: 'order.sort', version: 1, mode: 'solve',
  gen(rng, diff) {
    const hi = byDiff(diff, 10, 20, 50);
    const k = diff === 1 ? 3 : 4;
    const pool = Array.from({ length: hi + 1 }, (_, i) => i);
    const ns = rng.sample(pool, k);
    const items: Option[] = ns.map((n, i) => ({ id: `i${i}`, label: String(n), value: n }));
    const sorted = items.slice().sort((x, y) => Number(x.value) - Number(y.value));
    return {
      badge: '🪜 Put in order', prompt: 'Put the numbers in order from least to greatest.',
      interaction: { type: 'order', items, correctOrder: sorted.map(s => s.id), instruction: 'Tap the numbers from least to greatest.' },
      hints: ['Find the least number first.', hi > 20 ? 'Compare the tens digits first.' : 'Which number would you say first when counting?'],
      explanation: `From least to greatest: ${sorted.map(s => s.label).join(', ')}.`,
      steps: sorted.map((s, i) => `${i + 1}. ${s.label}`),
      math: { kind: 'order', items: items.map(i => ({ id: i.id, expr: Number(i.value) })), direction: 'ascending' },
      signature: `sort:${ns.slice().sort((a, b) => a - b).join(',')}`, answerText: sorted.map(s => s.label).join(', '), readingDemand: 'early',
    };
  },
};

/* --------------------------------------------------------------- place value */
export const pvBlocks: GenDef = {
  id: 'pv.blocks', version: 2, mode: 'solve',
  gen(rng, diff) {
    const t = byDiff(diff, 1, rng.int(2, 9), rng.int(1, 9));
    const o = rng.int(0, 9);
    const n = t * 10 + o;
    return {
      badge: '🔟 Tens & ones', prompt: 'What number do the blocks show?',
      visual: { kind: 'placevalue', t, o },
      interaction: numChoice(rng, n, { min: 1, max: 120, misconceptions: [o * 10 + t, t + o, n + 10, n - 10], spread: 3 }),
      hints: ['Each tall rod is 10. Each small cube is 1.', `Count the rods by tens: ${countList(0, t, 10)}. Then count on the cubes.`],
      explanation: `${t} ${t === 1 ? 'ten' : 'tens'} and ${o} ${o === 1 ? 'one' : 'ones'} make ${n}.`,
      steps: [`${pl(t, 'ten', 'tens')} = ${t * 10}`, `${t * 10} + ${o} = ${n}`],
      math: { kind: 'place', h: 0, t, o, ask: 'value' }, signature: `pv:${n}`, answerText: String(n), readingDemand: 'early',
    };
  },
};

export const pvDigit: GenDef = {
  id: 'pv.digit', version: 2, mode: 'solve',
  gen(rng, diff) {
    const t = rng.int(1, 9);
    let o = rng.int(0, 9);
    if (diff >= 2) while (o === t) o = rng.int(0, 9);
    const n = t * 10 + o;
    const askTens = rng.bool();
    const ans = askTens ? t : o;
    return {
      badge: '🔟 Place value', prompt: `How many ${askTens ? 'tens' : 'ones'} are in ${n}?`,
      ...(diff === 1 ? { visual: { kind: 'placevalue' as const, t, o } } : {}),
      interaction: numChoice(rng, ans, { min: 0, max: 99, misconceptions: [askTens ? o : t, n, t + o], spread: 2 }),
      hints: [askTens ? 'The tens digit is on the left.' : 'The ones digit is on the right.', `${n} is ${pl(t, 'ten', 'tens')} and ${pl(o, 'one', 'ones')}.`],
      explanation: `${n} = ${pl(t, 'ten', 'tens')} and ${pl(o, 'one', 'ones')}, so there ${ans === 1 ? 'is' : 'are'} ${ans} ${askTens ? (ans === 1 ? 'ten' : 'tens') : ans === 1 ? 'one' : 'ones'}.`,
      steps: [`${n} = ${t * 10} + ${o}`],
      math: { kind: 'place', h: 0, t, o, ask: askTens ? 'tens' : 'ones' }, signature: `pvd:${n},${askTens}`, answerText: String(ans), readingDemand: 'early',
    };
  },
};

export const pvExpanded: GenDef = {
  id: 'pv.expanded', version: 1, mode: 'solve',
  gen(rng, diff) {
    const three = diff === 3;
    const h = three ? rng.int(1, 9) : 0;
    const t = three ? rng.pick([0, rng.int(1, 9)]) : rng.int(2, 9);
    let o = rng.int(1, 9);
    while (o === t) o = rng.int(1, 9);
    const n = h * 100 + t * 10 + o;
    const parts = (hh: number, tt: number, oo: number) => [hh ? hh * 100 : 0, tt ? tt * 10 : 0, oo].filter(x => x > 0);
    const lab = (xs: number[]) => xs.join(' + ');
    const correct = parts(h, t, o);
    const wrongs = three
      ? [[h * 100, o * 10, t].filter(x => x > 0), [h * 10, t, o].filter(x => x > 0), [h, t, o].filter(x => x > 0)]
      : [[o * 10, t], [t, o], [t * 10, o * 10]];
    const toOpt = (xs: number[]) => ({ label: lab(xs), value: lab(xs), claim: { left: E.sum(...xs), rel: '=' as const, right: n } });
    return {
      badge: '🔟 Place value', prompt: `Which is the same as ${n}?`,
      interaction: buildChoice(rng, [toOpt(correct)], wrongs.filter(w => w.length > 0 && w.reduce((s, x) => s + x, 0) !== n).map(toOpt), 4, 'grid'),
      hints: ['Break the number into its place values.', three ? `${n} has ${pl(h, 'hundred', 'hundreds')}, ${pl(t, 'ten', 'tens')}, and ${pl(o, 'one', 'ones')}.` : `${n} has ${pl(t, 'ten', 'tens')} and ${pl(o, 'one', 'ones')}.`],
      explanation: `${n} = ${lab(correct)}.`,
      steps: correct.map(x => `${x}`),
      math: { kind: 'claims' }, signature: `pve:${n}`, answerText: lab(correct), readingDemand: 'early',
    };
  },
};

export const pvMistake: GenDef = {
  id: 'pv.mistake', version: 1, mode: 'mistake',
  gen(rng) {
    const t = rng.int(2, 9);
    let o = rng.int(1, 9);
    while (o === t) o = rng.int(1, 9);
    const n = t * 10 + o;
    const wrong = o * 10 + t;
    const name = rng.pick(['Leo', 'Zara', 'Ben', 'Priya', 'Mateo', 'Hana']);
    const opts = [
      { label: `${name} mixed up the tens and ones. ${pl(t, 'ten', 'tens')} and ${pl(o, 'one', 'ones')} is ${n}.`, value: 'swap', claim: { left: E.add(t * 10, o), rel: '=' as const, right: n } },
      { label: `${name} is right. The blocks show ${wrong}.`, value: 'right', claim: { left: E.add(t * 10, o), rel: '=' as const, right: wrong } },
      { label: `${name} should add the digits. The blocks show ${t + o}.`, value: 'add', claim: { left: E.add(t * 10, o), rel: '=' as const, right: t + o } },
      { label: `${name} missed one ten. The blocks show ${wrong + 10}.`, value: 'missed', claim: { left: E.add(t * 10, o), rel: '=' as const, right: wrong + 10 } },
    ];
    return {
      badge: '🔎 Find the mistake', prompt: `${name} says these blocks show ${wrong}. What went wrong?`,
      visual: { kind: 'placevalue', t, o },
      interaction: buildChoice(rng, [opts[0]!], opts.slice(1), 4, 'list'),
      hints: [`Count the rods. Each rod is 10.`, `There are ${t} rods. That is ${t * 10}.`],
      explanation: `The rods are tens: ${pl(t, 'ten', 'tens')} is ${t * 10}. Add ${pl(o, 'one', 'ones')}: ${n}. ${name} wrote the digits in the wrong places.`,
      steps: [`${t} rods = ${t * 10}`, `${o} cubes = ${o}`, `${t * 10} + ${o} = ${n}`],
      math: { kind: 'claims' }, signature: `pvm:${n}`, answerText: String(n),
      reasoningObjective: 'Analyze a place-value error (reversed digits).',
    };
  },
};

export const pv3Blocks: GenDef = {
  id: 'pv3.blocks', version: 1, mode: 'solve',
  gen(rng, diff) {
    const h = rng.int(1, byDiff(diff, 3, 6, 9));
    const t = diff === 3 ? rng.pick([0, rng.int(1, 9)]) : rng.int(1, 9);
    const o = rng.int(0, 9);
    const n = h * 100 + t * 10 + o;
    return {
      badge: '🏛️ Hundreds, tens & ones', prompt: 'What number do the blocks show?',
      visual: { kind: 'placevalue', h, t, o },
      interaction: numChoice(rng, n, { min: 1, max: 999, misconceptions: [h * 100 + o * 10 + t, h * 10 + t + o, h + t + o, n + 100, n - 100].filter(x => x !== n), spread: 10 }),
      hints: ['A flat is 100. A rod is 10. A cube is 1.', `${pl(h, 'hundred', 'hundreds')} is ${h * 100}. Then count on the tens and ones.`],
      explanation: `${h * 100} + ${t * 10} + ${o} = ${n}.`,
      steps: [`${pl(h, 'hundred', 'hundreds')} = ${h * 100}`, `${pl(t, 'ten', 'tens')} = ${t * 10}`, `${pl(o, 'one', 'ones')} = ${o}`, `Total: ${n}`],
      math: { kind: 'place', h, t, o, ask: 'value' }, signature: `pv3:${n}`, answerText: String(n), readingDemand: 'early',
    };
  },
};

export const pv3Digit: GenDef = {
  id: 'pv3.digit', version: 1, mode: 'solve',
  gen(rng) {
    const digits = rng.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 3) as [number, number, number];
    const [h, t, o] = digits;
    const n = h * 100 + t * 10 + o;
    const place = rng.pick(['hundreds', 'tens', 'ones'] as const);
    const ans = place === 'hundreds' ? h : place === 'tens' ? t : o;
    return {
      badge: '🏛️ Place value', prompt: `In ${n}, which digit is in the ${place} place?`,
      interaction: buildChoice(rng, [numOpt(ans)], [h, t, o].filter(d => d !== ans).map(d => numOpt(d)).concat([numOpt(n)]), 4, 'grid'),
      hints: ['From left to right: hundreds, tens, ones.', `${n} = ${pl(h, 'hundred', 'hundreds')}, ${pl(t, 'ten', 'tens')}, ${pl(o, 'one', 'ones')}.`],
      explanation: `In ${n}, the ${place} digit is ${ans}.`,
      steps: [`${h} | ${t} | ${o}`, 'hundreds | tens | ones'],
      math: { kind: 'place', h, t, o, ask: place }, signature: `pv3d:${n},${place}`, answerText: String(ans), readingDemand: 'early',
    };
  },
};

export const pv3Compare: GenDef = {
  id: 'pv3.compare', version: 1, mode: 'solve',
  gen(rng, diff) {
    const a = rng.int(100, 999);
    let b: number;
    if (diff >= 2 && rng.bool(0.6)) {
      // same hundreds digit — must look at tens
      b = Math.floor(a / 100) * 100 + rng.int(0, 99);
    } else b = rng.int(100, 999);
    if (diff === 3 && rng.bool(0.2)) b = a;
    while (b === a && !(diff === 3)) b = rng.int(100, 999);
    const opts = [{ label: '>', value: '>', aria: 'is greater than' }, { label: '<', value: '<', aria: 'is less than' }, { label: '=', value: '=', aria: 'is equal to' }];
    const r = relOf(a, b);
    return {
      badge: '🏛️ Compare', prompt: `Which symbol makes this true?  ${a} ___ ${b}`,
      interaction: buildChoice(rng, opts.filter(o => o.value === r), opts.filter(o => o.value !== r), 3, 'grid', true),
      hints: ['Compare the hundreds first.', 'If the hundreds match, compare the tens. Then the ones.'],
      explanation: r === '=' ? `The numbers are the same: ${a} = ${b}.` : `${a} is ${r === '>' ? 'greater than' : 'less than'} ${b}, so ${a} ${r} ${b}.`,
      steps: [`Hundreds: ${Math.floor(a / 100)} and ${Math.floor(b / 100)}`, `Tens: ${Math.floor(a / 10) % 10} and ${Math.floor(b / 10) % 10}`],
      math: { kind: 'compare', a, b }, signature: `pv3c:${a},${b}`, answerText: r,
    };
  },
};

/* --------------------------------------------------------------- comparing 2-digit */
export const cmpSymbols: GenDef = {
  id: 'cmp2.symbols', version: 2, mode: 'solve',
  gen(rng, diff) {
    const hi = byDiff(diff, 20, 50, 99);
    const a = rng.int(10, hi);
    let b = rng.int(10, hi);
    if (diff >= 2 && rng.bool(0.4)) b = Math.floor(a / 10) * 10 + rng.int(0, 9);
    if (diff >= 2 && rng.bool(0.15)) b = a;
    if (diff === 1) while (b === a) b = rng.int(10, hi);
    const opts = [{ label: '>', value: '>', aria: 'is greater than' }, { label: '<', value: '<', aria: 'is less than' }, { label: '=', value: '=', aria: 'is equal to' }];
    const r = relOf(a, b);
    return {
      badge: '🐊 Comparing', prompt: `Which symbol makes this true?  ${a} ___ ${b}`,
      interaction: buildChoice(rng, opts.filter(o => o.value === r), opts.filter(o => o.value !== r), 3, 'grid', true),
      hints: ['> means "is greater than." < means "is less than."', a === b ? 'Look closely at both numbers.' : 'Compare the tens digits first. If they match, compare the ones.'],
      explanation: r === '=' ? `${a} and ${b} are the same number, so ${a} = ${b}.` : `${a} is ${r === '>' ? 'greater than' : 'less than'} ${b}, so ${a} ${r} ${b}.`,
      steps: [`Tens: ${Math.floor(a / 10)} and ${Math.floor(b / 10)}`, `Ones: ${a % 10} and ${b % 10}`],
      math: { kind: 'compare', a, b }, signature: `cmp2:${a},${b}`, answerText: r, readingDemand: 'early',
    };
  },
};

export const cmpGreatest: GenDef = {
  id: 'cmp2.greatest', version: 1, mode: 'solve',
  gen(rng, diff) {
    const hi = byDiff(diff, 20, 60, 99);
    const set = new Set<number>();
    if (diff === 3) {
      const t = rng.int(1, 9);
      let o = rng.int(1, 9);
      while (o === t) o = rng.int(1, 9);
      set.add(t * 10 + o).add(o * 10 + t);
    }
    while (set.size < 3) set.add(rng.int(10, hi));
    const ns = [...set];
    const greatest = rng.bool();
    const ans = greatest ? Math.max(...ns) : Math.min(...ns);
    return {
      badge: '🐊 Comparing', prompt: `Which number is the ${greatest ? 'greatest' : 'least'}?`,
      interaction: buildChoice(rng, [numOpt(ans)], ns.filter(n => n !== ans).map(n => numOpt(n)), 3, 'grid'),
      hints: ['Compare the tens digits first.', 'If two numbers have the same tens digit, compare the ones.'],
      explanation: `In order: ${ns.slice().sort((x, y) => x - y).join(', ')}. The ${greatest ? 'greatest' : 'least'} is ${ans}.`,
      steps: ns.slice().sort((x, y) => x - y).map(String),
      math: { kind: 'extreme', which: greatest ? 'max' : 'min', items: ns.map(n => ({ value: String(n), expr: n })) },
      signature: `cmpg3:${ns.slice().sort().join(',')},${greatest}`, answerText: String(ans), readingDemand: 'early',
    };
  },
};

export const cmpExplain: GenDef = {
  id: 'cmp2.explain', version: 1, mode: 'explain',
  gen(rng) {
    const t = rng.int(2, 9);
    let o = rng.int(1, 9);
    while (o >= t) { o = rng.int(1, 9); if (t === 1) break; }
    const big = t * 10 + o;
    const small = o * 10 + t;
    const opts = [
      { label: `${big} has ${pl(t, 'ten', 'tens')}. ${small} has only ${pl(o, 'ten', 'tens')}.`, value: 'tens', claim: { left: t, rel: '>' as const, right: o } },
      { label: `${small} has more ones, so ${small} is greater.`, value: 'ones', claim: { left: small, rel: '>' as const, right: big } },
      { label: 'They are equal because they use the same digits.', value: 'same', claim: { left: big, rel: '=' as const, right: small } },
    ];
    return {
      badge: '💬 Explain your thinking', prompt: `Why is ${big} greater than ${small}?`,
      interaction: buildChoice(rng, [opts[0]!], opts.slice(1), 3, 'list'),
      hints: ['Which digit tells how many tens?', `${big} = ${pl(t, 'ten', 'tens')} and ${pl(o, 'one', 'ones')}. ${small} = ${pl(o, 'ten', 'tens')} and ${pl(t, 'one', 'ones')}.`],
      explanation: `Tens are worth more than ones. ${big} has ${pl(t, 'ten', 'tens')} and ${small} has ${pl(o, 'ten', 'tens')}, so ${big} > ${small}.`,
      steps: [`${big}: ${pl(t, 'ten', 'tens')}`, `${small}: ${pl(o, 'ten', 'tens')}`, `${pl(t, 'ten', 'tens')} > ${pl(o, 'ten', 'tens')}`],
      math: { kind: 'claims' }, signature: `cmpx:${big}`, answerText: `${pl(t, 'ten', 'tens')}`,
      reasoningObjective: 'Justify a comparison using place value.',
    };
  },
};

/* ------------------------------------------------------------------ number line */
export const nlLocate: GenDef = {
  id: 'nl.locate', version: 1, mode: 'solve',
  gen(rng, diff) {
    const [min, max, labelEvery] = byDiff(diff, [0, 10, 5], [0, 20, 5], [rng.pick([20, 30, 40, 50]), 0, 5]);
    const lo = min;
    const hi = diff === 3 ? lo + 20 : max;
    let target = rng.int(lo + 1, hi - 1);
    while (target % labelEvery === 0) target = rng.int(lo + 1, hi - 1);
    return {
      badge: '📍 Number line', prompt: `Put the dot at ${target} on the number line.`,
      interaction: { type: 'numberline', min: lo, max: hi, denom: 1, answer: [target, 1], labelEvery },
      hints: ['Find the labeled numbers near it.', `${target} is between ${Math.floor(target / labelEvery) * labelEvery} and ${Math.floor(target / labelEvery) * labelEvery + labelEvery}. Count the tick marks.`],
      explanation: `Start at ${Math.floor(target / labelEvery) * labelEvery} and count ${target % labelEvery} ${target % labelEvery === 1 ? 'tick' : 'ticks'} to the right to reach ${target}.`,
      steps: [`Nearest label: ${Math.floor(target / labelEvery) * labelEvery}`, `Count on ${target % labelEvery}.`],
      math: eqX(target, lo, hi), signature: `nll:${lo},${hi},${target}`, answerText: String(target), readingDemand: 'early',
    };
  },
};

export const nlRead: GenDef = {
  id: 'nl.read', version: 1, mode: 'solve',
  gen(rng, diff) {
    const lo = byDiff(diff, 0, 0, rng.pick([10, 20, 30, 40, 50, 60, 70]));
    const hi = byDiff(diff, 10, 20, lo + 30);
    const labelEvery = diff === 1 ? 5 : 10;
    let target = rng.int(lo + 1, hi - 1);
    while (target % labelEvery === 0) target = rng.int(lo + 1, hi - 1);
    return {
      badge: '📍 Number line', prompt: 'What number is at the red dot?',
      visual: { kind: 'numberline', min: lo, max: hi, labelEvery, marks: [{ value: [target, 1] }], aria: `A number line from ${lo} to ${hi} with a dot between ${Math.floor(target / labelEvery) * labelEvery} and ${Math.floor(target / labelEvery) * labelEvery + labelEvery}` },
      interaction: numChoice(rng, target, { min: lo, max: hi, misconceptions: [target + 1, target - 1, Math.floor(target / labelEvery) * labelEvery + labelEvery - (target % labelEvery)], spread: 2 }),
      hints: ['Find the closest labeled number.', 'Each small tick is 1 more. Count the ticks.'],
      explanation: `The dot is ${target % labelEvery} ${target % labelEvery === 1 ? 'tick' : 'ticks'} after ${Math.floor(target / labelEvery) * labelEvery}, so it is at ${target}.`,
      steps: [`${Math.floor(target / labelEvery) * labelEvery} + ${target % labelEvery} = ${target}`],
      math: eqX(target, lo, hi), signature: `nlr:${lo},${target}`, answerText: String(target), readingDemand: 'early',
    };
  },
};

/* ------------------------------------------------------------------ skip counting */
function skipGen(id: string, steps: (diff: 1 | 2 | 3) => number[], allowBack: boolean, maxStart: number): GenDef {
  return {
    id, version: 1, mode: 'solve',
    gen(rng, diff) {
      const step = rng.pick(steps(diff));
      const back = allowBack && diff >= 2 && rng.bool(0.35);
      const startM = rng.int(back ? 4 : 0, back ? 4 + maxStart : maxStart);
      const missingIdx = diff === 3 ? rng.int(1, 3) : 4;
      const terms: (number | null)[] = [0, 1, 2, 3, 4].map(i => step * (back ? startM - i : startM + i));
      const ans = terms[missingIdx] as number;
      terms[missingIdx] = null;
      const shown = terms.map(t => (t === null ? '___' : t)).join(', ');
      return {
        badge: '⏭️ Skip counting', prompt: `Count ${back ? 'back ' : ''}by ${step}s: ${shown}`,
        interaction: numChoice(rng, ans, { min: 0, max: 2000, misconceptions: [ans + (back ? -1 : 1), ans + step, ans - step], spread: Math.max(2, Math.floor(step / 2)) }),
        hints: [`Each number ${back ? 'goes down' : 'goes up'} by ${step}.`, missingIdx === 4 ? `${terms[3]} ${back ? '−' : '+'} ${step} = ?` : `${terms[missingIdx - 1]} ${back ? '−' : '+'} ${step} = ?`],
        explanation: `Counting ${back ? 'back ' : ''}by ${step}s: ${terms.map(t => (t === null ? ans : t)).join(', ')}.`,
        steps: [`${missingIdx === 4 ? terms[3] : terms[missingIdx - 1]} ${back ? '−' : '+'} ${step} = ${ans}`],
        math: { kind: 'arith-sequence', terms }, signature: `skip:${step},${startM},${back},${missingIdx}`, answerText: String(ans), readingDemand: 'early',
      };
    },
  };
}
export const skip2 = skipGen('skip.basic', d => byDiff(d, [10, 5], [2, 5, 10], [2, 5, 10]), true, 6);
export const skip3 = skipGen('skip.plus', d => byDiff(d, [2, 5, 10], [3, 4, 5, 10], [3, 4, 100]), true, 8);

/* ------------------------------------------------------------------ rounding & estimating */
const roundHalfUp = (n: number, to: number) => Math.floor((n + to / 2) / to) * to;

export const round10: GenDef = {
  id: 'round.ten', version: 1, mode: 'solve',
  gen(rng, diff) {
    let n = byDiff(diff, rng.int(11, 49), rng.int(11, 99), rng.int(101, 499));
    if (n % 10 === 0) n += rng.int(1, 9);
    const r = roundHalfUp(n, 10);
    const lo = Math.floor(n / 10) * 10;
    return {
      badge: '🎯 Rounding', prompt: `Round ${n} to the nearest ten.`,
      visual: { kind: 'numberline', min: lo, max: lo + 10, labelEvery: 5, marks: [{ value: [n, 1], label: String(n) }], aria: `${n} on a number line from ${lo} to ${lo + 10}` },
      interaction: textChoice(rng, numOpt(r), [numOpt(r === lo ? lo + 10 : lo), numOpt(n), numOpt(r + 10), numOpt(Math.max(0, r - 20))]),
      hints: [`${n} is between ${lo} and ${lo + 10}. Which ten is it closer to?`, n % 10 === 5 ? `${n} is exactly halfway. When a number is exactly halfway, we round up.` : `Look at the ones digit: ${n % 10}. 0–4 round down, 5–9 round up.`],
      explanation: n % 10 === 5 ? `${n} is exactly halfway between ${lo} and ${lo + 10}. We round halfway numbers up, so ${n} rounds to ${r}.` : `${n} is closer to ${r} than to ${r === lo ? lo + 10 : lo}, so it rounds to ${r}.`,
      steps: [`Tens on each side: ${lo} and ${lo + 10}`, `Ones digit ${n % 10} → round ${r === lo ? 'down' : 'up'}`],
      math: { kind: 'round', n, to: 10 }, signature: `r10:${n}`, answerText: String(r),
    };
  },
};

export const round100: GenDef = {
  id: 'round.hundred', version: 1, mode: 'solve',
  gen(rng, diff) {
    const to = diff === 1 ? 10 : rng.pick([10, 100] as const);
    let n = rng.int(101, 989);
    if (n % to === 0) n += 3;
    const r = roundHalfUp(n, to);
    const other = to === 100 ? roundHalfUp(n, 10) : roundHalfUp(n, 100);
    const lo = Math.floor(n / to) * to;
    return {
      badge: '🎯 Rounding', prompt: `Round ${n} to the nearest ${to === 100 ? 'hundred' : 'ten'}.`,
      interaction: textChoice(rng, numOpt(r), [numOpt(r === lo ? lo + to : lo), numOpt(other), numOpt(lo + 2 * to), numOpt(Math.floor(n / to) * to - to)].filter(o => Number(o.value) > 0)),
      hints: [`${n} is between ${lo} and ${lo + to}.`, `Look at the ${to === 100 ? 'tens' : 'ones'} digit: ${to === 100 ? Math.floor(n / 10) % 10 : n % 10}. 0–4 round down, 5–9 round up.`],
      explanation: `The ${to === 100 ? 'tens' : 'ones'} digit is ${to === 100 ? Math.floor(n / 10) % 10 : n % 10}, so ${n} rounds ${r === lo ? 'down' : 'up'} to ${r}.`,
      steps: [`Between ${lo} and ${lo + to}`, `Rounds to ${r}`],
      math: { kind: 'round', n, to }, signature: `r100:${n},${to}`, answerText: String(r),
    };
  },
};

export const estimateSum: GenDef = {
  id: 'estimate.sum', version: 1, mode: 'solve',
  gen(rng, diff) {
    const to = diff === 3 ? 100 : 10;
    const op = rng.pick(['+', '-'] as const);
    let a = to === 10 ? rng.int(12, 88) : rng.int(120, 880);
    let b = to === 10 ? rng.int(12, 88) : rng.int(120, 880);
    if (op === '-' && b > a) [a, b] = [b, a];
    if (a % to === 0) a += 1;
    if (b % to === 0) b += 1;
    const ra = roundHalfUp(a, to), rb = roundHalfUp(b, to);
    const est = op === '+' ? ra + rb : ra - rb;
    const exact = op === '+' ? a + b : a - b;
    const sym = op === '+' ? '+' : '−';
    return {
      badge: '🎯 Estimating', prompt: `Round each number to the nearest ${to === 10 ? 'ten' : 'hundred'}. About how much is ${a} ${sym} ${b}?`,
      interaction: textChoice(rng, numOpt(est), [numOpt(est + to), numOpt(Math.max(0, est - to)), numOpt(est + 2 * to)].filter(o => Number(o.value) !== exact)),
      hints: ['Round each number first.', `${a} → ${ra} and ${b} → ${rb}. Now ${op === '+' ? 'add' : 'subtract'}.`],
      explanation: `${ra} ${sym} ${rb} = ${est}. (The exact answer, ${exact}, is close to ${est}.)`,
      steps: [`${a} → ${ra}`, `${b} → ${rb}`, `${ra} ${sym} ${rb} = ${est}`],
      math: { kind: 'estimate', a, b, op, to }, signature: `est:${a}${op}${b},${to}`, answerText: String(est),
    };
  },
};

export const reasonable: GenDef = {
  id: 'estimate.reasonable', version: 1, mode: 'explain',
  gen(rng, diff) {
    const big = diff === 3;
    const a = big ? rng.int(120, 480) : rng.int(21, 69);
    const b = big ? rng.int(120, 480) : rng.int(21, 69);
    const to = big ? 100 : 10;
    const exact = a + b;
    const isRight = rng.bool(0.45);
    const proposed = isRight ? exact : exact + rng.pick([1, -1]) * (big ? rng.int(2, 4) * 100 : rng.int(2, 4) * 10);
    const ra = roundHalfUp(a, to), rb = roundHalfUp(b, to);
    const est = ra + rb;
    const name = rng.pick(['Jo', 'Amara', 'Theo', 'Nia', 'Diego', 'Ella']);
    const just = isRight
      ? [
          { id: 'j1', label: `${a} is about ${ra} and ${b} is about ${rb}. ${ra} + ${rb} = ${est}, and ${proposed} is close to ${est}.`, value: 'est', claim: { left: E.add(ra, rb), rel: '=' as const, right: est } },
          { id: 'j2', label: `It must be right because it is a big number.`, value: 'big', truth: false },
          { id: 'j3', label: `${ra} + ${rb} = ${est + to * 3}, so ${proposed} is too small.`, value: 'bad-est', claim: { left: E.add(ra, rb), rel: '=' as const, right: est + to * 3 } },
        ]
      : [
          { id: 'j1', label: `${a} is about ${ra} and ${b} is about ${rb}. ${ra} + ${rb} = ${est}, which is far from ${proposed}.`, value: 'est', claim: { left: E.add(ra, rb), rel: '=' as const, right: est } },
          { id: 'j2', label: `Any answer with ${String(proposed).length} digits is reasonable.`, value: 'digits', truth: false },
          { id: 'j3', label: `${ra} + ${rb} = ${proposed}, so it is reasonable.`, value: 'bad-est', claim: { left: E.add(ra, rb), rel: '=' as const, right: proposed } },
        ];
    return {
      badge: '🎯 Is it reasonable?', prompt: `${name} says ${a} + ${b} = ${proposed}. Use an estimate. Could ${name} be right?`,
      interaction: { type: 'tf', statement: `${a} + ${b} = ${proposed} could be right.`, truth: isRight, claim: { left: E.add(a, b), rel: '=', right: proposed }, justifications: just, correctJust: ['j1'] },
      hints: [`Round ${a} and ${b} to the nearest ${to === 10 ? 'ten' : 'hundred'}.`, `${ra} + ${rb} = ${est}. Is ${proposed} close to that?`],
      explanation: isRight ? `True — it could be right. The estimate is ${est}, and ${proposed} is close. In fact, ${a} + ${b} = ${exact}.` : `False — it cannot be right. The estimate is ${est}, but ${proposed} is far away. The exact answer is ${exact}.`,
      steps: [`${a} ≈ ${ra}`, `${b} ≈ ${rb}`, `${ra} + ${rb} = ${est}`],
      math: { kind: 'claims' }, signature: `reas:${a}+${b}=${proposed}`, answerText: isRight ? 'True' : 'False',
      reasoningObjective: 'Use estimation to judge whether an answer is reasonable.',
    };
  },
};

export { numericDistractors };
