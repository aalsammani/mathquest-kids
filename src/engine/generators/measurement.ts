/** Measurement, time, money, area/perimeter, data. */
import { E } from '../../core/expr';
import { buildChoice, numOpt } from '../../core/options';
import { cap, cents, fmtTime, nItems, unitName, withUnit } from '../../core/text';
import type { CoinName, Unit } from '../../core/types';
import { pl } from '../../core/text';
import { byDiff, numChoice, numeric, textChoice, type GenDef } from '../genkit';

/* ------------------------------------------------------------------ length & size */
export const lengthPair: GenDef = {
  id: 'measure.length-pair', version: 2, mode: 'solve',
  gen(rng, diff) {
    const a = rng.int(2, 9);
    let b = rng.int(2, 9);
    while (Math.abs(b - a) < byDiff(diff, 3, 2, 1)) b = rng.int(2, 9);
    const longer = rng.bool();
    const name = rng.pick(['ribbon', 'snake', 'train', 'pencil']);
    const ok = longer ? (a > b ? 'A' : 'B') : a < b ? 'A' : 'B';
    return {
      badge: '📏 Long & short', prompt: `Which ${name} is ${longer ? 'longer' : 'shorter'}?`,
      visual: { kind: 'lengthpair', a, b, name },
      interaction: buildChoice(rng, [{ label: `${cap(name)} ${ok}`, value: ok }], [{ label: `${cap(name)} ${ok === 'A' ? 'B' : 'A'}`, value: ok === 'A' ? 'B' : 'A' }], 2, 'two', true),
      hints: ['Both start at the same place. Look where each one ends.', `${longer ? 'Longer' : 'Shorter'} means it ends ${longer ? 'farther' : 'sooner'}.`],
      explanation: `Both start at the same line. ${cap(name)} ${ok} ends ${longer ? 'farther' : 'sooner'}, so it is ${longer ? 'longer' : 'shorter'}.`,
      steps: ['Line up the starts.', 'Compare the ends.'],
      math: { kind: 'length-compare', a, b, ask: longer ? 'longer' : 'shorter' }, signature: `lenpair:${a},${b},${longer}`, answerText: `${cap(name)} ${ok}`, readingDemand: 'pre-reader',
    };
  },
};

export const sizePair: GenDef = {
  id: 'measure.size-pair', version: 2, mode: 'solve',
  gen(rng) {
    const small = rng.int(40, 60), big = rng.int(90, 115);
    const [a, b] = rng.bool() ? [small, big] : [big, small];
    const bigger = rng.bool();
    const ok = bigger ? (a > b ? 'A' : 'B') : a < b ? 'A' : 'B';
    return {
      badge: '📏 Big & small', prompt: `Which ball is ${bigger ? 'bigger' : 'smaller'}?`,
      visual: { kind: 'sizepair', a, b },
      interaction: buildChoice(rng, [{ label: `Ball ${ok}`, value: ok }], [{ label: `Ball ${ok === 'A' ? 'B' : 'A'}`, value: ok === 'A' ? 'B' : 'A' }], 2, 'two', true),
      hints: ['Look at both balls side by side.', bigger ? 'Bigger means it takes up more space.' : 'Smaller means it takes up less space.'],
      explanation: `Ball ${ok} is the ${bigger ? 'bigger' : 'smaller'} one.`,
      steps: ['Compare the two sizes.'],
      math: { kind: 'size-compare', a, b, ask: bigger ? 'bigger' : 'smaller' }, signature: `size:${a > b},${bigger}`, answerText: `Ball ${ok}`, readingDemand: 'pre-reader',
    };
  },
};

export const ruler: GenDef = {
  id: 'measure.ruler', version: 3, mode: 'solve',
  gen(rng, diff) {
    const unit = diff === 1 ? 'inches' : rng.pick(['inches', 'centimeters'] as const);
    const start = diff === 3 ? rng.int(1, 3) : 0;
    const len = rng.int(2, 9 - start);
    const name = rng.pick(['pencil', 'crayon', 'ribbon', 'caterpillar', 'straw', 'leaf']);
    const end = start + len;
    return {
      badge: '📐 Measuring', prompt: `How long is the ${name}?`,
      visual: { kind: 'ruler', len, start, unit, name },
      interaction: buildChoice(rng, [{ label: withUnit(len, unit), value: len }],
        [end, len + 1, len - 1, start].filter((v, i, arr) => v > 0 && v !== len && arr.indexOf(v) === i).map(v => ({ label: withUnit(v, unit), value: v }))),
      hints: start ? [`The ${name} does not start at 0! Where does it start?`, `It goes from ${start} to ${end}. Count the spaces between.`] : ['Line up the start with 0. Find the number where it ends.', `The ${name} ends at ${end}.`],
      explanation: start ? `The ${name} goes from ${start} to ${end}. ${end} − ${start} = ${len}, so it is ${withUnit(len, unit)} long.` : `From 0 to ${end} is ${withUnit(len, unit)}.`,
      steps: start ? [`Start: ${start}`, `End: ${end}`, `${end} − ${start} = ${len}`] : [`Start at 0`, `End at ${end}`],
      math: { kind: 'length', len, unit }, signature: `ruler:${start},${len},${unit}`, answerText: withUnit(len, unit),
    };
  },
};

