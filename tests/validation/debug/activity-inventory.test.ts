// Generates docs/ACTIVITY_INVENTORY.md from the code: every skill activity with its generators,
// interaction types, sampled question variety, and session lengths.  npm run docs:activities
import { writeFileSync } from 'node:fs';
import { test } from 'vitest';
import { LEVELS } from '../../../src/curriculum/levels';
import { buildQuestion, SKILL_GENERATORS } from '../../../src/engine/registry';
import { planSession, visibleKey } from '../../../src/learning/session';
import type { Difficulty } from '../../../src/core/types';

const SEEDS = 600;

test('activity inventory', () => {
  const out: string[] = [
    '# Activity inventory (generated)',
    '',
    `Generated from the source by \`npm run docs:activities\`. "Distinct questions" counts different questions a child could see (prompt, picture and answer labels), sampled from ${SEEDS} seeds per generator and difficulty, so it is a lower bound. Every question shown is checked by the independent validator first (\`src/engine/validate.ts\`). Session lengths are from \`planSession\`. The audit notes are in [ACTIVITY_AUDIT.md](ACTIVITY_AUDIT.md).`,
    '',
  ];
  for (const L of LEVELS) {
    out.push(`## ${L.label}: ${L.world}`, '', '| Skill | Topic | Objective | Generators (mode) | Answer types | Distinct questions (d1 / d2 / d3) | Practice · Skill Check · Check-back |', '|---|---|---|---|---|---|---|');
    for (const s of L.skills) {
      const gens = SKILL_GENERATORS[s.id] ?? [];
      const types = new Set<string>();
      const byDiff = ([1, 2, 3] as Difficulty[]).map(d => {
        const keys = new Set<string>();
        for (const e of gens) {
          if ((e.minDiff ?? 1) > d) continue;
          for (let k = 1; k <= SEEDS; k++) {
            try { const q = buildQuestion(s.id, e.gen, d, (k * 2654435761) >>> 0); if (q.validation.status === 'validated') { keys.add(visibleKey(q)); types.add(q.interaction.type); } } catch { /* counted as unavailable */ }
          }
        }
        return keys.size;
      });
      const story = s.id.endsWith('stories');
      const lengths = story ? `${planSession('stories', s.id).length} stories` : `${planSession('practice', s.id).length} · ${planSession('assessment', s.id).length} · ${planSession('review', s.id).length}`;
      out.push(`| ${s.icon} ${s.name} | ${s.domain} | ${s.objective.replace(/\|/g, '/')} | ${gens.map(e => `${e.gen.id} (${e.gen.mode})`).join(', ')} | ${[...types].sort().join(', ')} | ${byDiff.join(' / ')} | ${lengths} |`);
    }
    out.push('');
  }
  writeFileSync('docs/ACTIVITY_INVENTORY.md', out.join('\n'));
});
