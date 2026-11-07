/** Regression tests for audit finding C1: failed generators must never be replaced by unrelated questions. */
import { afterEach, describe, expect, it } from 'vitest';
import type { GenDef } from '../../src/engine/genkit';
import { clearDiagnostics, diagnostics, GeneratorUnavailable, safeGenerate, SKILL_GENERATORS } from '../../src/engine/registry';
import { fracName } from '../../src/engine/generators/fractions';

const saved = { ...SKILL_GENERATORS };
afterEach(() => { Object.assign(SKILL_GENERATORS, saved); clearDiagnostics(); });

const broken: GenDef = { id: 'test.broken', version: 1, mode: 'solve', gen() { throw new Error('simulated failure'); } };
const invalid: GenDef = {
  id: 'test.invalid', version: 1, mode: 'solve',
  gen: (rng, d) => { const q = fracName.gen(rng, d); if (q.interaction.type === 'choice') q.interaction.correct = []; return q; },
};

describe('safeGenerate failure handling', () => {
  it('never falls back to unrelated addition when a fraction generator fails', () => {
    SKILL_GENERATORS['L3-fractions'] = [{ gen: broken, weight: 1 }];
    expect(() => safeGenerate('L3-fractions', 1, 123)).toThrow(GeneratorUnavailable);
  });

  it('uses another generator FROM THE SAME SKILL when one fails', () => {
    SKILL_GENERATORS['L3-fractions'] = [{ gen: broken, weight: 100 }, { gen: fracName, weight: 1 }];
    for (let s = 0; s < 30; s++) {
      const qn = safeGenerate('L3-fractions', 2, s);
      expect(qn.skill).toBe('L3-fractions');
      expect(qn.generatorId).toBe('frac.name');
      expect(qn.validation.status).toBe('validated');
    }
  });

  it('rejects invalid questions instead of showing them, and logs a diagnostic without child data', () => {
    SKILL_GENERATORS['L3-fractions'] = [{ gen: invalid, weight: 1 }];
    expect(() => safeGenerate('L3-fractions', 1, 9)).toThrow(GeneratorUnavailable);
    const d = diagnostics();
    expect(d.length).toBeGreaterThan(0);
    expect(Object.keys(d[0]!).sort()).toEqual(['diff', 'generator', 'issue', 'seed', 'skill', 't']);
  });

  it('returns only validated questions for every skill', () => {
    for (const skill of Object.keys(saved)) {
      for (const diff of [1, 2, 3] as const) {
        const qn = safeGenerate(skill, diff, 4242 + diff);
        expect(qn.skill).toBe(skill);
        expect(qn.validation.status).toBe('validated');
      }
    }
  });

  it('avoids recently seen signatures when it can', () => {
    const seen = new Set<string>();
    for (let s = 0; s < 8; s++) seen.add(safeGenerate('L4-mult', 3, s, { avoidSignatures: seen }).signature);
    expect(seen.size).toBe(8);
  });

  it('restricts to reasoning modes when asked', () => {
    const qn = safeGenerate('L2-add20', 2, 5, { modes: ['mistake', 'another-way', 'explain'] });
    expect(['mistake', 'another-way', 'explain']).toContain(qn.mode);
  });
});