/** Typical sizes: the VALIDATOR independently decides which unit is best from magnitudes. */
const UNIT_ITEMS: { object: string; attr: 'length' | 'mass' | 'capacity'; correct: Unit | 'millimeters' | 'kilometers' | 'inches'; wrong: string[] }[] = [
  { object: 'the length of your finger', attr: 'length', correct: 'centimeters', wrong: ['meters', 'kilometers', 'liters'] },
  { object: 'the length of a soccer field', attr: 'length', correct: 'meters', wrong: ['centimeters', 'kilometers', 'grams'] },
  { object: 'the distance between two towns', attr: 'length', correct: 'kilometers', wrong: ['centimeters', 'grams', 'liters'] },
  { object: 'the length of a crayon', attr: 'length', correct: 'centimeters', wrong: ['meters', 'kilometers', 'kilograms'] },
  { object: 'the height of a giraffe', attr: 'length', correct: 'meters', wrong: ['kilometers', 'grams', 'milliliters'] },
  { object: 'the mass of an elephant', attr: 'mass', correct: 'kilograms', wrong: ['grams', 'liters', 'centimeters'] },
  { object: 'the mass of a paper clip', attr: 'mass', correct: 'grams', wrong: ['kilograms', 'liters', 'meters'] },
  { object: 'the mass of a bag of potatoes', attr: 'mass', correct: 'kilograms', wrong: ['grams', 'milliliters', 'meters'] },
  { object: 'the water in a bathtub', attr: 'capacity', correct: 'liters', wrong: ['milliliters', 'grams', 'meters'] },
  { object: 'one spoonful of medicine', attr: 'capacity', correct: 'milliliters', wrong: ['liters', 'kilograms', 'meters'] },
  { object: 'the water in a swimming pool', attr: 'capacity', correct: 'liters', wrong: ['milliliters', 'grams', 'centimeters'] },
];

export const unitChoice: GenDef = {
  id: 'units.choose', version: 2, mode: 'solve',
  gen(rng, diff) {
    const items = diff === 1 ? UNIT_ITEMS.filter(i => i.attr === 'length') : UNIT_ITEMS;
    const it = rng.pick(items);
    return {
      badge: '⚖️ Best unit', prompt: `Which unit is best for measuring ${it.object}?`,
      interaction: textChoice(rng, it.correct, it.wrong),
      hints: ['First: is it about how long, how heavy, or how much liquid?', 'Small things need small units. Big things need big units.'],
      explanation: `${it.object.charAt(0).toUpperCase() + it.object.slice(1)} is best measured in ${it.correct}. ${it.attr === 'length' ? 'It is a length.' : it.attr === 'mass' ? 'It is about how heavy something is (mass).' : 'It is about how much liquid (liquid volume).'}`,
      steps: [`Kind: ${it.attr === 'capacity' ? 'liquid volume' : it.attr}`, `Size → ${it.correct}`],
      math: { kind: 'unit-choice', object: it.object }, signature: `unit:${it.object}`, answerText: it.correct,
    };
  },
};

