/** Skill → generators, plus safe, validated generation with same-skill failover. */
import { SKILL_INDEX } from '../curriculum/levels';
import { readingDemand } from '../core/text';
import { Rng } from '../core/rng';
import type { Difficulty, Mode, Question } from '../core/types';
import type { GenDef } from './genkit';
import * as N from './generators/number';
import * as O from './generators/operations';
import * as G from './generators/geometry';
import * as M from './generators/measurement';
import * as F from './generators/fractions';
import * as R from './generators/reasoning';
import * as S from './generators/stories';
import { validateQuestion } from './validate';

export interface Entry { gen: GenDef; weight: number; minDiff?: Difficulty }
const e = (gen: GenDef, weight = 1, minDiff?: Difficulty): Entry => ({ gen, weight, ...(minDiff ? { minDiff } : {}) });

export const SKILL_GENERATORS: Record<string, Entry[]> = {
  // Level 1
  'L1-count': [e(N.countObjects, 3), e(N.countTenFrame, 2, 2), e(N.countExplain, 1), e(N.countSameAnyOrder, 1, 2)],
  'L1-numerals': [e(N.numeralWord, 2), e(N.numeralMatch, 2)],
  'L1-compare': [e(N.compareGroups, 3), e(N.compareNumbers, 2, 2), e(N.compareSameNumber, 1)],
  'L1-order': [e(N.orderNextBefore, 2), e(N.orderMissing, 2), e(N.orderSort, 1, 2)],
  'L1-add': [e(O.addObjects, 3), e(O.addTenFrame, 2, 2), e(O.addChange, 1)],
  'L1-sub': [e(O.subObjects, 3), e(O.subChange, 1)],
  'L1-compose': [e(O.composeBond, 3), e(O.composeWays, 2)],
  'L1-shapes': [e(G.shapeName, 3), e(G.shapeCorners, 1, 2), e(G.positionWords, 2)],
  'L1-patterns': [e(G.patternNext, 1)],
  'L1-sort': [e(G.sortOdd, 1)],
  'L1-measure': [e(M.lengthPair, 2), e(M.sizePair, 1)],
  'L1-stories': [e(S.storyL1, 1)],
  // Level 2
  'L2-add20': [e(O.add20, 4), e(O.add20MakeTen, 1, 2), e(O.add20Mistake, 1), e(O.add20Doubles, 1, 2)],
  'L2-sub20': [e(O.sub20, 4), e(O.sub20ThinkAdd, 1, 2)],
  'L2-placevalue': [e(N.pvBlocks, 3), e(N.pvDigit, 2), e(N.pvExpanded, 1, 2), e(N.pvMistake, 1, 2)],
  'L2-numberline': [e(N.nlLocate, 2), e(N.nlRead, 2)],
  'L2-missing': [e(O.missingNumber, 1)],
  'L2-equality': [e(O.equalityTF, 2), e(O.equalityBalance, 2)],
  'L2-compare': [e(N.cmpSymbols, 3), e(N.cmpGreatest, 2), e(N.cmpExplain, 1, 2)],
  'L2-skip': [e(N.skip2, 1)],
  'L2-money': [e(M.coinValue, 2), e(M.coinCount, 2)],
  'L2-time': [e(M.timeHourHalf, 1)],
  'L2-measure': [e(M.ruler, 3), e(M.lengthPair, 1)],
  'L2-data': [e(M.dataSimple, 1)],
  'L2-stories': [e(S.storyL2, 1)],
  'L2-puzzles': [e(R.detective2, 2), e(R.waysToMake, 2)],
  // Level 3
  'L3-addregroup': [e(O.add2, 4), e(O.add2Mistake, 1, 2), e(O.add2AnotherWay, 1, 2)],
  'L3-subregroup': [e(O.sub2, 4), e(O.sub2Mistake, 1, 2)],
  'L3-placevalue': [e(N.pv3Blocks, 3), e(N.pv3Digit, 2), e(N.pv3Compare, 2), e(N.pvExpanded, 1, 3)],
  'L3-equalgroups': [e(O.groupsRepeated, 1)],
  'L3-multintro': [e(O.arrayCount, 3), e(O.arrayBuild, 2), e(O.multCommutative, 1, 2)],
  'L3-divintro': [e(O.divShare, 2), e(O.divGroupsOf, 2)],
  'L3-skip': [e(N.skip3, 1)],
  'L3-fractions': [e(F.fracName, 3), e(F.fracShade, 2), e(F.fracEqualParts, 1), e(F.fracWhole, 1, 2)],
  'L3-measure': [e(M.ruler, 2), e(M.unitChoice, 1)],
  'L3-geometry': [e(G.shapeName, 2), e(G.shapeCorners, 2), e(G.shapeProperty, 2)],
  'L3-perimeter': [e(M.perimeterRect, 3), e(M.perimeterMistake, 1, 2)],
  'L3-time': [e(M.timeFive, 1)],
  'L3-money': [e(M.coinCount, 2), e(M.makeChange, 2)],
  'L3-data': [e(M.dataBars, 1)],
  'L3-estimate': [e(N.round10, 3), e(N.reasonable, 1, 2)],
  'L3-stories': [e(S.storyL3, 1)],
  'L3-logic': [e(R.detective3, 2), e(R.enoughInfo, 2)],
  // Level 4
  'L4-mult': [e(O.multFacts, 4), e(O.multDistributive, 1, 2), e(O.multMistake, 1, 2)],
  'L4-div': [e(O.divFacts, 3), e(O.divMissingFactor, 2), e(O.divExplain, 1)],
  'L4-properties': [e(O.propertiesTF, 2), e(O.propertiesMatch, 1)],
  'L4-multistep': [e(O.multiStepExpr, 1)],
  'L4-fracequiv': [e(F.fracEquivMissing, 2), e(F.fracEquivWhich, 2), e(F.fracEquivMistake, 1, 2)],
  'L4-fraccompare': [e(F.fracCompare, 3), e(F.fracCompareExplain, 1)],
  'L4-fracline': [e(F.fracLinePlace, 2), e(F.fracLineRead, 2)],
  'L4-area': [e(M.areaGrid, 3), e(M.areaMistake, 1, 2), e(M.areaCompare, 1, 2)],
  'L4-measure': [e(M.unitChoice, 2), e(M.convertUnits, 2)],
  'L4-elapsed': [e(M.timeMinute, 1), e(M.elapsed, 2)],
  'L4-data': [e(M.dataScaled, 1)],
  'L4-rounding': [e(N.round100, 2), e(N.estimateSum, 2), e(N.reasonable, 1)],
  'L4-patterns': [e(G.patternRule, 2), e(G.ruleMachine, 2), e(R.alwaysSometimesNever, 1)],
  'L4-geometry': [e(G.shapeFamily, 2), e(G.shapeProperty, 2)],
  'L4-stories': [e(S.storyL4, 3), e(R.enoughInfo, 1)],
  'L4-logic': [e(R.detective3, 2), e(O.multMistake, 1), e(F.fracEquivMistake, 1), e(M.areaMistake, 1), e(O.sub2Mistake, 1)],
};

