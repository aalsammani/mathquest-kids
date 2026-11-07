/** Geometry, position, patterns, sorting. */
import { buildChoice, numOpt } from '../../core/options';
import type { ShapeCategory, ShapeName, ShapeProperty } from '../../core/types';
import { byDiff, numChoice, numeric, textChoice, type GenDef } from '../genkit';

/** Generator-side shape facts (the validator keeps its own independent table). */
const SIDES: Record<ShapeName, number> = { circle: 0, oval: 0, triangle: 3, square: 4, rectangle: 4, rhombus: 4, trapezoid: 4, pentagon: 5, hexagon: 6, octagon: 8 };
/** Names that would ALSO be mathematically correct for the shape (must never be offered as distractors). */
const ALSO_TRUE: Partial<Record<ShapeName, ShapeName[]>> = {
  square: ['rectangle', 'rhombus', 'trapezoid'],
  rectangle: ['trapezoid'],
  rhombus: ['trapezoid'],
  circle: ['oval'],
};
const an = (w: string) => (/^[aeiou]/i.test(w) ? `an ${w}` : `a ${w}`);
const DESCRIBE: Record<ShapeName, string> = {
  circle: 'It is perfectly round, with no straight sides and no corners.',
  oval: 'It is round but stretched, like an egg, with no corners.',
  triangle: 'It has 3 straight sides and 3 corners.',
  square: 'It has 4 equal sides and 4 square corners.',
  rectangle: 'It has 4 sides and 4 square corners. Opposite sides are equal.',
  rhombus: 'It has 4 equal sides, but its corners are not square corners.',
  trapezoid: 'It has 4 sides, and only one pair of sides is parallel.',
  pentagon: 'It has 5 straight sides and 5 corners.',
  hexagon: 'It has 6 straight sides and 6 corners.',
  octagon: 'It has 8 straight sides and 8 corners.',
};

function safeDistractors(shape: ShapeName, pool: ShapeName[]): ShapeName[] {
  const banned = new Set<ShapeName>([shape, ...(ALSO_TRUE[shape] ?? [])]);
  // A circle is also (mathematically) a special oval, and squares/rectangles/rhombuses are trapezoids under the
  // inclusive definition — so never offer a name that could be correct.
  return pool.filter(p => !banned.has(p) && !(ALSO_TRUE[p] ?? []).includes(shape));
}

export const shapeName: GenDef = {
  id: 'shapes.name', version: 3, mode: 'solve',
  gen(rng, diff) {
    const pool: ShapeName[] = byDiff(diff,
      ['circle', 'square', 'triangle', 'rectangle'] as ShapeName[],
      ['circle', 'square', 'triangle', 'rectangle', 'oval', 'hexagon'] as ShapeName[],
      ['circle', 'square', 'triangle', 'rectangle', 'oval', 'hexagon', 'rhombus', 'pentagon', 'trapezoid'] as ShapeName[]);
    const s = rng.pick(pool);
    const rotate = s === 'circle' ? 0 : rng.pick([0, 0, 15, 30, 45, 90, 180]);
    return {
      badge: '🔷 Shapes', prompt: 'What shape is this?',
      visual: { kind: 'shape', name: s, rotate },
      interaction: textChoice(rng, s, rng.shuffle(safeDistractors(s, pool))),
      hints: ['Count the sides and the corners.', DESCRIBE[s]],
      explanation: `This is ${an(s)}. ${DESCRIBE[s]}${rotate ? ' Turning a shape does not change what it is.' : ''}`,
      steps: [`Sides: ${SIDES[s]}`, `Corners: ${SIDES[s]}`],
      math: { kind: 'shape', shape: s, ask: 'name' }, signature: `shape:${s}`, answerText: s, readingDemand: 'pre-reader',
    };
  },
};