const CONV: { from: Unit; to: Unit; factor: number; maxAmt: number }[] = [
  { from: 'hours', to: 'minutes', factor: 60, maxAmt: 4 },
  { from: 'weeks', to: 'days', factor: 7, maxAmt: 6 },
  { from: 'dollars', to: 'cents', factor: 100, maxAmt: 9 },
  { from: 'days', to: 'hours', factor: 24, maxAmt: 3 },
];
export const convertUnits: GenDef = {
  id: 'units.convert', version: 1, mode: 'solve',
  gen(rng, diff) {
    const c = rng.pick(diff === 1 ? CONV.slice(0, 3) : CONV);
    const amt = rng.int(1, c.maxAmt);
    const ans = amt * c.factor;
    return {
      badge: '⚖️ Converting', prompt: `How many ${c.to} are in ${withUnit(amt, c.from)}?`,
      interaction: numChoice(rng, ans, { min: 1, max: 2000, misconceptions: [amt + c.factor, c.factor, ans + c.factor], spread: Math.max(2, c.factor / 4) }),
      hints: [`1 ${unitName(c.from, 1)} = ${c.factor} ${c.to}.`, amt > 1 ? `${amt} × ${c.factor} = ?` : `It is just one ${unitName(c.from, 1)}.`],
      explanation: `1 ${unitName(c.from, 1)} = ${c.factor} ${c.to}, so ${withUnit(amt, c.from)} = ${amt} × ${c.factor} = ${ans} ${c.to}.`,
      steps: [`${amt} × ${c.factor} = ${ans}`],
      math: { kind: 'convert', from: c.from, to: c.to, amount: amt }, signature: `conv:${amt}${c.from}`, answerText: String(ans),
    };
  },
};

/* ------------------------------------------------------------------ time */
function clockGen(id: string, minutesFor: (rng: import('../../core/rng').Rng, diff: 1 | 2 | 3) => number, badge: string): GenDef {
  return {
    id, version: 3, mode: 'solve',
    gen(rng, diff) {
      const h = rng.int(1, 12);
      const m = minutesFor(rng, diff);
      const nextH = h === 12 ? 1 : h + 1;
      const prevH = h === 1 ? 12 : h - 1;
      const str = fmtTime(h, m);
      const minuteNumber = m === 0 ? 12 : m / 5;
      const wrong = [
        fmtTime(nextH, m),                                   // reads the hour hand as the next number
        Number.isInteger(minuteNumber) && minuteNumber <= 12 && m !== 0 ? fmtTime(h, minuteNumber) : fmtTime(h, (m + 30) % 60), // reads the number the minute hand points at
        fmtTime(prevH, m),
        fmtTime(h, (m + 5) % 60),
      ].filter(t => t !== str);
      return {
        badge, prompt: 'What time does the clock show?',
        visual: { kind: 'clock', h, m },
        interaction: textChoice(rng, str, wrong),
        hints: ['The SHORT hand shows the hour. The LONG hand shows the minutes.', m === 0 ? `The long hand points at 12, so it is ${h} o'clock.` : `Count by 5s to the long hand: it points at ${Number.isInteger(minuteNumber) ? minuteNumber : 'a small mark'}, which is ${pl(m, 'minute', 'minutes')}. The short hand is ${m < 30 ? 'just past' : 'between'} ${h}${m < 30 ? '' : ` and ${nextH}`}.`],
        explanation: m === 0 ? `It is ${str} — ${h} o'clock.` : `The hour hand has moved past ${h}, and the minute hand shows ${m} ${m === 1 ? 'minute' : 'minutes'}. The time is ${str}.${m >= 30 ? ` (It is not ${nextH} yet!)` : ''}`,
        steps: [`Hour: ${h}`, `Minutes: ${m}`, `Time: ${str}`],
        math: { kind: 'clock', h, m }, signature: `${id}:${h}:${m}`, answerText: str,
      };
    },
  };
}
export const timeHourHalf = clockGen('time.hour-half', (rng, d) => (d === 1 ? 0 : rng.pick([0, 30])), '🕐 Telling time');
export const timeFive = clockGen('time.five', (rng, d) => (d === 1 ? rng.pick([0, 15, 30, 45]) : rng.int(1, 11) * 5), '🕒 Time to 5 minutes');
export const timeMinute = clockGen('time.minute', (rng, d) => (d === 1 ? rng.int(1, 11) * 5 : rng.int(1, 59)), '⏱️ Time to the minute');

