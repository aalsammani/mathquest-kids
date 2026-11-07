/**
 * Large-sample, fixed-seed validation of EVERY (skill, generator, difficulty) combination.
 * Produces reports/math-validation-report.json and reports/MATH_VALIDATION_SUMMARY.md.
 * Set MQ_SAMPLES to change the per-difficulty sample count (default 1000).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Difficulty } from '../../src/core/types';
import { buildQuestion, SKILL_GENERATORS } from '../../src/engine/registry';

const N = Number(process.env.MQ_SAMPLES ?? 1000);
const BASE_SEED = 20261106;

interface Row {
  skill: string; generator: string; version: number; difficulty: number;
  generated: number; valid: number; failures: number; threw: number;
  distinctSignatures: number; failureExamples: { seed: number; issues: string[]; prompt: string }[];
}

describe('math validation — every generator, fixed seeds', () => {
  const rows: Row[] = [];
  const started = Date.now();
  for (const [skill, entries] of Object.entries(SKILL_GENERATORS)) {
    for (const en of entries) {
      for (const diff of [1, 2, 3] as Difficulty[]) {
        if ((en.minDiff ?? 1) > diff) continue;
        it(`${skill} / ${en.gen.id} / d${diff}`, () => {
          const row: Row = { skill, generator: en.gen.id, version: en.gen.version, difficulty: diff, generated: 0, valid: 0, failures: 0, threw: 0, distinctSignatures: 0, failureExamples: [] };
          const sigs = new Set<string>();
          for (let i = 0; i < N; i++) {
            const seed = (BASE_SEED + i * 2654435761) >>> 0;
            row.generated++;
            try {
              const qn = buildQuestion(skill, en.gen, diff, seed);
              sigs.add(qn.signature);
              if (qn.validation.status === 'validated') row.valid++;
              else {
                row.failures++;
                if (row.failureExamples.length < 5) row.failureExamples.push({ seed, issues: qn.validation.issues, prompt: `${qn.story ?? ''} ${qn.prompt}`.trim() });
              }
            } catch (e) {
              row.threw++; row.failures++;
              if (row.failureExamples.length < 5) row.failureExamples.push({ seed, issues: [`threw: ${(e as Error).message}`], prompt: '' });
            }
          }
          row.distinctSignatures = sigs.size;
          rows.push(row);
          expect(row.failures, JSON.stringify(row.failureExamples, null, 1)).toBe(0);
        });
      }
    }
  }

  it('writes the machine-readable validation report', () => {
    const dir = resolve(import.meta.dirname, '../../reports');
    mkdirSync(dir, { recursive: true });
    const totals = rows.reduce((t, r) => ({ generated: t.generated + r.generated, valid: t.valid + r.valid, failures: t.failures + r.failures }), { generated: 0, valid: 0, failures: 0 });
    const report = {
      title: 'MathQuest Kids — mathematical validation report',
      generatedAt: new Date().toISOString(),
      method: 'Each question is produced from a fixed seed and checked by src/engine/validate.ts, which recomputes the answer from the givens using independent fact tables and exact rational arithmetic.',
      samplesPerDifficulty: N, baseSeed: BASE_SEED, durationMs: Date.now() - started,
      totals, status: totals.failures === 0 ? 'PASS' : 'FAIL',
      combinations: rows.length,
      rows,
    };
    writeFileSync(resolve(dir, 'math-validation-report.json'), JSON.stringify(report, null, 1));
    const lines = [
      '# Math validation summary', '',
      `Generated: ${report.generatedAt}  `,
      `Samples per (skill, generator, difficulty): ${N} · base seed ${BASE_SEED}  `,
      `Combinations: ${rows.length} · Questions: ${totals.generated} · Valid: ${totals.valid} · Failures: ${totals.failures} · **${report.status}**`, '',
      '| Skill | Generator | v | Diff | Generated | Valid | Failures | Distinct |', '|---|---|---|---|---|---|---|---|',
      ...rows.map(r => `| ${r.skill} | ${r.generator} | ${r.version} | ${r.difficulty} | ${r.generated} | ${r.valid} | ${r.failures} | ${r.distinctSignatures} |`),
    ];
    writeFileSync(resolve(dir, 'MATH_VALIDATION_SUMMARY.md'), lines.join('\n') + '\n');
    expect(rows.length).toBeGreaterThan(100);
  });
});
