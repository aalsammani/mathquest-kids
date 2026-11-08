import { it } from 'vitest';
import type { Difficulty, Question } from '../../../src/core/types';
import { buildQuestion, SKILL_GENERATORS } from '../../../src/engine/registry';
const ans = (q: Question) => { const i = q.interaction; switch (i.type) { case 'choice': return i.options.filter(o => i.correct.includes(o.id)).map(o => o.label).join(' | '); case 'numeric': return String(i.answer); case 'tf': return `${i.truth} / ${i.justifications.find(j => i.correctJust.includes(j.id))?.label}`; default: return JSON.stringify((i as any).answer ?? (i as any).correctOrder ?? (i as any).product ?? (i as any).pairs); } };
const opts = (q: Question) => q.interaction.type === 'choice' ? q.interaction.options.map(o => o.label).join(' ; ') : q.interaction.type === 'tf' ? q.interaction.statement : '';
it('samples', () => {
  const seen = new Set<string>(); const out: string[] = [];
  for (const [skill, entries] of Object.entries(SKILL_GENERATORS)) for (const en of entries) {
    const key = en.gen.id; if (seen.has(key) && !key.startsWith('story')) continue; seen.add(key);
    const d = (Number(process.env.D ?? 2)) as Difficulty; const dd = Math.max(d, en.gen && (en.minDiff ?? 1)) as Difficulty;
    const q = buildQuestion(skill, en.gen, dd, Number(process.env.SEED ?? 777));
    out.push(`[${skill} ${key} d${dd}] ${q.story ? 'STORY: ' + q.story + ' ' : ''}Q: ${q.prompt}\n   OPTS: ${opts(q)}\n   ANS: ${ans(q)}\n   H1: ${q.hints[0]} | EXPL: ${q.explanation}`);
  }
  console.log(out.join('\n'));
});