export const elapsed: GenDef = {
  id: 'time.elapsed', version: 1, mode: 'solve',
  gen(rng, diff) {
    const h = rng.int(1, 10);
    const m = byDiff(diff, 0, rng.int(0, 6) * 5, rng.int(0, 11) * 5);
    const dur = byDiff(diff, rng.pick([15, 30, 45]), rng.int(2, 9) * 5, rng.int(5, 15) * 5);
    const total = h * 60 + m + dur;
    const eh = ((Math.floor(total / 60) - 1) % 12) + 1, em = total % 60;
    const activity = rng.pick(['The art class', 'The soccer game', 'The library visit', 'The baking project', 'The puppet show']);
    const askEnd = rng.bool(0.6);
    if (askEnd) {
      const end = fmtTime(eh, em);
      const wrong = [fmtTime(eh, (em + 10) % 60), fmtTime(h + Math.floor((m + dur) / 100), (m + dur) % 100 % 60), fmtTime(eh === 12 ? 1 : eh + 1, em), fmtTime(h, (m + dur) % 60)].filter((t, i, a) => t !== end && a.indexOf(t) === i);
      return {
        badge: '⏱️ Elapsed time', prompt: `${activity} starts at ${fmtTime(h, m)} and lasts ${pl(dur, 'minute', 'minutes')}. What time does it end?`,
        visual: { kind: 'clock', h, m },
        interaction: textChoice(rng, end, wrong),
        hints: ['Jump ahead in parts: first to the next hour, then the rest.', `From ${fmtTime(h, m)}, ${pl(60 - m, 'minute', 'minutes')} gets you to ${fmtTime(h === 12 ? 1 : h + 1, 0)}.`],
        explanation: `${fmtTime(h, m)} plus ${pl(dur, 'minute', 'minutes')} is ${end}.`,
        steps: m + dur >= 60 ? [`${fmtTime(h, m)} + ${60 - m} min = ${fmtTime(h === 12 ? 1 : h + 1, 0)}`, `+ ${dur - (60 - m)} min = ${end}`] : [`${fmtTime(h, m)} + ${dur} min = ${end}`],
        math: { kind: 'elapsed', start: [h, m], minutes: dur, ask: 'end' }, signature: `el:${h}:${m}+${dur}`, answerText: end,
      };
    }
    return {
      badge: '⏱️ Elapsed time', prompt: `${activity} starts at ${fmtTime(h, m)} and ends at ${fmtTime(eh, em)}. How many minutes long is it?`,
      interaction: numeric(dur, 1, 180, 'minutes'),
      hints: ['Count on from the start time to the end time.', 'Jump to the next hour first, then count the extra minutes.'],
      explanation: `From ${fmtTime(h, m)} to ${fmtTime(eh, em)} is ${pl(dur, 'minute', 'minutes')}.`,
      steps: [`Start ${fmtTime(h, m)}`, `End ${fmtTime(eh, em)}`, `${pl(dur, 'minute', 'minutes')}`],
      math: { kind: 'elapsed', start: [h, m], minutes: dur, ask: 'duration' }, signature: `eld:${h}:${m}+${dur}`, answerText: String(dur),
    };
  },
};

/* ------------------------------------------------------------------ money */
const COIN: Record<CoinName, number> = { penny: 1, nickel: 5, dime: 10, quarter: 25 };
export const coinValue: GenDef = {
  id: 'money.coin-value', version: 2, mode: 'solve',
  gen(rng) {
    const kind = rng.pick(['penny', 'nickel', 'dime', 'quarter'] as CoinName[]);
    const v = COIN[kind];
    return {
      badge: '💰 Coins', prompt: `How much is a ${kind} worth?`,
      visual: { kind: 'coins', list: [kind] },
      interaction: textChoice(rng, { label: `${v}¢`, value: v }, [1, 5, 10, 25].filter(x => x !== v).map(x => ({ label: `${x}¢`, value: x }))),
      hints: ['Penny 1¢, nickel 5¢, dime 10¢, quarter 25¢.', kind === 'dime' ? 'A dime is small, but it is worth more than a nickel!' : `A ${kind} is worth ${pl(v, 'cent', 'cents')}.`],
      explanation: `A ${kind} is worth ${v}¢.${kind === 'dime' ? ' Size does not tell a coin\'s value.' : ''}`,
      steps: [`${kind} = ${v}¢`],
      math: { kind: 'money', coins: [kind], ask: 'coin-value' }, signature: `coin:${kind}`, answerText: `${v}¢`, readingDemand: 'early',
    };
  },
};

export const coinCount: GenDef = {
  id: 'money.count', version: 3, mode: 'solve',
  gen(rng, diff) {
    let list: CoinName[];
    if (diff === 1) { const k = rng.pick(['nickel', 'dime', 'penny'] as CoinName[]); list = Array(rng.int(2, k === 'penny' ? 6 : 5)).fill(k); }
    else if (diff === 2) { list = ['quarter', ...Array.from({ length: rng.int(1, 3) }, () => rng.pick(['dime', 'nickel', 'penny'] as CoinName[]))]; }
    else { list = [...Array(rng.int(1, 3)).fill('quarter'), ...Array.from({ length: rng.int(2, 4) }, () => rng.pick(['dime', 'nickel', 'penny'] as CoinName[]))]; }
    const sorted = list.slice().sort((x, y) => COIN[y] - COIN[x]);
    const total = sorted.reduce((s, k) => s + COIN[k], 0);
    let run = 0;
    const steps = sorted.map(k => (run += COIN[k]));
    const wrongCount = list.length; // counting coins instead of value
    return {
      badge: '💰 Counting money', prompt: 'How much money is this in all?',
      visual: { kind: 'coins', list: sorted },
      interaction: buildChoice(rng, [{ label: cents(total), value: total }],
        [total + 5, total - 5, total + 10, wrongCount, total + 1].filter((v, i, a) => v > 0 && v !== total && a.indexOf(v) === i).map(v => ({ label: cents(v), value: v }))),
      hints: ['Start with the coin worth the most. Count on.', `Count: ${steps.map(cents).join(', ')}.`],
      explanation: `Counting on from the greatest coin: ${steps.map(cents).join(' → ')}. Total: ${cents(total)}.`,
      steps: steps.map(cents),
      math: { kind: 'money', coins: sorted, ask: 'total' }, signature: `coins:${sorted.join(',')}`, answerText: cents(total),
    };
  },
};