export const shapeCorners: GenDef = {
  id: 'shapes.corners', version: 2, mode: 'solve',
  gen(rng, diff) {
    const pool: ShapeName[] = byDiff(diff, ['triangle', 'square', 'rectangle'] as ShapeName[], ['triangle', 'square', 'rectangle', 'hexagon', 'pentagon'] as ShapeName[], ['triangle', 'rhombus', 'trapezoid', 'pentagon', 'hexagon', 'octagon'] as ShapeName[]);
    const s = rng.pick(pool);
    const ask = rng.pick(['sides', 'vertices'] as const);
    const word = ask === 'sides' ? 'sides' : diff === 3 ? 'vertices (corners)' : 'corners';
    return {
      badge: '🔷 Shapes', prompt: `How many ${word} does this shape have?`,
      visual: { kind: 'shape', name: s, rotate: rng.pick([0, 20, 45, 90]) },
      interaction: numChoice(rng, SIDES[s], { min: 0, max: 10, misconceptions: [SIDES[s] - 1, SIDES[s] + 1, SIDES[s] + 2], spread: 2 }),
      hints: [ask === 'sides' ? 'Trace each straight side with your finger.' : 'A corner is where two sides meet.', 'Start at one place and count all the way around. Stop when you get back.'],
      explanation: `${an(s).replace(/^a/, 'A')} has ${SIDES[s]} sides and ${SIDES[s]} ${diff === 3 ? 'vertices' : 'corners'}.`,
      steps: [`Count around: ${SIDES[s]}`],
      math: { kind: 'shape', shape: s, ask: ask === 'sides' ? 'sides' : 'vertices' }, signature: `corners:${s},${ask}`, answerText: String(SIDES[s]), readingDemand: 'early',
    };
  },
};

const PROPS: { p: ShapeProperty; q: string; answer: ShapeName; pool: ShapeName[] }[] = [
  { p: 'three-sides', q: 'has exactly 3 sides', answer: 'triangle', pool: ['square', 'hexagon', 'pentagon', 'circle'] },
  { p: 'four-equal-sides-four-right-angles', q: 'has 4 equal sides AND 4 square corners', answer: 'square', pool: ['rectangle', 'trapezoid', 'triangle', 'pentagon'] },
  { p: 'five-sides', q: 'has exactly 5 sides', answer: 'pentagon', pool: ['hexagon', 'rhombus', 'triangle', 'octagon'] },
  { p: 'six-sides', q: 'has exactly 6 sides', answer: 'hexagon', pool: ['pentagon', 'square', 'triangle', 'octagon'] },
  { p: 'eight-sides', q: 'has exactly 8 sides', answer: 'octagon', pool: ['hexagon', 'pentagon', 'rectangle'] },
  { p: 'round-no-corners', q: 'is round with no straight sides', answer: 'circle', pool: ['square', 'triangle', 'hexagon', 'rectangle'] },
  { p: 'one-pair-parallel', q: 'has 4 sides with exactly one pair of parallel sides', answer: 'trapezoid', pool: ['rectangle', 'square', 'rhombus', 'pentagon'] },
];

export const shapeProperty: GenDef = {
  id: 'geo.property', version: 2, mode: 'solve',
  gen(rng, diff) {
    const set = diff === 1 ? PROPS.slice(0, 4) : PROPS;
    const pr = rng.pick(set);
    return {
      badge: '🔺 Shape clues', prompt: `Which shape ${pr.q}?`,
      interaction: textChoice(rng, pr.answer, rng.shuffle(pr.pool)),
      hints: ['Picture each shape. Count its sides.', `Check each choice against the clue: "${pr.q}."`],
      explanation: `${an(pr.answer).replace(/^a/, 'A')} ${pr.q}. ${DESCRIBE[pr.answer]}`,
      steps: [`Clue: ${pr.q}`, `Answer: ${pr.answer}`],
      math: { kind: 'shape-property', property: pr.p }, signature: `prop:${pr.p}`, answerText: pr.answer,
    };
  },
};

