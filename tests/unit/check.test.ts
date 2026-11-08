import { describe, expect, it } from 'vitest';
import { answerLabel, checkResponse } from '../../src/engine/check';
import { buildQuestion, SKILL_GENERATORS } from '../../src/engine/registry';
import type { Interaction, Response } from '../../src/core/types';

/** The canonical correct response for any interaction (used to prove keys are answerable). */
export function correctResponse(i: Interaction): Response {
  switch (i.type) {
    case 'choice': return { type: 'choice', id: i.correct[0]! };
    case 'numeric': return { type: 'numeric', value: i.answer };
    case 'order': return { type: 'order', ids: i.correctOrder };
    case 'numberline': return { type: 'numberline', value: i.answer };
    case 'shade': return { type: 'shade', count: i.answer };
    case 'array': { for (let r = 1; r <= i.maxRows; r++) if (i.product % r === 0 && i.product / r <= i.maxCols && (i.fixedRows === undefined || r === i.fixedRows)) return { type: 'array', rows: r, cols: i.product / r }; throw new Error('no array'); }
    case 'tf': return { type: 'tf', truth: i.truth, justId: i.correctJust[0]! };
    case 'match': return { type: 'match', pairs: i.pairs };
  }
}

describe('answer checking', () => {
  it('every generated question is answerable with its key, and a wrong answer is rejected', () => {
    for (const [skill, entries] of Object.entries(SKILL_GENERATORS)) for (const en of entries) for (const s of [1, 2, 3]) {
      const qn = buildQuestion(skill, en.gen, Math.max(2, en.minDiff ?? 1) as 2, s);
      expect(checkResponse(qn.interaction, correctResponse(qn.interaction)).correct, qn.id).toBe(true);
      expect(answerLabel(qn.interaction).length).toBeGreaterThan(0);
      const i = qn.interaction;
      if (i.type === 'choice') { const w = i.options.find(o => !i.correct.includes(o.id)); if (w) expect(checkResponse(i, { type: 'choice', id: w.id }).correct).toBe(false); }
      if (i.type === 'numeric') expect(checkResponse(i, { type: 'numeric', value: i.answer + 1 }).correct).toBe(false);
    }
  });
  it('accepts equivalent fractions on the number line and any valid array', () => {
    expect(checkResponse({ type: 'numberline', min: 0, max: 1, denom: 4, answer: [2, 4], labelEvery: 4 }, { type: 'numberline', value: [1, 2] }).correct).toBe(true);
    const arr: Interaction = { type: 'array', maxRows: 6, maxCols: 6, product: 12 };
    expect(checkResponse(arr, { type: 'array', rows: 3, cols: 4 }).correct).toBe(true);
    expect(checkResponse(arr, { type: 'array', rows: 4, cols: 3 }).correct).toBe(true);
    expect(checkResponse(arr, { type: 'array', rows: 2, cols: 6 }).correct).toBe(true);
    expect(checkResponse(arr, { type: 'array', rows: 3, cols: 3 }).correct).toBe(false);
  });
  it('true/false needs the right truth AND a valid reason', () => {
    const tf: Interaction = { type: 'tf', statement: 's', truth: true, justifications: [{ id: 'j1', label: 'a', value: 'a', truth: true }, { id: 'j2', label: 'b', value: 'b', truth: false }], correctJust: ['j1'] };
    expect(checkResponse(tf, { type: 'tf', truth: true, justId: 'j1' }).correct).toBe(true);
    expect(checkResponse(tf, { type: 'tf', truth: true, justId: 'j2' }).correct).toBe(false);
    expect(checkResponse(tf, { type: 'tf', truth: false, justId: 'j1' }).correct).toBe(false);
  });
});