export const REASONING_MODES: Mode[] = ['explain', 'mistake', 'another-way', 'detective'];

/** Build + validate one question from a specific generator. */
export function buildQuestion(skillId: string, gen: GenDef, diff: Difficulty, seed: number): Question {
  const skill = SKILL_INDEX[skillId];
  if (!skill) throw new Error(`unknown skill ${skillId}`);
  const rng = new Rng(seed);
  const d = gen.gen(rng, diff);
  const qn: Question = {
    ...d,
    id: `${gen.id}@${gen.version}#${seed}d${diff}`,
    generatorId: gen.id, generatorVersion: gen.version, seed,
    level: skill.level, domain: skill.domain, skill: skill.id, objective: skill.objective, difficulty: diff,
    mode: d.mode ?? gen.mode,
    readingDemand: d.readingDemand ?? readingDemand(`${d.story ?? ''} ${d.prompt}`),
    signature: `${skill.id}|${d.signature || d.prompt}`,
    validation: { status: 'unvalidated', issues: [] },
  };
  const issues = validateQuestion(qn);
  qn.validation = { status: issues.length ? 'failed' : 'validated', issues };
  return qn;
}

/* ---------------------------------------------------------------- diagnostics */
export interface Diagnostic { t: number; skill: string; generator: string; seed: number; diff: number; issue: string }
const DIAG: Diagnostic[] = [];
export const diagnostics = (): readonly Diagnostic[] => DIAG;
export const clearDiagnostics = () => { DIAG.length = 0; };
function logDiag(d: Diagnostic) { DIAG.push(d); if (DIAG.length > 50) DIAG.shift(); }