const FAMILY: { subject: ShapeName; category: ShapeCategory; why: string; wrongWhy: string }[] = [
  { subject: 'square', category: 'rectangle', why: 'A square has 4 sides and 4 square corners, so it is a special kind of rectangle.', wrongWhy: 'A rectangle must have two long sides and two short sides.' },
  { subject: 'square', category: 'rhombus', why: 'A square has 4 equal sides, so it is a special kind of rhombus.', wrongWhy: 'A rhombus can never have square corners.' },
  { subject: 'rectangle', category: 'square', why: 'A rectangle does not need 4 equal sides, so not every rectangle is a square.', wrongWhy: 'Every 4-sided shape is a square.' },
  { subject: 'rhombus', category: 'quadrilateral', why: 'A rhombus has 4 sides, and every 4-sided shape is a quadrilateral.', wrongWhy: 'Only squares are quadrilaterals.' },
  { subject: 'rhombus', category: 'rectangle', why: 'A rhombus does not need square corners, so not every rhombus is a rectangle.', wrongWhy: 'A rhombus has 4 sides, so it must be a rectangle.' },
  { subject: 'triangle', category: 'quadrilateral', why: 'A triangle has 3 sides, and a quadrilateral has 4.', wrongWhy: 'Triangles and quadrilaterals both have corners, so they are the same.' },
  { subject: 'trapezoid', category: 'quadrilateral', why: 'A trapezoid has 4 sides, so it is a quadrilateral.', wrongWhy: 'A trapezoid has slanted sides, so it cannot be a quadrilateral.' },
];

export const shapeFamily: GenDef = {
  id: 'geo.family', version: 1, mode: 'explain',
  gen(rng) {
    const f = rng.pick(FAMILY);
    const truth = ['square>rectangle', 'square>rhombus', 'rhombus>quadrilateral', 'trapezoid>quadrilateral'].includes(`${f.subject}>${f.category}`);
    const art = (w: string) => (/^[aeiou]/.test(w) ? 'an' : 'a');
    return {
      badge: '🔶 Shape families', prompt: 'True or false? Then pick the reason.',
      visual: { kind: 'shape', name: f.subject },
      interaction: {
        type: 'tf', statement: `Every ${f.subject} is ${art(f.category)} ${f.category}.`, truth,
        justifications: [
          { id: 'j1', label: f.why, value: 'why', truth: true },
          { id: 'j2', label: f.wrongWhy, value: 'wrong', truth: false },
          { id: 'j3', label: 'Shapes can only belong to one family.', value: 'one', truth: false },
        ],
        correctJust: ['j1'],
      },
      hints: [`List what every ${f.subject} must have.`, `Does every ${f.subject} have everything ${art(f.category)} ${f.category} needs?`],
      explanation: `${truth ? 'True' : 'False'}. ${f.why}`,
      steps: [`${f.subject}: ${DESCRIBE[f.subject]}`],
      math: { kind: 'shape-family', subject: f.subject, category: f.category }, signature: `fam:${f.subject}>${f.category}`, answerText: truth ? 'True' : 'False',
      reasoningObjective: 'Understand that shapes in one category can also belong to a larger category.',
    };
  },
};

export const positionWords: GenDef = {
  id: 'position.words', version: 2, mode: 'solve',
  gen(rng) {
    const target = rng.pick(['⭐', '🎈', '🦋']);
    const anchor = rng.pick(['🐶', '🐱', '🐸']);
    const names: Record<string, string> = { '⭐': 'star', '🎈': 'balloon', '🦋': 'butterfly', '🐶': 'dog', '🐱': 'cat', '🐸': 'frog' };
    const rel = rng.pick(['above', 'below', 'next to'] as const);
    const cells = Array<string>(9).fill('');
    cells[4] = anchor;
    const pos = rel === 'above' ? 1 : rel === 'below' ? 7 : rng.pick([3, 5]);
    cells[pos] = target;
    return {
      badge: '🧭 Position', prompt: `Where is the ${names[target]}? The ${names[target]} is ___ the ${names[anchor]}.`,
      visual: { kind: 'posgrid', cells, aria: `A grid with a ${names[target]} and a ${names[anchor]}` },
      interaction: textChoice(rng, rel, ['above', 'below', 'next to'].filter(x => x !== rel), 3, 'grid'),
      hints: ['Above means higher up. Below means lower down. Next to means right beside.', `Is the ${names[target]} higher, lower, or beside the ${names[anchor]}?`],
      explanation: `The ${names[target]} is ${rel} the ${names[anchor]}.`,
      steps: [rel],
      math: { kind: 'position', cells, target, anchor }, signature: `pos:${rel},${pos}`, answerText: rel, readingDemand: 'early',
    };
  },
};

