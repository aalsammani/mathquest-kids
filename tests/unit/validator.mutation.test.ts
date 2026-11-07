/**
 * Mutation tests: the validator must REJECT deliberately broken questions.
 * Each case is a regression test for a real defect class found in the v1.1 audit.
 */
import { describe, expect, it } from 'vitest';
import { E } from '../../src/core/expr';
import type { Difficulty, Question } from '../../src/core/types';
import type { GenDef } from '../../src/engine/genkit';
import * as F from '../../src/engine/generators/fractions';
import * as G from '../../src/engine/generators/geometry';
import * as M from '../../src/engine/generators/measurement';
import * as N from '../../src/engine/generators/number';
import * as O from '../../src/engine/generators/operations';
import * as R from '../../src/engine/generators/reasoning';
import * as S from '../../src/engine/generators/stories';
import { buildQuestion } from '../../src/engine/registry';
import { validateQuestion } from '../../src/engine/validate';

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
/** First validated question from a generator satisfying `pred`. */
function find(skill: string, gen: GenDef, pred: (q: Question) => boolean, diff: Difficulty = 2): Question {
  for (let s = 1; s < 5000; s++) {
    const qn = buildQuestion(skill, gen, diff, s);
    if (qn.validation.status === 'validated' && pred(qn)) return clone(qn);
  }
  throw new Error(`no sample for ${gen.id}`);
}
const expectRejected = (qn: Question, re: RegExp) => {
  const issues = validateQuestion(qn);
  expect(issues.join(' | '), 'validator should reject').toMatch(re);
};