export const makeChange: GenDef = {
  id: 'money.change', version: 2, mode: 'solve',
  gen(rng, diff) {
    const paid = diff === 1 ? 50 : diff === 2 ? rng.pick([50, 75, 100]) : 100;
    const price = rng.int(diff === 1 ? 10 : 15, paid - 5);
    const change = paid - price;
    const item = rng.pick(['sticker', 'pencil', 'eraser', 'bookmark', 'bouncy ball']);
    const paidText = paid === 100 ? 'a one-dollar bill' : paid === 75 ? '3 quarters (75¢)' : '2 quarters (50¢)';
    return {
      badge: '🪙 Making change', prompt: `A ${item} costs ${price}¢. You pay with ${paidText}. How much change do you get back?`,
      interaction: diff === 3 ? numeric(change, 0, 100, 'cents') : numChoice(rng, change, { min: 1, max: 100, misconceptions: [paid + price, change + 10, change - 10, 100 - price], spread: 5 }, '¢'),
      hints: ['Change = the money you pay − the price.', `Count up from ${price}¢ to ${paid}¢.`],
      explanation: `${paid}¢ − ${price}¢ = ${change}¢. Check: ${price}¢ + ${change}¢ = ${paid}¢.`,
      steps: [`${paid} − ${price} = ${change}`],
      math: { kind: 'change', price, paid }, signature: `chg:${paid}-${price}`, answerText: `${change}`,
    };
  },
};

/* ------------------------------------------------------------------ area & perimeter */
export const areaGrid: GenDef = {
  id: 'area.grid', version: 2, mode: 'solve',
  gen(rng, diff) {
    const w = rng.int(2, byDiff(diff, 5, 7, 9)), h = rng.int(2, byDiff(diff, 4, 5, 7));
    const askArea = rng.bool(0.6);
    const area = w * h, per = 2 * (w + h), ans = askArea ? area : per;
    const showGrid = diff < 3;
    return {
      badge: askArea ? '📦 Area' : '📦 Perimeter',
      prompt: askArea ? 'What is the area of this rectangle, in square units?' : 'What is the perimeter of this rectangle, in units?',
      visual: { kind: 'areagrid', w, h, unitName: 'unit', showGrid },
      interaction: diff === 3 ? numeric(ans, 1, 300) : numChoice(rng, ans, { min: 1, max: 300, misconceptions: [askArea ? per : area, w + h, ans + 2], spread: 3 }),
      hints: [askArea ? 'Area is the number of unit squares that cover the inside.' : 'Perimeter is the distance all the way around.', askArea ? `${pl(h, 'row', 'rows')} of ${w} squares: ${w} × ${h}.` : `${w} + ${h} + ${w} + ${h}.`],
      explanation: askArea ? `Area = ${w} × ${h} = ${area} square units.` : `Perimeter = ${w} + ${h} + ${w} + ${h} = ${per} units.`,
      steps: askArea ? [`${pl(h, 'row', 'rows')} × ${w} = ${area}`] : [`${w} + ${h} + ${w} + ${h} = ${per}`],
      math: { kind: 'rect', w, h, ask: askArea ? 'area' : 'perimeter' }, signature: `rect:${Math.min(w, h)}x${Math.max(w, h)},${askArea}`, answerText: String(ans),
    };
  },
};

