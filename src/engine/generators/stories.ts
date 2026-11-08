/**
 * Math Story Adventures — original story settings, structured by problem type.
 * Every story carries an expression tree (validated exactly), its list of givens
 * (checked against the numbers in the text), and Understand / Plan / Explain phases.
 * Hints ask about the SITUATION, never "keyword → operation" rules.
 */
import { E, evaluate, show, type Claim, type Expr } from '../../core/expr';
import { buildChoice, numericDistractors, type OptSeed } from '../../core/options';
import type { Rng } from '../../core/rng';
import type { Difficulty, LevelId, StoryStructure, VisualSpec } from '../../core/types';
import { numChoice, numeric, type Draft, type GenDef } from '../genkit';

interface Item { one: string; many: string; e: string }
interface Theme { name: string; place: string; items: Item[]; extra: (n: number) => string }

const T = (one: string, many: string, e: string): Item => ({ one, many, e });
export const THEMES: Theme[] = [
  { name: 'Animal Rescue', place: 'at the animal rescue center', items: [T('puppy', 'puppies', '🐶'), T('kitten', 'kittens', '🐱'), T('bunny', 'bunnies', '🐰')], extra: n => `The center has ${n} volunteers today.` },
  { name: 'Space Station', place: 'on the space station', items: [T('moon rock', 'moon rocks', '🪨'), T('star sticker', 'star stickers', '⭐'), T('space snack', 'space snacks', '🍪')], extra: n => `The trip to the station took ${n} hours.` },
  { name: 'Ocean Discovery', place: 'at the coral reef', items: [T('shell', 'shells', '🐚'), T('crab', 'crabs', '🦀'), T('starfish', 'starfish', '🌟')], extra: n => `The water there is ${n} feet deep.` },
  { name: 'Playground Build', place: 'at the new playground', items: [T('board', 'boards', '🪵'), T('bolt', 'bolts', '🔩'), T('rope', 'ropes', '🪢')], extra: n => `The playground will have ${n} swings.` },
  { name: 'Family Cooking', place: 'in the kitchen', items: [T('egg', 'eggs', '🥚'), T('muffin', 'muffins', '🧁'), T('carrot', 'carrots', '🥕')], extra: n => `The oven timer is set for ${n} minutes.` },
  { name: 'Garden', place: 'in the garden', items: [T('tomato', 'tomatoes', '🍅'), T('sunflower', 'sunflowers', '🌻'), T('strawberry', 'strawberries', '🍓')], extra: n => `The garden has ${n} rows.` },
  { name: 'Treasure Hunt', place: 'on Treasure Island', items: [T('gold coin', 'gold coins', '🪙'), T('gem', 'gems', '💎'), T('map piece', 'map pieces', '🗺️')], extra: n => `The island is ${n} miles from shore.` },
  { name: 'Market Day', place: 'at the market', items: [T('apple', 'apples', '🍎'), T('pear', 'pears', '🍐'), T('lemon', 'lemons', '🍋')], extra: n => `The market opens at ${n} o'clock.` },
  { name: 'Sports Day', place: 'at sports day', items: [T('soccer ball', 'soccer balls', '⚽'), T('medal', 'medals', '🏅'), T('basketball', 'basketballs', '🏀')], extra: n => `Each team has ${n} players.` },
  { name: 'Nature Walk', place: 'on the nature trail', items: [T('leaf', 'leaves', '🍁'), T('feather', 'feathers', '🪶'), T('rock', 'rocks', '🪨')], extra: n => `The trail is ${n} miles long.` },
  { name: 'Robot Lab', place: 'in the robot lab', items: [T('battery', 'batteries', '🔋'), T('gear', 'gears', '⚙️'), T('wheel', 'wheels', '🛞')], extra: n => `The robot is ${n} inches tall.` },
  { name: 'Birthday Party', place: 'at the birthday party', items: [T('balloon', 'balloons', '🎈'), T('cupcake', 'cupcakes', '🧁'), T('present', 'presents', '🎁')], extra: n => `The party starts at ${n} o'clock.` },
  { name: 'Picnic', place: 'at the picnic', items: [T('sandwich', 'sandwiches', '🥪'), T('juice box', 'juice boxes', '🧃'), T('grape', 'grapes', '🍇')], extra: n => `The park is ${n} blocks away.` },
  { name: 'Library', place: 'in the library', items: [T('book', 'books', '📘'), T('bookmark', 'bookmarks', '🔖'), T('crayon', 'crayons', '🖍️')], extra: n => `The library has ${n} tables.` },
];
const NAMES = ['Ava', 'Leo', 'Mia', 'Noah', 'Zara', 'Kai', 'Lina', 'Omar', 'Sofia', 'Ben', 'Priya', 'Mateo', 'Amara', 'Jin', 'Ella', 'Sam', 'Nia', 'Diego', 'Hana', 'Theo'];