describe('validator rejects broken questions', () => {
  it('wrong answer key on a numeric choice', () => {
    const qn = find('L2-add20', O.add20, x => x.interaction.type === 'choice', 1);
    if (qn.interaction.type !== 'choice') throw 0;
    const wrong = qn.interaction.options.find(o => !qn.interaction.type || !(qn.interaction as any).correct.includes(o.id))!;
    qn.interaction.correct = [wrong.id];
    expectRejected(qn, /answer key/);
  });

  it('a distractor that is accidentally correct (two right answers)', () => {
    const qn = find('L2-add20', O.add20, x => x.interaction.type === 'choice', 1);
    if (qn.interaction.type !== 'choice') throw 0;
    const right = qn.interaction.options.find(o => (qn.interaction as any).correct.includes(o.id))!;
    const wrong = qn.interaction.options.find(o => o.id !== right.id)!;
    wrong.value = right.value; wrong.label = right.label + ' ';
    expectRejected(qn, /duplicate (values|labels)|answer key/);
  });

  it('equivalent-fraction distractor on a "name the fraction" item (2/4 offered when 1/2 is correct)', () => {
    const qn = find('L3-fractions', F.fracName, x => x.math.kind === 'fraction' && x.math.parts === 2 && x.math.shaded === 1, 2);
    if (qn.interaction.type !== 'choice') throw 0;
    const wrong = qn.interaction.options.find(o => !(qn.interaction as any).correct.includes(o.id))!;
    wrong.value = '2/4'; wrong.label = '2/4';
    expectRejected(qn, /fraction-name: answer key/);
  });

  it('square offered with "rectangle" as a second correct name (audit C2)', () => {
    const qn = find('L1-shapes', G.shapeName, x => x.math.kind === 'shape' && x.math.shape === 'square', 1);
    if (qn.interaction.type !== 'choice') throw 0;
    const wrong = qn.interaction.options.find(o => !(qn.interaction as any).correct.includes(o.id))!;
    wrong.value = 'rectangle'; wrong.label = 'rectangle';
    expectRejected(qn, /shape-name: answer key/);
  });

  it('comparison story drawn as a take-away model (audit C4)', () => {
    const qn = find('L2-stories', S.storyL2, x => x.math.kind === 'story' && x.math.structure === 'compare-difference', 2);
    const m = qn.math as Extract<Question['math'], { kind: 'story' }>;
    qn.visual = { kind: 'counters', emoji: '🍎', count: Math.min(12, m.givens[0]!), cross: Math.min(11, m.givens[1]!), label: 'apples' };
    expectRejected(qn, /comparison drawn as take-away/);
  });

  it('keyword-rule hints (audit M1)', () => {
    const qn = find('L2-stories', S.storyL2, () => true);
    qn.hints[0] = 'Some are going away — that means subtract!';
    expectRejected(qn, /keyword-rule/);
  });

  it('explanation that contradicts the answer', () => {
    const qn = find('L1-add', O.addObjects, () => true, 1);
    qn.explanation = 'The answer is 99.';
    expectRejected(qn, /explanation does not state the answer|different answer/);
  });

  it('visual that does not show the counted quantity', () => {
    const qn = find('L1-count', N.countObjects, () => true, 1);
    if (qn.visual?.kind !== 'counters') throw 0;
    qn.visual.count += 1;
    expectRejected(qn, /count: visual shows/);
  });

  it('clock drawn at a different time than the key', () => {
    const qn = find('L2-time', M.timeHourHalf, () => true, 2);
    if (qn.visual?.kind !== 'clock') throw 0;
    qn.visual.h = qn.visual.h === 12 ? 1 : qn.visual.h + 1;
    expectRejected(qn, /clock: visual mismatch/);
  });

  it('story text containing a number that is neither given nor declared irrelevant', () => {
    const qn = find('L3-stories', S.storyL3, x => !!x.story);
    qn.story = `${qn.story} There are 77 clouds.`;
    expectRejected(qn, /story: numbers in text/);
  });

  it('a detective puzzle with more than one solution', () => {
    const qn = find('L2-puzzles', R.detective2, x => x.math.kind === 'clues');
    if (qn.math.kind !== 'clues') throw 0;
    qn.math.clues = [qn.math.clues[0]!];
    expectRejected(qn, /clues: \d+ solutions/);
  });

  it('an ambiguous unit choice (centimeters vs inches for a crayon)', () => {
    const qn = find('L3-measure', M.unitChoice, x => x.math.kind === 'unit-choice' && x.math.object === 'the length of a crayon');
    if (qn.interaction.type !== 'choice') throw 0;
    const wrong = qn.interaction.options.find(o => !(qn.interaction as any).correct.includes(o.id))!;
    wrong.value = 'inches'; wrong.label = 'inches';
    expectRejected(qn, /unit-choice: ambiguous/);
  });

  it('a true/false statement whose truth flag is wrong', () => {
    const qn = find('L2-equality', O.equalityTF, x => x.interaction.type === 'tf');
    if (qn.interaction.type !== 'tf') throw 0;
    qn.interaction.truth = !qn.interaction.truth;
    expectRejected(qn, /tf: statement truth/);
  });

  it('always/sometimes/never keyed wrongly', () => {
    const qn = find('L4-patterns', R.alwaysSometimesNever, x => x.math.kind === 'asn' && x.math.key === 'odd+odd');
    if (qn.interaction.type !== 'choice') throw 0;
    const wrong = qn.interaction.options.find(o => o.value === 'sometimes')!;
    qn.interaction.correct = [wrong.id];
    expectRejected(qn, /asn: answer key/);
  });

  it('an unequal partition presented as a fraction (audit: invalid fraction diagrams)', () => {
    const qn = find('L3-fractions', F.fracName, x => x.visual?.kind === 'fracbar');
    if (qn.visual?.kind !== 'fracbar') throw 0;
    qn.visual.widths = Array.from({ length: qn.visual.den }, (_, i) => i + 1);
    expectRejected(qn, /fraction: visual equality mismatch/);
  });

  it('a story plan option marked correct that does not solve the story', () => {
    const qn = find('L3-stories', S.storyL3, x => !!x.phases);
    const plan = qn.phases!.plan.interaction;
    const wrong = plan.options.find(o => !plan.correct.includes(o.id))!;
    plan.correct = [...plan.correct, wrong.id];
    expectRejected(qn, /plan: answer key/);
  });

  it('a numeric answer that cannot be typed on the keypad', () => {
    const qn = find('L4-mult', O.multFacts, x => x.interaction.type === 'numeric', 3);
    if (qn.interaction.type !== 'numeric') throw 0;
    qn.interaction.answer = qn.interaction.max + 1;
    expectRejected(qn, /numeric/);
  });

  it('an equation with no unique solution', () => {
    const qn = find('L2-missing', O.missingNumber, () => true);
    if (qn.math.kind !== 'equation') throw 0;
    qn.math.claim = { left: E.mul(E.X, 0), rel: '=', right: 0 };
    expectRejected(qn, /integer solutions/);
  });

  it('a rule machine whose key does not follow from the shown examples', () => {
    const qn = find('L4-patterns', G.ruleMachine, () => true);
    if (qn.interaction.type !== 'choice') throw 0;
    const wrong = qn.interaction.options.find(o => !(qn.interaction as any).correct.includes(o.id))!;
    qn.interaction.correct = [wrong.id];
    expectRejected(qn, /function-table: answer key/);
  });

  it('grammar: "1 apples"', () => {
    const qn = find('L1-add', O.addObjects, () => true, 1);
    qn.explanation = `${qn.explanation} There is 1 apples.`;
    expectRejected(qn, /grammar/);
  });

  it('every mutation-free sample still validates (control)', () => {
    const qn = find('L4-fracequiv', F.fracEquivWhich, () => true);
    expect(validateQuestion(qn)).toEqual([]);
  });
});