export const perimeterRect: GenDef = {
  id: 'perimeter.rect', version: 1, mode: 'solve',
  gen(rng, diff) {
    const w = rng.int(2, byDiff(diff, 6, 12, 20)), h = rng.int(2, byDiff(diff, 5, 9, 15));
    if (diff === 3 && rng.bool(0.5)) {
      const per = 2 * (w + h);
      return {
        badge: '🧱 Missing side', prompt: `A rectangle has a perimeter of ${per} units. One side is ${w} units long. How long is the side next to it?`,
        interaction: numeric(h, 1, 100, 'units'),
        hints: ['A rectangle has two pairs of equal sides.', `${w} + ${w} = ${2 * w}. What is left for the other two sides?`],
        explanation: `${per} − ${w} − ${w} = ${2 * h}, shared by two equal sides: ${2 * h} ÷ 2 = ${h} units.`,
        steps: [`${per} − ${2 * w} = ${2 * h}`, `${2 * h} ÷ 2 = ${h}`],
        math: { kind: 'equation', claim: { left: E.add(E.add(w, E.X), E.add(w, E.X)), rel: '=', right: per }, lo: 0, hi: 100 }, signature: `permiss:${w},${h}`, answerText: String(h),
      };
    }
    return {
      badge: '🧱 Perimeter', prompt: `A garden is shaped like a rectangle. It is ${w} meters long and ${h} meters wide. What is its perimeter?`,
      visual: { kind: 'areagrid', w, h, unitName: 'meter', showGrid: false },
      interaction: diff === 1 ? numChoice(rng, 2 * (w + h), { min: 1, max: 200, misconceptions: [w + h, w * h, 2 * w + h], spread: 3 }) : numeric(2 * (w + h), 1, 200, 'meters'),
      hints: ['Perimeter: add the lengths of all four sides.', `There are two sides of ${w} and two sides of ${h}.`],
      explanation: `${w} + ${h} + ${w} + ${h} = ${2 * (w + h)} meters.`,
      steps: [`${w} + ${h} + ${w} + ${h} = ${2 * (w + h)}`],
      math: { kind: 'rect', w, h, ask: 'perimeter' }, signature: `per:${Math.min(w, h)}x${Math.max(w, h)}`, answerText: String(2 * (w + h)),
    };
  },
};

export const perimeterMistake: GenDef = {
  id: 'perimeter.mistake', version: 1, mode: 'mistake',
  gen(rng) {
    const w = rng.int(3, 9);
    let h = rng.int(2, 6);
    while (w * h === 2 * (w + h) || h === w) h = h === 6 ? 2 : h + 1;
    const per = 2 * (w + h);
    const name = rng.pick(['Ben', 'Zara', 'Theo', 'Amara', 'Jin', 'Sofia']);
    const opts = [
      { label: `${name} added only two sides. All four sides: ${w} + ${h} + ${w} + ${h} = ${per}.`, value: 'two', claim: { left: E.sum(w, h, w, h), rel: '=' as const, right: per } },
      { label: `${name} is right: the perimeter is ${w + h}.`, value: 'ok', claim: { left: E.sum(w, h, w, h), rel: '=' as const, right: w + h } },
      { label: `${name} should multiply: ${w} × ${h} = ${w * h}.`, value: 'area', claim: { left: E.sum(w, h, w, h), rel: '=' as const, right: w * h } },
    ];
    return {
      badge: '🔎 Find the mistake', prompt: `${name} says the perimeter of a ${w} by ${h} rectangle is ${w} + ${h} = ${w + h}. What went wrong?`,
      visual: { kind: 'areagrid', w, h, unitName: 'unit', showGrid: false },
      interaction: buildChoice(rng, [opts[0]!], opts.slice(1), 3, 'list'),
      hints: ['How many sides does a rectangle have?', 'Trace all the way around the rectangle.'],
      explanation: `A rectangle has 4 sides. ${w} + ${h} + ${w} + ${h} = ${per} units.`,
      steps: [`${w} + ${h} + ${w} + ${h} = ${per}`],
      math: { kind: 'claims' }, signature: `perm:${w}x${h}`, answerText: String(per),
      reasoningObjective: 'Find a perimeter error and explain the correct method.',
    };
  },
};

