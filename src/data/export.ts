/** Parent data export (CSV, RFC 4180 + UTF-8 BOM) and JSON backup/restore. */
import { SKILL_INDEX } from '../curriculum/levels';
import { isAssisted, isIndependent, skillState, STATE_LABEL } from '../learning/mastery';
import { SKILL_GENERATORS } from '../engine/registry';
import { repairState, type AppState, type ChildProfile } from './schema';

const BOM = '﻿';
/** Quote every field; defuse spreadsheet formula injection for text cells. */
export function csvCell(v: unknown): string {
  let s = v === null || v === undefined ? '' : String(v);
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}
export const csvRow = (cells: unknown[]): string => cells.map(csvCell).join(',');

export function skillsCSV(p: ChildProfile): string {
  const head = ['profile', 'level', 'skill_id', 'skill', 'state', 'items_recorded', 'independent_correct', 'assisted_correct', 'not_yet', 'hints_used', 'best_round_pct', 'stars', 'provisional_mastery_date', 'retained_mastery_date', 'earlier_version_attempts', 'earlier_version_correct'];
  const rows = [csvRow(head)];
  for (const [id, rec] of Object.entries(p.skills)) {
    const s = SKILL_INDEX[id];
    if (!s) continue;
    const hasReasoning = (SKILL_GENERATORS[id] ?? []).some(e => e.gen.mode !== 'solve' && e.gen.mode !== 'story');
    rows.push(csvRow([
      p.nickname, `Level ${s.level}`, id, s.name, STATE_LABEL[skillState(rec, hasReasoning)], rec.attempts.length,
      rec.attempts.filter(isIndependent).length, rec.attempts.filter(isAssisted).length, rec.attempts.filter(a => !a.correct).length,
      rec.attempts.filter(a => a.hints > 0).length, rec.bestPct, rec.stars,
      rec.provisionalAt ? new Date(rec.provisionalAt).toISOString().slice(0, 10) : '', rec.retainedAt ? new Date(rec.retainedAt).toISOString().slice(0, 10) : '',
      rec.legacy?.attempts ?? '', rec.legacy?.correct ?? '',
    ]));
  }
  return BOM + rows.join('\r\n') + '\r\n';
}

export function attemptsCSV(p: ChildProfile): string {
  const head = ['profile', 'date_time', 'level', 'skill_id', 'skill', 'activity', 'mode', 'difficulty', 'result', 'independent', 'hints', 'tries', 'seconds'];
  const rows = [csvRow(head)];
  for (const [id, rec] of Object.entries(p.skills)) {
    const s = SKILL_INDEX[id];
    for (const a of rec.attempts) {
      rows.push(csvRow([p.nickname, new Date(a.t).toISOString(), `Level ${s?.level ?? ''}`, id, s?.name ?? id, a.ctx, a.mode, a.diff, a.correct ? 'correct' : 'not yet', isIndependent(a) ? 'yes' : 'no', a.hints, a.tries, Math.round(a.ms / 1000)]));
    }
  }
  return BOM + rows.join('\r\n') + '\r\n';
}

export interface Backup { app: 'MathQuest Kids'; kind: 'backup'; version: number; exportedAt: string; state: AppState }
export function backupJSON(state: AppState): string {
  const b: Backup = { app: 'MathQuest Kids', kind: 'backup', version: 2, exportedAt: new Date().toISOString(), state };
  return JSON.stringify(b, null, 1);
}
/** Parse and validate a backup file. Throws a friendly error on anything unexpected. */
export function parseBackup(text: string): AppState {
  let obj: unknown;
  try { obj = JSON.parse(text.replace(/^﻿/, '')); } catch { throw new Error('This file is not a MathQuest backup (it is not valid JSON).'); }
  const o = obj as Partial<Backup>;
  if (!o || o.app !== 'MathQuest Kids' || o.kind !== 'backup') throw new Error('This file is not a MathQuest backup.');
  const st = repairState(o.state);
  if (!st) throw new Error('The backup is damaged or from an unsupported version.');
  return st;
}

/** Strict RFC 4180 parser (used by tests to prove exports are valid). */
export function parseCSV(text: string): string[][] {
  const s = text.replace(/^﻿/, '');
  const rows: string[][] = [];
  let row: string[] = [], cell = '', i = 0, quoted = false;
  while (i < s.length) {
    const c = s[i]!;
    if (quoted) {
      if (c === '"' && s[i + 1] === '"') { cell += '"'; i += 2; continue; }
      if (c === '"') { quoted = false; i++; continue; }
      cell += c; i++; continue;
    }
    if (c === '"') { if (cell !== '') throw new Error('quote inside unquoted cell'); quoted = true; i++; continue; }
    if (c === ',') { row.push(cell); cell = ''; i++; continue; }
    if (c === '\r' && s[i + 1] === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; i += 2; continue; }
    if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; i++; continue; }
    cell += c; i++;
  }
  if (quoted) throw new Error('unterminated quote');
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