/* ------------------------------------------------------------------ patterns */
export const patternNext: GenDef = {
  id: 'patterns.next', version: 2, mode: 'solve',
  gen(rng, diff) {
    const pairs = [['🔴', '🔵'], ['⭐', '🌙'], ['🐶', '🐱'], ['🌸', '🌻'], ['🍎', '🍌'], ['🟢', '🟣'], ['🔺', '🟦']];
    const [A, B] = rng.pick(pairs) as [string, string];
    const extra = rng.pick(['🧡', '🐰', '🌈', '🍇'].filter(x => x !== A && x !== B));
    const kind = byDiff(diff, 'AB', rng.pick(['AB', 'AAB', 'ABB']), rng.pick(['AAB', 'ABB', 'ABC', 'AABB']));
    const unit = kind === 'AB' ? [A, B] : kind === 'AAB' ? [A, A, B] : kind === 'ABB' ? [A, B, B] : kind === 'ABC' ? [A, B, extra] : [A, A, B, B];
    const reps = unit.length <= 2 ? 3 : 2;
    const seq: string[] = [];
    for (let r = 0; r < reps; r++) seq.push(...unit);
    const extraShown = rng.int(0, unit.length - 1);
    seq.push(...unit.slice(0, extraShown));
    const next = unit[seq.length % unit.length]!;
    seq.push('?');
    const opts = [...new Set([A, B, extra, '🍇', '🌈'])].filter(x => x !== next);
    return {
      badge: '🧩 Patterns', prompt: 'What comes next in the pattern?',
      visual: { kind: 'pattern', seq },
      interaction: buildChoice(rng, [{ label: next, value: next, aria: next }], opts.map(o => ({ label: o, value: o, aria: o })), 3, 'grid'),
      hints: ['Say the pattern out loud. Listen for the part that repeats.', `The part that repeats is ${unit.join(' ')}.`],
      explanation: `The pattern repeats ${unit.join(' ')}, so ${next} comes next.`,
      steps: [`Repeating part: ${unit.join(' ')}`],
      math: { kind: 'repeating-pattern', seq }, signature: `pat:${kind},${extraShown}`, answerText: next, readingDemand: 'pre-reader',
    };
  },
};

export const patternRule: GenDef = {
  id: 'patterns.rule', version: 1, mode: 'solve',
  gen(rng, diff) {
    const step = rng.int(2, byDiff(diff, 5, 9, 12));
    const grow = rng.bool(0.7);
    const start = grow ? rng.int(1, 20) : rng.int(step * 5 + 1, step * 5 + 30);
    const terms: (number | null)[] = [0, 1, 2, 3, 4].map(i => start + (grow ? i : -i) * step);
    const missing = diff === 3 ? rng.int(1, 4) : 4;
    const ans = terms[missing] as number;
    terms[missing] = null;
    return {
      badge: '🔮 Pattern rules', prompt: `Find the missing number: ${terms.map(t => (t === null ? '___' : t)).join(', ')}`,
      interaction: numeric(ans, 0, 500),
      hints: ['How much does the pattern change each step?', `The rule is "${grow ? 'add' : 'subtract'} ${step}."`],
      explanation: `Each step ${grow ? 'adds' : 'subtracts'} ${step}. The missing number is ${ans}.`,
      steps: [`Rule: ${grow ? '+' : '−'}${step}`, `Missing: ${ans}`],
      math: { kind: 'arith-sequence', terms }, signature: `rule:${start},${step},${grow},${missing}`, answerText: String(ans),
    };
  },
};

