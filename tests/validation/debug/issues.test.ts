import { it } from 'vitest';
import type { Difficulty } from '../../../src/core/types';
import { buildQuestion, SKILL_GENERATORS } from '../../../src/engine/registry';
it('aggregate issues', () => {
  const N = Number(process.env.MQ_SAMPLES ?? 80);
  const agg = new Map<string, { n: number; ex: string }>();
  for (const [skill, entries] of Object.entries(SKILL_GENERATORS)) for (const en of entries) for (const d of [1, 2, 3] as Difficulty[]) {
    if ((en.minDiff ?? 1) > d) continue;
    for (let i = 0; i < N; i++) {
      const seed = (20261106 + i * 2654435761) >>> 0;
      let issues: string[]; let p = '';
      try { const q = buildQuestion(skill, en.gen, d, seed); issues = q.validation.issues; p = `${q.story ?? ''} ${q.prompt}`; } catch (e) { issues = ['THREW ' + (e as Error).message]; }
      for (const is of issues) {
        const key = `${en.gen.id} :: ${is.replace(/\d+/g, '#').slice(0, 110)}`;
        const cur = agg.get(key) ?? { n: 0, ex: '' };
        cur.n++; if (!cur.ex) cur.ex = `${is.slice(0, 260)} || ${p.slice(0, 160)}`;
        agg.set(key, cur);
      }
    }
  }
  const lines = [...agg.entries()].sort().map(([k, v]) => `${v.n}\t${k}\n\t\t${v.ex}`);
  console.log(lines.join('\n') || 'NO ISSUES');
});
