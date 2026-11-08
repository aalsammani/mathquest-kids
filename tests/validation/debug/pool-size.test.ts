// Developer probe: distinct visible questions per generator × difficulty for selected skills.
import { test } from 'vitest';
import { buildQuestion, SKILL_GENERATORS } from '../../../src/engine/registry';
import { visibleKey } from '../../../src/learning/session';
import type { Difficulty } from '../../../src/core/types';

const SKILLS = (process.env.MQ_SKILLS ?? 'L1-count,L1-add,L1-shapes,L1-patterns,L3-equalgroups,L4-fracline,L4-geometry').split(',');
test('pool sizes', () => {
  for (const s of SKILLS) for (const e of SKILL_GENERATORS[s]!) for (const d of [1, 2, 3] as Difficulty[]) {
    if ((e.minDiff ?? 1) > d) continue;
    const keys = new Set<string>(); let ok = 0;
    for (let seed = 1; seed <= 3000; seed++) { try { const q = buildQuestion(s, e.gen, d, seed * 2654435761 >>> 0); if (q.validation.status === 'validated') { ok++; keys.add(visibleKey(q)); } } catch { /* */ } }
    console.log(`${s.padEnd(15)} ${e.gen.id.padEnd(22)} mode=${e.gen.mode.padEnd(8)} d${d} valid=${ok} distinct=${keys.size}`);
  }
});