const nI = (n: number, it: Item) => `${n} ${n === 1 ? it.one : it.many}`;
const X = E.X;

interface Built {
  structure: StoryStructure;
  text: string;
  question: string;
  expr: Expr;
  givens: number[];
  /** Equations (with ?) a child might choose as a plan; correct ⇔ unique solution equals the answer. */
  plans: { label: string; claim: Claim }[];
  /** What are we finding? First = correct. */
  find: [string, string, string];
  reasoning: string;
  visual?: VisualSpec;
  /** Hints about the situation (never keyword rules). */
  hints: [string, string];
}

type Builder = (rng: Rng, ctx: { A: string; B: string; it: Item; theme: Theme }, diff: Difficulty, level: LevelId) => Built | null;

const ranges: Record<LevelId, [number, number]> = { 1: [1, 10], 2: [2, 20], 3: [10, 99], 4: [10, 200] };
function pickAB(rng: Rng, level: LevelId, needSumMax: number) {
  const [lo, hi] = ranges[level];
  const a = rng.int(Math.max(lo, 1), Math.min(hi, needSumMax - 1));
  const b = rng.int(1, Math.max(1, Math.min(needSumMax - a, level >= 3 ? 60 : hi)));
  return [a, b] as const;
}

const B: Record<string, Builder> = {
  joinResult(rng, { A, it }, _d, level) {
    const [a, b] = pickAB(rng, level, level === 1 ? 10 : level === 2 ? 20 : 100);
    return {
      structure: 'join-result', text: `${A} has ${nI(a, it)}. Then ${A} gets ${b} more.`, question: `How many ${it.many} does ${A} have now?`,
      expr: E.add(a, b), givens: [a, b],
      plans: [{ label: `${a} + ${b} = ?`, claim: { left: E.add(a, b), rel: '=', right: X } }, { label: `${a} − ${b} = ?`, claim: { left: E.sub(a, b), rel: '=', right: X } }, { label: `${b} − ? = ${a}`, claim: { left: E.sub(b, X), rel: '=', right: a } }],
      find: [`How many ${it.many} ${A} has after getting more`, `How many ${it.many} ${A} had at the start`, `How many ${it.many} ${A} gave away`],
      reasoning: `We know the start (${a}) and how many were added (${b}). The total is unknown, so we join them.`,
      visual: a + b <= 12 ? { kind: 'twoGroups', e1: it.e, n1: a, e2: it.e, n2: b, label: it.many } : undefined,
      hints: [`What do you know at the start? What happens next?`, `${A} starts with ${a}, then gets ${b} more. Is the final amount more or less than ${a}?`],
    };
  },
  joinChange(rng, { A, B: Bn, it }, _d, level) {
    const [a, b] = pickAB(rng, level, level <= 2 ? 20 : 100);
    const c = a + b;
    return {
      structure: 'join-change', text: `${A} has ${nI(a, it)}. ${Bn} gives ${A} some more. Now ${A} has ${c}.`, question: `How many ${it.many} did ${Bn} give ${A}?`,
      expr: E.sub(c, a), givens: [a, c],
      plans: [{ label: `${a} + ? = ${c}`, claim: { left: E.add(a, X), rel: '=', right: c } }, { label: `${c} − ${a} = ?`, claim: { left: E.sub(c, a), rel: '=', right: X } }, { label: `${a} + ${c} = ?`, claim: { left: E.add(a, c), rel: '=', right: X } }],
      find: [`How many ${it.many} ${Bn} gave`, `How many ${it.many} ${A} has now`, `How many ${it.many} ${A} had at the start`],
      reasoning: `We know the start (${a}) and the end (${c}). The missing part is the change: ${a} + ? = ${c}.`,
      hints: [`Do we know the start? Do we know the end? What is missing?`, `${A} went from ${a} to ${c}. How many were added in between?`],
    };
  },
  joinStart(rng, { A, it }, _d, level) {
    const [a, b] = pickAB(rng, level, level <= 2 ? 20 : 100);
    const c = a + b;
    return {
      structure: 'join-start', text: `${A} had some ${it.many}. ${A} found ${b} more. Now ${A} has ${c}.`, question: `How many ${it.many} did ${A} have at the start?`,
      expr: E.sub(c, b), givens: [b, c],
      plans: [{ label: `? + ${b} = ${c}`, claim: { left: E.add(X, b), rel: '=', right: c } }, { label: `${c} − ${b} = ?`, claim: { left: E.sub(c, b), rel: '=', right: X } }, { label: `${c} + ${b} = ?`, claim: { left: E.add(c, b), rel: '=', right: X } }],
      find: [`How many ${it.many} ${A} had at the start`, `How many ${it.many} ${A} found`, `How many ${it.many} ${A} has now`],
      reasoning: `The start is unknown. Start + ${b} = ${c}, so the start is ${c} − ${b}.`,
      hints: ['Which number is missing: the start, the change, or the end?', `Something plus ${b} makes ${c}. What is the something?`],
    };
  },
  separateResult(rng, { A, B: Bn, it }, _d, level) {
    const [lo, hi] = ranges[level];
    const a = rng.int(Math.max(lo, 3), level === 1 ? 10 : hi), b = rng.int(1, a - 1);
    return {
      structure: 'separate-result', text: `${A} has ${nI(a, it)}. ${A} gives ${b} to ${Bn}.`, question: `How many ${it.many} does ${A} have left?`,
      expr: E.sub(a, b), givens: [a, b],
      plans: [{ label: `${a} − ${b} = ?`, claim: { left: E.sub(a, b), rel: '=', right: X } }, { label: `${b} + ? = ${a}`, claim: { left: E.add(b, X), rel: '=', right: a } }, { label: `${a} + ${b} = ?`, claim: { left: E.add(a, b), rel: '=', right: X } }],
      find: [`How many ${it.many} ${A} still has`, `How many ${it.many} ${A} gave to ${Bn}`, `How many ${it.many} ${A} had at the start`],
      reasoning: `${A} starts with ${a} and ${b} leave. The amount left is unknown.`,
      visual: a <= 12 ? { kind: 'counters', emoji: it.e, count: a, cross: b, label: it.many } : undefined,
      hints: ['Start with what you know. What happens to some of them?', `${A} started with ${a}. Will ${A} end up with more or fewer?`],
    };
  },
  separateChange(rng, { A, B: Bn, it }, _d, level) {
    const [lo, hi] = ranges[level];
    const a = rng.int(Math.max(lo, 5), level <= 2 ? 20 : hi), c = rng.int(1, a - 1);
    return {
      structure: 'separate-change', text: `${A} had ${nI(a, it)}. After giving some to ${Bn}, ${A} has ${c} left.`, question: `How many ${it.many} did ${A} give to ${Bn}?`,
      expr: E.sub(a, c), givens: [a, c],
      plans: [{ label: `${a} − ? = ${c}`, claim: { left: E.sub(a, X), rel: '=', right: c } }, { label: `${c} + ? = ${a}`, claim: { left: E.add(c, X), rel: '=', right: a } }, { label: `${a} + ${c} = ?`, claim: { left: E.add(a, c), rel: '=', right: X } }],
      find: [`How many ${it.many} ${A} gave away`, `How many ${it.many} ${A} has left`, `How many ${it.many} ${A} had at the start`],
      reasoning: `We know the start (${a}) and what is left (${c}). The missing part is how many were given.`,
      hints: ['Which do you know: the start, the change, or the end?', `${A} went from ${a} down to ${c}. How many went away?`],
    };
  },
  partWhole(rng, { A, B: Bn, it }, _d, level) {
    const [a, b] = pickAB(rng, level, level === 1 ? 10 : level === 2 ? 20 : 100);
    return {
      structure: 'part-part-whole', text: `${A} has ${nI(a, it)}. ${Bn} has ${nI(b, it)}.`, question: `How many ${it.many} do they have in all?`,
      expr: E.add(a, b), givens: [a, b],
      plans: [{ label: `${a} + ${b} = ?`, claim: { left: E.add(a, b), rel: '=', right: X } }, { label: `? − ${b} = ${a}`, claim: { left: E.sub(X, b), rel: '=', right: a } }, { label: `${Math.max(a, b)} − ${Math.min(a, b)} = ?`, claim: { left: E.sub(Math.max(a, b), Math.min(a, b)), rel: '=', right: X } }],
      find: [`How many ${it.many} the two friends have together`, `How many more ${it.many} one friend has`, `How many ${it.many} ${A} has`],
      reasoning: `Both parts are known (${a} and ${b}). The whole is unknown.`,
      visual: a + b <= 12 ? { kind: 'twoGroups', e1: it.e, n1: a, e2: it.e, n2: b, label: it.many } : undefined,
      hints: ['There are two groups. Are we finding one group, or both together?', `${A}'s group and ${Bn}'s group together make the whole.`],
    };
  },
  compareDiff(rng, { A, B: Bn, it }, _d, level) {
    const [lo, hi] = ranges[level];
    let a = rng.int(Math.max(lo, 3), level === 1 ? 10 : hi), b = rng.int(1, a - 1);
    if (a === b) a += 1;
    const fewer = level >= 2 && rng.bool(0.4);
    return {
      structure: 'compare-difference', text: `${A} has ${nI(a, it)}. ${Bn} has ${nI(b, it)}.`,
      question: fewer ? `How many fewer ${it.many} does ${Bn} have than ${A}?` : `How many more ${it.many} does ${A} have than ${Bn}?`,
      expr: E.sub(a, b), givens: [a, b],
      plans: [{ label: `${a} − ${b} = ?`, claim: { left: E.sub(a, b), rel: '=', right: X } }, { label: `${b} + ? = ${a}`, claim: { left: E.add(b, X), rel: '=', right: a } }, { label: `${a} + ${b} = ?`, claim: { left: E.add(a, b), rel: '=', right: X } }],
      find: [`The difference between the two amounts`, `How many ${it.many} they have together`, `How many ${it.many} ${A} has`],
      reasoning: `We are comparing ${a} and ${b}. Matching them up, the extra part is the difference.`,
      visual: a <= 14 ? { kind: 'compareBars', rows: [{ label: A, emoji: it.e, n: a }, { label: Bn, emoji: it.e, n: b }] } : undefined,
      hints: ['Picture both amounts lined up side by side.', `Match ${b} of ${A}'s with ${Bn}'s ${b}. How many of ${A}'s have no partner?`],
    };
  },
  compareLarger(rng, { A, B: Bn, it }, _d, level) {
    const [lo, hi] = ranges[level];
    const b = rng.int(Math.max(lo, 2), Math.floor((level <= 2 ? 20 : hi) / 2)), d = rng.int(1, Math.max(1, Math.floor((level <= 2 ? 20 : hi) / 2) - 1));
    return {
      structure: 'compare-larger', text: `${Bn} has ${nI(b, it)}. ${A} has ${d} more ${it.many} than ${Bn}.`, question: `How many ${it.many} does ${A} have?`,
      expr: E.add(b, d), givens: [b, d],
      plans: [{ label: `${b} + ${d} = ?`, claim: { left: E.add(b, d), rel: '=', right: X } }, { label: `${b} − ${d} = ?`, claim: { left: E.sub(b, d), rel: '=', right: X } }, { label: `? + ${d} = ${b}`, claim: { left: E.add(X, d), rel: '=', right: b } }],
      find: [`How many ${it.many} ${A} has`, `How many ${it.many} ${Bn} has`, `How many ${it.many} they have together`],
      reasoning: `${A} has the same as ${Bn} (${b}) plus ${d} extra.`,
      hints: [`Who has more, ${A} or ${Bn}?`, `${A} has everything ${Bn} has, and ${d} extra.`],
    };
  },
  compareSmallerTricky(rng, { A, B: Bn, it }, _d, level) {
    const [lo, hi] = ranges[level];
    const a = rng.int(Math.max(lo, 6), level <= 2 ? 20 : hi), d = rng.int(1, a - 2);
    return {
      structure: 'compare-smaller', text: `${A} has ${nI(a, it)}. That is ${d} more than ${Bn} has.`, question: `How many ${it.many} does ${Bn} have?`,
      expr: E.sub(a, d), givens: [a, d],
      plans: [{ label: `${a} − ${d} = ?`, claim: { left: E.sub(a, d), rel: '=', right: X } }, { label: `? + ${d} = ${a}`, claim: { left: E.add(X, d), rel: '=', right: a } }, { label: `${a} + ${d} = ?`, claim: { left: E.add(a, d), rel: '=', right: X } }],
      find: [`How many ${it.many} ${Bn} has`, `How many ${it.many} ${A} has`, `How many more ${it.many} ${A} has`],
      reasoning: `${A} has more than ${Bn}. So ${Bn} has ${d} fewer than ${a}. (The word "more" is in the story, but this time we subtract!)`,
      hints: [`Who has more? Read carefully: "That is ${d} more than ${Bn} has."`, `${A} has more, so ${Bn} has less than ${a}.`],
    };
  },
  equalGroups(rng, { A, it }, diff) {
    const g = rng.int(2, diff === 1 ? 5 : 9), p = rng.int(2, diff === 1 ? 5 : 10);
    return {
      structure: 'equal-groups', text: `${A} has ${g} bags. Each bag has ${nI(p, it)}.`, question: `How many ${it.many} are there in all?`,
      expr: E.mul(g, p), givens: [g, p],
      plans: [{ label: `${g} × ${p} = ?`, claim: { left: E.mul(g, p), rel: '=', right: X } }, { label: `${g} + ${p} = ?`, claim: { left: E.add(g, p), rel: '=', right: X } }, { label: `${g} × ${p} × 2 = ?`, claim: { left: E.mul(E.mul(g, p), 2), rel: '=', right: X } }],
      find: [`How many ${it.many} in all the bags together`, `How many bags there are`, `How many ${it.many} are in one bag`],
      reasoning: `There are ${g} equal groups of ${p}. Equal groups can be multiplied: ${g} × ${p}.`,
      visual: g * p <= 30 ? { kind: 'divgroups', groups: g, per: p, emoji: it.e } : undefined,
      hints: ['Are all the groups the same size?', `${g} groups, ${p} in each group. Skip count by ${p}s.`],
    };
  },
  share(rng, { A, it }, diff) {
    const g = rng.int(2, diff === 1 ? 4 : 8), per = rng.int(2, diff === 1 ? 5 : 9), t = g * per;
    return {
      structure: 'share', text: `${A} puts ${nI(t, it)} into ${g} bags. Each bag gets the same number.`, question: `How many ${it.many} go in each bag?`,
      expr: E.div(t, g), givens: [t, g],
      plans: [{ label: `${t} ÷ ${g} = ?`, claim: { left: E.div(t, g), rel: '=', right: X } }, { label: `${g} × ? = ${t}`, claim: { left: E.mul(g, X), rel: '=', right: t } }, { label: `${t} − ${g} = ?`, claim: { left: E.sub(t, g), rel: '=', right: X } }],
      find: [`How many ${it.many} go in one bag`, `How many bags there are`, `How many ${it.many} there are in all`],
      reasoning: `The total (${t}) is shared into ${g} equal groups. The size of each group is unknown.`,
      visual: { kind: 'divgroups', groups: g, per, emoji: it.e, mystery: true },
      hints: ['Do we know the total? Do we know how many groups?', `Deal ${t} out into ${g} bags, one at a time.`],
    };
  },
  measureGroups(rng, { A, it }, diff) {
    const p = rng.int(2, diff === 1 ? 5 : 10), g = rng.int(2, diff === 1 ? 5 : 9), t = g * p;
    return {
      structure: 'measure-groups', text: `${A} has ${nI(t, it)}. Each box holds ${p}.`, question: `How many boxes can ${A} fill?`,
      expr: E.div(t, p), givens: [t, p],
      plans: [{ label: `${t} ÷ ${p} = ?`, claim: { left: E.div(t, p), rel: '=', right: X } }, { label: `? × ${p} = ${t}`, claim: { left: E.mul(X, p), rel: '=', right: t } }, { label: `${t} × ${p} = ?`, claim: { left: E.mul(t, p), rel: '=', right: X } }],
      find: ['How many boxes can be filled', `How many ${it.many} fit in one box`, `How many ${it.many} there are`],
      reasoning: `We know the total (${t}) and the size of each group (${p}). The number of groups is unknown.`,
      hints: ['What do we know: the total, the group size, or the number of groups?', `Make groups of ${p} until you reach ${t}.`],
    };
  },
  twoStepAddSub(rng, { A, B: Bn, it }) {
    const a = rng.int(10, 50), b = rng.int(5, 30), c = rng.int(2, a + b - 1);
    return {
      structure: 'two-step', text: `${A} has ${nI(a, it)}. ${A} finds ${b} more. Then ${A} gives ${c} to ${Bn}.`, question: `How many ${it.many} does ${A} have now?`,
      expr: E.sub(E.add(a, b), c), givens: [a, b, c],
      plans: [{ label: `${a} + ${b} − ${c} = ?`, claim: { left: E.sub(E.add(a, b), c), rel: '=', right: X } }, { label: `${a} + ${b} + ${c} = ?`, claim: { left: E.add(E.add(a, b), c), rel: '=', right: X } }, { label: `${a} − ${b} + ${c} = ?`, claim: { left: E.add(E.sub(a, b), c), rel: '=', right: X } }],
      find: [`How many ${it.many} ${A} has at the end`, `How many ${it.many} ${A} found`, `How many ${it.many} ${Bn} has`],
      reasoning: `Step 1: ${a} + ${b} = ${a + b} after finding more. Step 2: ${a + b} − ${c} after giving some away.`,
      hints: ['There are two things that happen. Do them in order.', `First: ${a} and ${b} more. Then ${c} go to ${Bn}.`],
    };
  },
  twoStepCompare(rng, { A, B: Bn, it }) {
    const a = rng.int(10, 40), d = rng.int(3, 20);
    return {
      structure: 'two-step', text: `${A} has ${nI(a, it)}. ${Bn} has ${d} more ${it.many} than ${A}.`, question: `How many ${it.many} do they have together?`,
      expr: E.add(a, E.add(a, d)), givens: [a, d],
      plans: [{ label: `${a} + (${a} + ${d}) = ?`, claim: { left: E.add(a, E.add(a, d)), rel: '=', right: X } }, { label: `${a} + ${d} = ?`, claim: { left: E.add(a, d), rel: '=', right: X } }, { label: `${a} + (${a} − ${d}) = ?`, claim: { left: E.add(a, E.sub(a, d)), rel: '=', right: X } }],
      find: [`How many ${it.many} the two have together`, `How many ${it.many} ${Bn} has`, `How many more ${it.many} ${Bn} has`],
      reasoning: `Step 1: ${Bn} has ${a} + ${d} = ${a + d}. Step 2: together, ${a} + ${a + d}.`,
      hints: ['Do you know how many each person has?', `First find ${Bn}'s amount. Then put both together.`],
    };
  },
  multiStep(rng, { A, B: Bn, it }) {
    const g = rng.int(3, 9), p = rng.int(3, 9), kind = rng.int(0, 2);
    if (kind === 0) {
      const c = rng.int(2, g * p - 1);
      return {
        structure: 'multi-step', text: `${A} buys ${g} packs of ${it.many}. Each pack has ${p}. ${A} gives ${c} to ${Bn}.`, question: `How many ${it.many} does ${A} have left?`,
        expr: E.sub(E.mul(g, p), c), givens: [g, p, c],
        plans: [{ label: `${g} × ${p} − ${c} = ?`, claim: { left: E.sub(E.mul(g, p), c), rel: '=', right: X } }, { label: `${g} + ${p} − ${c} = ?`, claim: { left: E.sub(E.add(g, p), c), rel: '=', right: X } }, { label: `${g} × ${p} + ${c} = ?`, claim: { left: E.add(E.mul(g, p), c), rel: '=', right: X } }],
        find: [`How many ${it.many} ${A} has after giving some away`, `How many ${it.many} are in one pack`, `How many ${it.many} ${Bn} gets`],
        reasoning: `Step 1: ${g} × ${p} = ${g * p} in all the packs. Step 2: ${g * p} − ${c}.`,
        hints: ['First find how many in all the packs.', `${g} packs of ${p}. Then ${c} are given away.`],
      };
    }
    if (kind === 1) {
      const ks = [2, 3, 4, 6].filter(x => (g * p) % x === 0 && x !== g);
      if (!ks.length) return null;
      const k = rng.pick(ks);
      return {
        structure: 'multi-step', text: `${A} has ${g} trays with ${nI(p, it)} on each tray. ${A} shares them equally with ${k} tables.`, question: `How many ${it.many} does each table get?`,
        expr: E.div(E.mul(g, p), k), givens: [g, p, k],
        plans: [{ label: `${g} × ${p} ÷ ${k} = ?`, claim: { left: E.div(E.mul(g, p), k), rel: '=', right: X } }, { label: `${g} + ${p} ÷ ${k} = ?`, claim: { left: E.add(g, { op: '÷', a: p, b: k }), rel: '=', right: X } }, { label: `${g} × ${p} × ${k} = ?`, claim: { left: E.mul(E.mul(g, p), k), rel: '=', right: X } }],
        find: [`How many ${it.many} one table gets`, `How many ${it.many} there are in all`, 'How many trays there are'],
        reasoning: `Step 1: ${g} × ${p} = ${g * p} in all. Step 2: ${g * p} ÷ ${k} = ${(g * p) / k} for each table.`,
        hints: ['First: how many in all?', `Then share ${g * p} equally among ${k} tables.`],
      };
    }
    const c = rng.int(2, 9);
    return {
      structure: 'multi-step', text: `${A} has ${g} boxes with ${nI(p, it)} in each box. ${A} also has ${nI(c, it)} in a bag.`, question: `How many ${it.many} does ${A} have in all?`,
      expr: E.add(E.mul(g, p), c), givens: [g, p, c],
      plans: [{ label: `${g} × ${p} + ${c} = ?`, claim: { left: E.add(E.mul(g, p), c), rel: '=', right: X } }, { label: `${g} + ${p} + ${c} = ?`, claim: { left: E.add(E.add(g, p), c), rel: '=', right: X } }, { label: `${g} × (${p} + ${c}) = ?`, claim: { left: E.mul(g, E.add(p, c)), rel: '=', right: X } }],
      find: [`How many ${it.many} ${A} has altogether`, `How many ${it.many} are in one box`, `How many ${it.many} are in the bag`],
      reasoning: `Step 1: ${g} × ${p} = ${g * p} in the boxes. Step 2: add the ${c} in the bag.`,
      hints: ['Find the boxes first, then the bag.', `${g} boxes of ${p}, plus ${c} more.`],
    };
  },
};

