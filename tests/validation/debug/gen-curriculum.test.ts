/** Generates docs/CURRICULUM.md from the shipped curriculum + generator registry (run: npm run docs:curriculum). */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { it } from 'vitest';
import { DOMAINS, LEVELS, SKILL_INDEX } from '../../../src/curriculum/levels';
import { FAMILY, LESSONS } from '../../../src/curriculum/lessons';
import { SKILL_GENERATORS } from '../../../src/engine/registry';

const MODE: Record<string, string> = { solve: 'Think & Solve', explain: 'Explain Your Thinking', mistake: 'Find the Mistake', 'another-way': 'Solve It Another Way', detective: 'Math Detective', story: 'Story Adventure' };

it('writes docs/CURRICULUM.md', () => {
  const L: string[] = [];
  L.push('# Curriculum: Four Learning Levels', '',
    '> **Generated from source** (`src/curriculum/levels.ts`, `src/curriculum/lessons.ts`, `src/engine/registry.ts`) by `npm run docs:curriculum`. Do not edit by hand.', '',
    'Children see only **Level 1–4** (with optional world names). Levels describe *competencies*, not ages or school grades; a child can work at any level, and the optional "Find my level" check suggests a starting point that a grown-up can override.', '',
    'The Common Core (CCSS-M) codes are an **approximate, parent-facing interpretation aid**. They have not been reviewed by a standards-alignment expert (see `docs/KNOWN_LIMITATIONS.md`).', '',
    '## Instructional sequence (every skill)', '',
    '1. **Lesson**: a big idea, a concrete visual model, and a worked example revealed one step at a time (concrete → representational → abstract).',
    '2. **Guided practice**: easier items with visuals; hints and a second try are available.',
    '3. **Independent practice**: difficulty adapts to evidence (two independent successes → harder; two misses → easier).',
    '4. **Reasoning**: Explain Your Thinking, Find the Mistake, Solve It Another Way, and Math Detective items.',
    '5. **Skill Check**: six items, no hints, one try. Passing gives *provisional* mastery.',
    '6. **Check-back**: five items after a parent-chosen delay (1/3/7 days). Passing shows *retained* mastery.',
    '7. **Daily Review**: mixed retrieval practice across learned skills.', '',
    '## Levels at a glance', '', '| Level | World | Title | Focus | Approx. standards (parents) | Skills |', '|---|---|---|---|---|---|');
  for (const lv of LEVELS) L.push(`| ${lv.label} | ${lv.emoji} ${lv.world} | ${lv.title} | ${lv.focus} | ${lv.approxStandards} | ${lv.skills.length} |`);
  let totalGens = 0;
  for (const lv of LEVELS) {
    L.push('', `## ${lv.label} — ${lv.title} (${lv.world})`, '', `**Focus:** ${lv.focus}.`, '', '| Skill | Domain | Objective | Prerequisites | CCSS (approx.) | Question generators (mode) |', '|---|---|---|---|---|---|');
    for (const s of lv.skills) {
      const gens = (SKILL_GENERATORS[s.id] ?? []).map(e => `\`${e.gen.id}\` (${MODE[e.gen.mode]}${e.minDiff ? `, from difficulty ${e.minDiff}` : ''})`);
      totalGens += gens.length;
      const pre = s.prereqs.map(p => SKILL_INDEX[p]!.name).join(', ') || '—';
      L.push(`| ${s.icon} **${s.name}** (\`${s.id}\`) | ${DOMAINS[s.domain]} | ${s.objective} | ${pre} | ${s.ccss.join(', ') || '—'} | ${gens.join('<br>')} |`);
    }
    L.push('', '**Lesson big ideas:**', '');
    for (const s of lv.skills) L.push(`- *${s.name}*: ${LESSONS[s.id]!.big}`);
    const modes = new Set(lv.skills.flatMap(s => (SKILL_GENERATORS[s.id] ?? []).map(e => e.gen.mode)));
    L.push('', `**Reasoning modes present in ${lv.label}:** ${[...modes].map(m => MODE[m]).join(', ')}.`);
  }
  L.push('', '## Math Story Adventures', '',
    'Each level has a story skill. Stories use 14 original settings (animal rescue, space station, ocean discovery, playground build, family cooking, garden, treasure hunt, market day, sports day, nature walk, robot lab, birthday party, picnic, library) and these problem structures:', '',
    '| Structure | Example shape | Levels |', '|---|---|---|',
    '| Join, result unknown | A has a, gets b more | 1–2 |', '| Separate, result unknown | A has a, gives b away | 1–3 |', '| Part–part–whole | A has a, B has b; how many in all | 1–2 |',
    '| Compare, difference unknown | How many more/fewer (drawn with a matching model, not take-away) | 1–3 |', '| Join, change unknown | A had a, got some, now c | 2–3 |',
    '| Compare, larger unknown | B has b; A has d more than B | 2 |', '| Separate, change unknown | A had a, gave some, has c left | 2–3 |', '| Join, start unknown | A had some, found b, now c | 3 |',
    '| "More" that needs subtraction | A has a. That is d more than B. How many does B have? | 3–4 |', '| Two-step | Finds more, then gives some away; or compare, then combine | 3–4 |',
    '| Equal groups, sharing, measurement division | Bags of p; share t into g bags; boxes of p | 4 |', '| Multi-step with ×/÷ | Packs × size − given away; trays × items ÷ tables | 4 |', '| Sufficient vs. missing information | "Mia has some marbles…" — is there enough information? | 3–4 |', '',
    'At higher difficulty, some stories include one clearly irrelevant number (e.g., "The market opens at 4 o\'clock."). The validator requires every number in the text to be either used in the solution or explicitly declared irrelevant. Deliberately underdetermined "Is there enough information?" items are generated by a separate, labelled generator.', '',
    'Each story runs **Read/Listen → Understand → Plan → Solve → Check → Explain → Celebrate**. The Understand, Plan and Explain steps are machine-checked: a plan is correct exactly when its equation has the story answer as its unique whole-number solution, so two different valid plans (e.g., `7 + ? = 12` and `12 − 7 = ?`) are both accepted.');
  L.push('', '## Family activities (offline)', '', '| Level | Activity | Talk about it |', '|---|---|---|');
  for (const f of FAMILY) L.push(`| ${f.level} | ${f.emoji} ${f.title} | ${f.talk} |`);
  L.push('', `_Totals: ${LEVELS.reduce((n, l) => n + l.skills.length, 0)} skills; ${totalGens} skill–generator assignments; ${FAMILY.length} family activities._`, '');
  writeFileSync(resolve(import.meta.dirname, '../../../docs/CURRICULUM.md'), L.join('\n'));
});