export const areaMistake: GenDef = {
  id: 'area.mistake', version: 1, mode: 'mistake',
  gen(rng) {
    let w = rng.int(3, 8), h = rng.int(2, 6);
    while (w * h === 2 * (w + h)) h += 1;
    const area = w * h, per = 2 * (w + h);
    const name = rng.pick(['Ben', 'Lina', 'Omar', 'Ella', 'Kai', 'Priya']);
    const opts = [
      { label: `${name} found the perimeter (the distance around). Area counts squares inside: ${w} × ${h} = ${area}.`, value: 'per', claims: [{ left: E.sum(w, h, w, h), rel: '=' as const, right: per }, { left: E.mul(w, h), rel: '=' as const, right: area }], claim: { left: E.mul(w, h), rel: '=' as const, right: area } },
      { label: `${name} is right. The area is ${per} square units.`, value: 'ok', claim: { left: E.mul(w, h), rel: '=' as const, right: per } },
      { label: `${name} should add: ${w} + ${h} = ${w + h} square units.`, value: 'add', claim: { left: E.mul(w, h), rel: '=' as const, right: w + h } },
    ];
    return {
      badge: '🔎 Find the mistake', prompt: `${name} says the area of this rectangle is ${per} square units. What went wrong?`,
      visual: { kind: 'areagrid', w, h, unitName: 'unit', showGrid: true },
      interaction: buildChoice(rng, [opts[0]!], opts.slice(1), 3, 'list'),
      hints: ['Area: how many squares cover the inside?', `${per} is what you get adding the sides: ${w} + ${h} + ${w} + ${h}.`],
      explanation: `${per} units is the perimeter. The area is ${w} × ${h} = ${area} square units.`,
      steps: [`Perimeter: ${per} units`, `Area: ${area} square units`],
      math: { kind: 'claims' }, signature: `aream:${w}x${h}`, answerText: String(area),
      reasoningObjective: 'Distinguish area from perimeter.',
    };
  },
};

export const areaCompare: GenDef = {
  id: 'area.same-perimeter', version: 1, mode: 'explain',
  gen(rng) {
    const P = rng.pick([12, 16, 20]);
    const half = P / 2;
    const w1 = rng.int(1, Math.floor(half / 2) - 1), h1 = half - w1;
    const w2 = Math.floor(half / 2), h2 = half - w2;
    const a1 = w1 * h1, a2 = w2 * h2;
    return {
      badge: '💬 Think it through', prompt: `Rectangle A is ${w1} by ${h1}. Rectangle B is ${w2} by ${h2}. Both have a perimeter of ${P} units. True or false?`,
      interaction: {
        type: 'tf', statement: 'The two rectangles must have the same area.', truth: false, claim: { left: E.mul(w1, h1), rel: '=', right: E.mul(w2, h2) },
        justifications: [
          { id: 'j1', label: `Area A is ${w1} × ${h1} = ${a1}. Area B is ${w2} × ${h2} = ${a2}. Same perimeter, different areas.`, value: 'calc', claims: [{ left: E.mul(w1, h1), rel: '=', right: a1 }, { left: E.mul(w2, h2), rel: '=', right: a2 }, { left: a1, rel: '≠', right: a2 }], claim: { left: a1, rel: '≠', right: a2 } },
          { id: 'j2', label: 'Same perimeter always means same area.', value: 'myth', truth: false },
          { id: 'j3', label: `Both areas are ${P}.`, value: 'p', claim: { left: E.mul(w1, h1), rel: '=', right: P } },
        ],
        correctJust: ['j1'],
      },
      hints: ['Find the area of each rectangle.', `${w1} × ${h1} and ${w2} × ${h2}.`],
      explanation: `False. Both perimeters are ${P}, but the areas are ${a1} and ${a2} square units.`,
      steps: [`A: ${w1} × ${h1} = ${a1}`, `B: ${w2} × ${h2} = ${a2}`],
      math: { kind: 'claims' }, signature: `samep:${P},${w1},${w2}`, answerText: 'False',
      reasoningObjective: 'Recognize that rectangles with the same perimeter can have different areas.',
    };
  },
};

