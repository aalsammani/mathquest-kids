/** Language helpers: plurals, number words, fraction words, units, time. */

export const plural = (n: number, one: string, many: string): string => (n === 1 ? one : many);
/** "1 ten", "3 tens". */
export const pl = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;
export const nItems = (n: number, one: string, many: string): string => `${n} ${plural(n, one, many)}`;
export const cap = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

/** 0–9999 in words, American style ("three hundred forty-five"). */
export function numberWord(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 9999) throw new RangeError(`numberWord: ${n}`);
  if (n < 20) return ONES[n]!;
  if (n < 100) return TENS[Math.floor(n / 10)]! + (n % 10 ? '-' + ONES[n % 10] : '');
  if (n < 1000) return ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + numberWord(n % 100) : '');
  return ONES[Math.floor(n / 1000)] + ' thousand' + (n % 1000 ? ' ' + numberWord(n % 1000) : '');
}

const DEN_SINGULAR: Record<number, string> = { 2: 'half', 3: 'third', 4: 'fourth', 5: 'fifth', 6: 'sixth', 8: 'eighth', 10: 'tenth', 12: 'twelfth' };
const DEN_PLURAL: Record<number, string> = { 2: 'halves', 3: 'thirds', 4: 'fourths', 5: 'fifths', 6: 'sixths', 8: 'eighths', 10: 'tenths', 12: 'twelfths' };

function ordinal(n: number): string {
  const w = numberWord(n);
  const irregular: Record<string, string> = { one: 'first', two: 'second', three: 'third', five: 'fifth', eight: 'eighth', nine: 'ninth', twelve: 'twelfth' };
  const parts = w.split(/([ -])/);
  const last = parts[parts.length - 1]!;
  parts[parts.length - 1] = irregular[last] ?? (last.endsWith('y') ? last.slice(0, -1) + 'ieth' : last + 'th');
  return parts.join('');
}
export function fractionPartName(den: number, count = 1): string {
  if (!Number.isInteger(den) || den < 1 || den > 100) throw new RangeError(`fractionPartName: unsupported denominator ${den}`);
  if (den === 1) return count === 1 ? 'whole' : 'wholes';
  const w = count === 1 ? DEN_SINGULAR[den] : DEN_PLURAL[den];
  if (w) return w;
  const o = ordinal(den);
  return count === 1 ? o : o + 's';
}
/** "3 fourths", "1 half", "2 halves". */
export function fractionWords(num: number, den: number): string {
  return `${numberWord(num)} ${fractionPartName(den, num)}`;
}

const UNIT_SINGULAR: Record<string, string> = {
  inches: 'inch', centimeters: 'centimeter', meters: 'meter', kilometers: 'kilometer', millimeters: 'millimeter',
  feet: 'foot', grams: 'gram', kilograms: 'kilogram', liters: 'liter', milliliters: 'milliliter',
  minutes: 'minute', hours: 'hour', days: 'day', weeks: 'week', cents: 'cent', dollars: 'dollar',
  units: 'unit', 'square units': 'square unit',
};
export function unitName(unitPlural: string, n: number): string {
  if (n === 1) {
    const s = UNIT_SINGULAR[unitPlural];
    if (!s) throw new RangeError(`unitName: unknown unit ${unitPlural}`);
    return s;
  }
  return unitPlural;
}
export const withUnit = (n: number, unitPlural: string): string => `${n} ${unitName(unitPlural, n)}`;

export const UNIT_ABBR: Record<string, string> = { inches: 'in', centimeters: 'cm' };

export function fmtTime(h: number, m: number): string {
  return `${h}:${String(m).padStart(2, '0')}`;
}
export function cents(v: number): string {
  if (v >= 100) return `$${Math.floor(v / 100)}.${String(v % 100).padStart(2, '0')}`;
  return `${v}¢`;
}

/** Join a list with commas and "and". */
export function listJoin(xs: string[]): string {
  if (xs.length <= 1) return xs.join('');
  if (xs.length === 2) return `${xs[0]} and ${xs[1]}`;
  return `${xs.slice(0, -1).join(', ')}, and ${xs[xs.length - 1]}`;
}

/** Rough reading-demand estimate from words per sentence and long words. */
export function readingDemand(text: string): 'pre-reader' | 'early' | 'developing' | 'fluent' {
  const words = text.split(/\s+/).filter(w => /[a-z]/i.test(w));
  const sentences = Math.max(1, (text.match(/[.!?]/g) || []).length);
  const wps = words.length / sentences;
  const longWords = words.filter(w => w.replace(/[^a-z]/gi, '').length >= 8).length;
  if (words.length <= 6) return 'pre-reader';
  if (wps <= 8 && longWords <= 1) return 'early';
  if (wps <= 13 && longWords <= 4) return 'developing';
  return 'fluent';
}
