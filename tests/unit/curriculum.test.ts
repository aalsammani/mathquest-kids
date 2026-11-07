import { describe, expect, it } from 'vitest';
import { holds } from '../../src/core/expr';
import { ALL_SKILLS, LEVELS, LEGACY_TOPIC_TO_SKILL, SKILL_INDEX } from '../../src/curriculum/levels';
import { FAMILY, LESSONS } from '../../src/curriculum/lessons';
import type { Question } from '../../src/core/types';
import { validateQuestion } from '../../src/engine/validate';

const V1_TOPICS = ['k_count', 'k_compare', 'k_shapes', 'k_patterns', 'k_position', 'k_sort', 'k_addsub', 'k_stories', 'g1_add', 'g1_sub', 'g1_place', 'g1_skip', 'g1_compare', 'g1_time', 'g1_money', 'g1_measure', 'g1_stories', 'g2_add', 'g2_sub', 'g2_place', 'g2_time', 'g2_money', 'g2_measure', 'g2_frac', 'g2_array', 'g2_stories', 'g3_mult', 'g3_div', 'g3_frac', 'g3_area', 'g3_measure', 'g3_geo', 'g3_data', 'g3_round', 'g3_pattern', 'g3_stories'];

describe('curriculum structure', () => {
  it('has exactly four levels labelled "Level 1"–"Level 4"', () => {
    expect(LEVELS.map(l => l.label)).toEqual(['Level 1', 'Level 2', 'Level 3', 'Level 4']);
    for (const l of LEVELS) expect(`${l.label} ${l.title} ${l.world}`).not.toMatch(/kindergarten|grade/i);
  });
  it('every v1.1 topic migrates to a skill (no content silently removed)', () => {
    for (const t of V1_TOPICS) expect(LEGACY_TOPIC_TO_SKILL[t], t).toBeDefined();
  });
  it('prerequisites exist and never point to a higher level', () => {
    for (const s of ALL_SKILLS) for (const p of s.prereqs) {
      expect(SKILL_INDEX[p], `${s.id} → ${p}`).toBeDefined();
      expect(SKILL_INDEX[p]!.level).toBeLessThanOrEqual(s.level);
    }
  });
  it('child-facing skill names never use grade terminology', () => {
    for (const s of ALL_SKILLS) expect(`${s.name} ${s.desc}`).not.toMatch(/grade|kindergarten/i);
  });
});

describe('lessons', () => {
  it('every skill has a lesson whose worked-example arithmetic is verified', () => {
    for (const s of ALL_SKILLS) {
      const l = LESSONS[s.id];
      expect(l, s.id).toBeDefined();
      expect(l!.intro.length).toBeGreaterThanOrEqual(2);
      expect(l!.worked.steps.length).toBeGreaterThanOrEqual(2);
      for (const c of l!.worked.claims) expect(holds(c), `${s.id}: ${JSON.stringify(c)}`).toBe(true);
    }
  });
  it('lesson visuals are representable (checked by the question validator)', () => {
    for (const [id, l] of Object.entries(LESSONS)) {
      const fake = { prompt: 'x', hints: ['a', 'b'], explanation: 'x', answerText: 'x', steps: [], interaction: { type: 'numeric', answer: 1, accept: [], min: 0, max: 9 }, math: { kind: 'claims' }, visual: l.demo } as unknown as Question;
      const visualIssues = validateQuestion(fake).filter(i => i.startsWith('visual') || i.startsWith('numberline') || i.startsWith('fracbar') || i.startsWith('bargraph'));
      expect(visualIssues, id).toEqual([]);
    }
  });
  it('lessons avoid keyword-shortcut rules', () => {
    for (const [id, l] of Object.entries(LESSONS)) expect(JSON.stringify(l), id).not.toMatch(/means (add|subtract)!|key ?word/i);
  });
});

describe('family activities', () => {
  it('cover every level, are free and practical', () => {
    for (const lv of [1, 2, 3, 4]) expect(FAMILY.filter(f => f.level === lv).length).toBeGreaterThanOrEqual(3);
    for (const f of FAMILY) expect(JSON.stringify(f)).not.toMatch(/buy|purchase|\$\d{2,}/i);
  });
});