/* ------------------------------------------------------------------ data */
const DATASETS = [
  { title: 'Favorite pets', cats: [['Cats', '🐱'], ['Dogs', '🐶'], ['Fish', '🐟'], ['Birds', '🐦']] },
  { title: 'Fruit picked', cats: [['Apples', '🍎'], ['Pears', '🍐'], ['Peaches', '🍑'], ['Kiwis', '🥝']] },
  { title: 'Books read', cats: [['May', '📗'], ['June', '📘'], ['July', '📙'], ['August', '📕']] },
  { title: 'Garden visitors', cats: [['Bees', '🐝'], ['Butterflies', '🦋'], ['Ladybugs', '🐞'], ['Snails', '🐌']] },
];
function dataGen(id: string, count: (d: 1 | 2 | 3) => number, scaleFor: (rng: import('../../core/rng').Rng, d: 1 | 2 | 3) => number, modes: (d: 1 | 2 | 3) => ('read' | 'most' | 'least' | 'diff' | 'total')[]): GenDef {
  return {
    id, version: 2, mode: 'solve',
    gen(rng, diff) {
      const s = rng.pick(DATASETS);
      const n = count(diff);
      const scale = scaleFor(rng, diff);
      const vals = new Set<number>();
      while (vals.size < n) vals.add(rng.int(1, 9) * scale);
      const data = [...vals].map((v, i) => ({ label: s.cats[i]![0]!, emoji: s.cats[i]![1]!, val: v }));
      const mode = rng.pick(modes(diff));
      const visual = { kind: 'bargraph' as const, title: s.title, data, scale };
      const maxD = data.reduce((m, d) => (d.val > m.val ? d : m));
      const minD = data.reduce((m, d) => (d.val < m.val ? d : m));
      const scaleHint = scale > 1 ? ` Each grid line is ${scale}.` : '';
      if (mode === 'read') {
        const d = rng.pick(data);
        return {
          badge: '📊 Graphs', prompt: `${s.title}: how many ${d.label}?`, visual,
          interaction: numChoice(rng, d.val, { min: 0, max: 200, misconceptions: [d.val / scale, d.val + scale, d.val - scale].filter(v => Number.isInteger(v)), spread: scale }),
          hints: [`Find the ${d.label} bar. Look across to the scale.${scaleHint}`, `The top of the ${d.label} bar lines up with ${d.val}.`],
          explanation: `The ${d.label} bar reaches ${d.val}.`, steps: [`${d.label}: ${d.val}`],
          math: { kind: 'data', ask: 'read', target: d.label }, signature: `${id}:read:${d.val},${scale}`, answerText: String(d.val),
        };
      }
      if (mode === 'most' || mode === 'least') {
        const t = mode === 'most' ? maxD : minD;
        return {
          badge: '📊 Graphs', prompt: `${s.title}: which has the ${mode}?`, visual,
          interaction: buildChoice(rng, [{ label: t.label, value: t.label }], data.filter(d => d !== t).map(d => ({ label: d.label, value: d.label })), 4, 'grid'),
          hints: [mode === 'most' ? 'Find the tallest bar.' : 'Find the shortest bar.', `Compare: ${data.map(d => `${d.label} ${d.val}`).join(', ')}.`],
          explanation: `${t.label} has the ${mode} (${t.val}).`, steps: data.map(d => `${d.label}: ${d.val}`),
          math: { kind: 'data', ask: mode }, signature: `${id}:${mode}:${data.map(d => d.val).join(',')}`, answerText: t.label,
        };
      }
      if (mode === 'diff') {
        const dd = maxD.val - minD.val;
        return {
          badge: '📊 Graphs', prompt: `${s.title}: how many more ${maxD.label} than ${minD.label}?`, visual,
          interaction: numChoice(rng, dd, { min: 1, max: 200, misconceptions: [maxD.val + minD.val, maxD.val, dd + scale], spread: Math.max(2, scale) }),
          hints: ['Find both bars. How much taller is one than the other?', `${maxD.val} − ${minD.val} = ?`],
          explanation: `${maxD.label}: ${maxD.val}. ${minD.label}: ${minD.val}. ${maxD.val} − ${minD.val} = ${dd}.`, steps: [`${maxD.val} − ${minD.val} = ${dd}`],
          math: { kind: 'data', ask: 'diff', target: maxD.label, other: minD.label }, signature: `${id}:diff:${maxD.val},${minD.val}`, answerText: String(dd),
        };
      }
      const total = data.reduce((acc, d) => acc + d.val, 0);
      return {
        badge: '📊 Graphs', prompt: `${s.title}: how many in all?`, visual,
        interaction: numChoice(rng, total, { min: 1, max: 500, misconceptions: [total - minD.val, total + scale], spread: Math.max(3, scale) }),
        hints: ['Read every bar, then add.', `${data.map(d => d.val).join(' + ')} = ?`],
        explanation: `${data.map(d => d.val).join(' + ')} = ${total}.`, steps: [`${data.map(d => d.val).join(' + ')} = ${total}`],
        math: { kind: 'data', ask: 'total' }, signature: `${id}:total:${data.map(d => d.val).join(',')}`, answerText: String(total),
      };
    },
  };
}
export const dataSimple = dataGen('data.simple', () => 3, () => 1, d => byDiff(d, ['read', 'most', 'least'] as const, ['read', 'most', 'least', 'diff'] as const, ['diff', 'total', 'read'] as const).slice());
export const dataBars = dataGen('data.bars', d => (d === 1 ? 3 : 4), () => 1, () => ['read', 'diff', 'total', 'most', 'least']);
export const dataScaled = dataGen('data.scaled', () => 4, (rng, d) => (d === 1 ? 2 : rng.pick([2, 5, 10])), () => ['read', 'diff', 'total']);

export { numOpt, nItems };