const BY_LEVEL: Record<LevelId, { b: keyof typeof B; minDiff: Difficulty }[]> = {
  1: [{ b: 'joinResult', minDiff: 1 }, { b: 'separateResult', minDiff: 1 }, { b: 'partWhole', minDiff: 2 }, { b: 'compareDiff', minDiff: 3 }],
  2: [{ b: 'joinResult', minDiff: 1 }, { b: 'separateResult', minDiff: 1 }, { b: 'partWhole', minDiff: 1 }, { b: 'joinChange', minDiff: 2 }, { b: 'compareDiff', minDiff: 2 }, { b: 'compareLarger', minDiff: 3 }, { b: 'separateChange', minDiff: 3 }],
  3: [{ b: 'joinChange', minDiff: 1 }, { b: 'separateResult', minDiff: 1 }, { b: 'compareDiff', minDiff: 1 }, { b: 'joinStart', minDiff: 2 }, { b: 'compareSmallerTricky', minDiff: 2 }, { b: 'twoStepAddSub', minDiff: 2 }, { b: 'twoStepCompare', minDiff: 3 }, { b: 'separateChange', minDiff: 2 }],
  4: [{ b: 'equalGroups', minDiff: 1 }, { b: 'share', minDiff: 1 }, { b: 'measureGroups', minDiff: 2 }, { b: 'multiStep', minDiff: 2 }, { b: 'twoStepAddSub', minDiff: 1 }, { b: 'compareSmallerTricky', minDiff: 2 }, { b: 'twoStepCompare', minDiff: 3 }],
};