export const ruleMachine: GenDef = {
  id: 'patterns.machine', version: 1, mode: 'solve',
  gen(rng, diff) {
    const mult = rng.int(2, byDiff(diff, 3, 5, 9));
    const add = diff === 3 ? rng.int(1, 5) : 0;
    const f = (x: number) => x * mult + add;
    const ins = rng.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 3) as [number, number, number];
    const rule = add ? `× ${mult}, then + ${add}` : `× ${mult}`;
    return {
      badge: '🔮 Rule machine', prompt: `A machine has a secret rule. In ${ins[0]} → Out ${f(ins[0])}. In ${ins[1]} → Out ${f(ins[1])}. In ${ins[2]} → Out ?`,
      interaction: numChoice(rng, f(ins[2]), { min: 0, max: 200, misconceptions: [ins[2] + mult + add, f(ins[2]) + mult, f(ins[2]) - mult], spread: 3 }),
      hints: [`How do ${ins[0]} and ${f(ins[0])} relate? Check it with ${ins[1]} and ${f(ins[1])}.`, `The rule is ${rule}.`],
      explanation: add ? `The rule is ${rule}. ${ins[2]} × ${mult} = ${ins[2] * mult}, then ${ins[2] * mult} + ${add} = ${f(ins[2])}.` : `The rule is ${rule}. ${ins[2]} × ${mult} = ${f(ins[2])}.`,
      steps: [`Rule: ${rule}`, `${ins[2]} → ${f(ins[2])}`],
      math: { kind: 'function-table', pairs: [[ins[0], f(ins[0])], [ins[1], f(ins[1])]], query: ins[2] },
      signature: `mach:${mult},${add},${ins.join(',')}`, answerText: String(f(ins[2])),
    };
  },
};

/* ------------------------------------------------------------------ sorting */
const CATS = [
  { group: 'fruits', items: ['🍎', '🍌', '🍇', '🍓', '🍊'] },
  { group: 'animals', items: ['🐶', '🐱', '🐰', '🐸', '🐷'] },
  { group: 'vehicles', items: ['🚗', '🚌', '🚲', '✈️', '🚂'] },
  { group: 'clothes', items: ['👕', '👟', '🧢', '🧤', '🧦'] },
];
export const sortOdd: GenDef = {
  id: 'sort.odd-one-out', version: 2, mode: 'solve',
  gen(rng) {
    const [main, odd] = rng.sample(CATS, 2) as [typeof CATS[number], typeof CATS[number]];
    const three = rng.sample(main.items, 3);
    const oddItem = rng.pick(odd.items);
    const row = rng.shuffle([...three, oddItem]);
    return {
      badge: '🧺 Sorting', prompt: 'Which one does NOT belong?',
      visual: { kind: 'sortrow', items: row, aria: `Four pictures: ${row.join(', ')}` },
      interaction: buildChoice(rng, [{ label: oddItem, value: oddItem }], three.map(t => ({ label: t, value: t })), 4, 'grid', false),
      hints: [`Three of these are ${main.group}.`, `Which one is not one of the ${main.group}?`],
      explanation: `${three.join(' ')} are ${main.group}. ${oddItem} is one of the ${odd.group}, so it does not belong.`,
      steps: [`Group: ${main.group}`, `Different: ${oddItem}`],
      math: { kind: 'classify', items: row.map(r => ({ value: r, group: three.includes(r) ? main.group : odd.group })) },
      signature: `odd:${row.join('')}`, answerText: oddItem, readingDemand: 'pre-reader',
    };
  },
};

export { numOpt };
