/** Pure answer checking for every interaction type. Accepts ALL valid answers. */
import { eq, q } from '../core/rational';
import type { Interaction, Response } from '../core/types';

export interface CheckResult { correct: boolean; partial?: string }

export function checkResponse(inter: Interaction, r: Response): CheckResult {
  switch (inter.type) {
    case 'choice': return { correct: r.type === 'choice' && inter.correct.includes(r.id) };
    case 'numeric': return { correct: r.type === 'numeric' && (r.value === inter.answer || inter.accept.includes(r.value)) };
    case 'order': return { correct: r.type === 'order' && r.ids.join() === inter.correctOrder.join() };
    case 'numberline': return { correct: r.type === 'numberline' && eq(q(r.value[0], r.value[1]), q(inter.answer[0], inter.answer[1])) };
    case 'shade': return { correct: r.type === 'shade' && r.count === inter.answer };
    case 'array': {
      if (r.type !== 'array') return { correct: false };
      const ok = r.rows * r.cols === inter.product && r.rows >= 1 && r.cols >= 1 && r.rows <= inter.maxRows && r.cols <= inter.maxCols && (inter.fixedRows === undefined || r.rows === inter.fixedRows);
      return { correct: ok, ...(r.rows * r.cols !== inter.product ? { partial: `That array shows ${r.rows * r.cols}.` } : {}) };
    }
    case 'tf': {
      if (r.type !== 'tf') return { correct: false };
      const truthOk = r.truth === inter.truth;
      const justOk = inter.correctJust.includes(r.justId);
      return { correct: truthOk && justOk, ...(truthOk && !justOk ? { partial: 'You picked true/false correctly — now look again at the reason.' } : !truthOk ? { partial: '' } : {}) };
    }
    case 'match': {
      if (r.type !== 'match') return { correct: false };
      const want = new Set(inter.pairs.map(([a, b]) => `${a}>${b}`));
      return { correct: r.pairs.length === inter.pairs.length && r.pairs.every(([a, b]) => want.has(`${a}>${b}`)) };
    }
  }
}

/** Human-readable correct answer for feedback. */
export function answerLabel(inter: Interaction): string {
  switch (inter.type) {
    case 'choice': return inter.options.filter(o => inter.correct.includes(o.id)).map(o => o.label).join(' or ');
    case 'numeric': return `${inter.answer}${inter.unit ? ' ' + inter.unit : ''}`;
    case 'order': return inter.correctOrder.map(id => inter.items.find(i => i.id === id)!.label).join(', ');
    case 'numberline': return inter.answer[1] === 1 ? String(inter.answer[0]) : `${inter.answer[0]}/${inter.answer[1]}`;
    case 'shade': return `${inter.answer} of ${inter.parts} parts`;
    case 'array': {
      const pairs: string[] = [];
      for (let r = 1; r <= inter.maxRows; r++) if (inter.product % r === 0 && inter.product / r <= inter.maxCols && (inter.fixedRows === undefined || r === inter.fixedRows)) pairs.push(`${r} rows of ${inter.product / r}`);
      return pairs.join(' or ');
    }
    case 'tf': return `${inter.truth ? 'True' : 'False'} — ${inter.justifications.find(j => inter.correctJust.includes(j.id))?.label ?? ''}`;
    case 'match': return inter.pairs.map(([a, b]) => `${inter.left.find(x => x.id === a)!.label} → ${inter.right.find(x => x.id === b)!.label}`).join('; ');
  }
}