export function storyGen(level: LevelId): GenDef {
  return {
    id: `story.level${level}`, version: 2, mode: 'story',
    gen(rng, diff) {
      for (let attempt = 0; attempt < 30; attempt++) {
        const theme = rng.pick(THEMES);
        const it = rng.pick(theme.items);
        const [A, Bn] = rng.sample(NAMES, 2) as [string, string];
        const choices = BY_LEVEL[level].filter(x => x.minDiff <= diff);
        const which = rng.pick(choices).b;
        const built = B[which]!(rng, { A, B: Bn, it, theme }, diff, level);
        if (!built) continue;
        let ans: number;
        try { const v = evaluate(built.expr); if (v.d !== 1 || v.n < 0) continue; ans = v.n; } catch { continue; }
        // Optional irrelevant information (Levels 2+ at higher difficulty): must be clearly unrelated.
        let irrelevant: number[] = [];
        let text = `${built.text}`;
        if (level >= 2 && diff >= 2 && rng.bool(level === 2 ? 0.25 : 0.4)) {
          let n = rng.int(2, 12);
          while (built.givens.includes(n) || n === ans) n = rng.int(2, 12);
          text = `${text} ${theme.extra(n)}`;
          irrelevant = [n];
        }
        const story = `${theme.name} — ${capFirst(theme.place)}: ${text}`;
        return finalizeStory(rng, level, diff, { ...built, text: story }, ans, irrelevant, it);
      }
      throw new Error(`story.level${level}: no valid story built`);
    },
  };
}
const capFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function finalizeStory(rng: Rng, level: LevelId, _diff: Difficulty, b: Built, ans: number, irrelevant: number[], it: Item): Draft {
  const plans = b.plans.map(p => ({ label: p.label, value: p.label, claim: p.claim } as OptSeed));
  const correctPlans = plans.filter(p => solveUnique(p.claim!) === ans);
  const wrongPlans = plans.filter(p => solveUnique(p.claim!) !== ans);
  const plan = buildChoice(rng, correctPlans, wrongPlans, plans.length, 'list');
  const understand = buildChoice(rng, [{ label: b.find[0], value: 'unknown', truth: true }], [{ label: b.find[1], value: 'given-1', truth: false }, { label: b.find[2], value: 'given-2', truth: false }], 3, 'list');
  const sym = show(b.expr);
  const explainOpts: OptSeed[] = [
    { label: b.reasoning, value: 'reason', claim: { left: b.expr, rel: '=', right: ans } },
    { label: 'I looked for a key word and did what it says, without thinking about the story.', value: 'keyword', truth: false },
    { label: `I used all the numbers I saw: ${[...b.givens, ...irrelevant].join(' + ')} = ${[...b.givens, ...irrelevant].reduce((s, x) => s + x, 0)}.`, value: 'all', claim: { left: E.sum(...[...b.givens, ...irrelevant]), rel: '=', right: ans } },
  ];
  const explainOk = explainOpts.filter(o => !(o.value === 'all' && [...b.givens, ...irrelevant].reduce((s, x) => s + x, 0) === ans));
  const explain = buildChoice(rng, [explainOk[0]!], explainOk.slice(1), 3, 'list');
  const useNumeric = level >= 2;
  const interaction = useNumeric
    ? numeric(ans, 0, 2000, it.many)
    : numChoice(rng, ans, { min: 0, max: 20, misconceptions: numericDistractors(rng, ans, { min: 0, max: 20, misconceptions: [b.givens[0]! + b.givens[1]!, Math.abs(b.givens[0]! - b.givens[1]!)], spread: 2 }) });
  return {
    badge: `📖 Math Story Adventure`, story: b.text, prompt: b.question,
    ...(b.visual ? { visual: b.visual } : {}),
    interaction,
    hints: [...b.hints, irrelevant.length ? `Careful — not every number in the story is needed. Which numbers tell about the ${it.many}?` : `Plan: ${correctPlans[0]!.label}`],
    explanation: `${b.reasoning} ${sym} = ${ans}. The answer is ${ans} ${ans === 1 ? it.one : it.many}.`,
    steps: [`Understand: ${b.find[0]}.`, `Plan: ${correctPlans.map(p => p.label).join('  or  ')}`, `Solve: ${sym} = ${ans}`, `Check: does ${ans} make sense in the story?`],
    math: { kind: 'story', structure: b.structure, expr: b.expr, givens: b.givens, irrelevant, sufficient: true },
    signature: `story:${b.structure}:${b.givens.join(',')}`, answerText: String(ans),
    readingDemand: level === 1 ? 'early' : level === 2 ? 'developing' : 'fluent',
    reasoningObjective: 'Represent a story situation with an equation, solve it, and check that the answer makes sense.',
    phases: {
      understand: { prompt: 'What do we need to find?', interaction: understand },
      plan: { prompt: correctPlans.length > 1 ? 'Which plan fits the story? (More than one plan can work!)' : 'Which plan fits the story?', interaction: plan },
      explain: { prompt: 'Which explanation fits your thinking best?', interaction: explain },
      check: `Check: ${sym} = ${ans}. ${checkSentence(b.structure, ans, b.givens)}`,
    },
  };
}

function checkSentence(s: StoryStructure, ans: number, g: number[]): string {
  switch (s) {
    case 'join-result': case 'part-part-whole': return `${ans} is more than both ${g[0]} and ${g[1]}, which makes sense for putting groups together.`;
    case 'separate-result': return `${ans} is less than ${g[0]}, which makes sense because some were given away.`;
    case 'join-change': case 'separate-change': case 'join-start': return `Put your answer back into the story to check that the numbers work.`;
    case 'compare-difference': return `Add ${ans} to the smaller amount: it should make the larger amount.`;
    default: return 'Read the story again with your answer. Does it make sense?';
  }
}

function solveUnique(c: Claim): number | null {
  const sols: number[] = [];
  for (let v = 0; v <= 5000 && sols.length < 2; v++) {
    try { const l = evaluate(c.left, { n: v, d: 1 }), r = evaluate(c.right, { n: v, d: 1 }); if (l.n * r.d === r.n * l.d) sols.push(v); } catch { /* skip */ }
  }
  return sols.length === 1 ? sols[0]! : null;
}

export const storyL1 = storyGen(1);
export const storyL2 = storyGen(2);
export const storyL3 = storyGen(3);
export const storyL4 = storyGen(4);