export class GeneratorUnavailable extends Error {
  constructor(readonly skill: string) { super(`No validated question available for ${skill}`); }
}

export interface GenerateOptions {
  modes?: Mode[];            // restrict to these modes (e.g. reasoning)
  excludeModes?: Mode[];
  avoidSignatures?: Set<string>;
  attempts?: number;
  /** Test builds only: restrict to one generator id (still validated, same skill). */
  onlyGenerator?: string;
}

/**
 * Generate a VALIDATED question for this skill. Never falls back to another skill.
 * Order: weighted pick → retry with new seeds → other generators of the same skill → throw.
 */
export function safeGenerate(skillId: string, diff: Difficulty, seed: number, opts: GenerateOptions = {}): Question {
  const all = SKILL_GENERATORS[skillId];
  if (!all?.length) throw new GeneratorUnavailable(skillId);
  const pickRng = new Rng(seed ^ 0x5bd1e995);
  const usable = all.filter(en => (en.minDiff ?? 1) <= diff && (!opts.modes || opts.modes.includes(en.gen.mode)) && !(opts.excludeModes ?? []).includes(en.gen.mode));
  const forced = opts.onlyGenerator ? all.filter(en => en.gen.id === opts.onlyGenerator) : [];
  if (forced.length) usable.splice(0, usable.length, ...forced);
  const pool = usable.length ? usable : all.filter(en => (!opts.modes || opts.modes.includes(en.gen.mode)) && !(opts.excludeModes ?? []).includes(en.gen.mode));
  if (!pool.length) throw new GeneratorUnavailable(skillId);
  const order = weightedOrder(pickRng, pool);
  const attempts = opts.attempts ?? 6;
  let fallbackRepeat: Question | null = null;
  for (const en of order) {
    const effDiff = (en.minDiff ?? 1) <= diff ? diff : (en.minDiff as Difficulty);
    for (let k = 0; k < attempts; k++) {
      const s = (seed + k * 7919 + en.gen.id.length * 104729) >>> 0;
      let qn: Question;
      try { qn = buildQuestion(skillId, en.gen, effDiff, s); }
      catch (err) { logDiag({ t: Date.now(), skill: skillId, generator: en.gen.id, seed: s, diff: effDiff, issue: `threw: ${(err as Error).message}` }); continue; }
      if (qn.validation.status !== 'validated') { logDiag({ t: Date.now(), skill: skillId, generator: en.gen.id, seed: s, diff: effDiff, issue: qn.validation.issues.join('; ') }); continue; }
      if (opts.avoidSignatures?.has(qn.signature)) { fallbackRepeat ??= qn; continue; }
      return qn;
    }
  }
  if (fallbackRepeat) return fallbackRepeat; // valid, merely repeated (mastery logic ignores repeats)
  throw new GeneratorUnavailable(skillId);
}

function weightedOrder(rng: Rng, pool: Entry[]): Entry[] {
  const left = pool.slice(), out: Entry[] = [];
  while (left.length) {
    const tot = left.reduce((s, x) => s + x.weight, 0);
    let r = rng.next() * tot, i = 0;
    while (r >= left[i]!.weight) { r -= left[i]!.weight; i++; }
    out.push(left.splice(i, 1)[0]!);
  }
  return out;
}

export const ALL_GENERATORS: GenDef[] = [...new Set(Object.values(SKILL_GENERATORS).flat().map(x => x.gen))];
