import { describe, expect, it } from 'vitest';
import { attemptsCSV, backupJSON, csvCell, parseBackup, parseCSV, skillsCSV } from '../../src/data/export';
import { freshProfile, freshState, migrateV1, repairState, sanitizeNickname } from '../../src/data/schema';
import { KEY_STATE, KEY_V1_BACKUP, loadState, MemoryKV, Store } from '../../src/data/storage';
import { emptyRecord, pushAttempt, skillState } from '../../src/learning/mastery';

/** A realistic v1.1 save (shape taken from legacy/index-v1.1-original.html Profile.fresh()). */
const V1 = {
  profile: {
    mascot: 'owl', coins: 137, xp: 400, unlocked: ['fox', 'owl'], badges: { first: '2025-09-01T10:00:00.000Z', perfect: '2025-09-02T10:00:00.000Z' },
    streak: { count: 4, last: '2025-9-3' }, totals: { correct: 61, answered: 80, timeMs: 1_800_000 },
    stats: {
      k: { k_shapes: { attempts: 10, correct: 9, stars: 3, bestPct: 90, timeMs: 60000, mastered: true, plays: 2 }, k_position: { attempts: 5, correct: 3, stars: 1, bestPct: 60, timeMs: 30000, mastered: false, plays: 1 } },
      '3': { g3_frac: { attempts: 20, correct: 15, stars: 2, bestPct: 80, timeMs: 120000, mastered: false, plays: 2 } },
    },
    history: [{ d: 1756720000000, g: '3', t: 'g3_frac', q: 'What fraction of the bar is shaded?', ok: 1, ms: 5000, diff: 2 }],
  },
  settings: { sound: false, voice: true, slow: true, large: true, motion: false, contrast: false, name: 'Ada Lovelace!!' },
  lastGrade: '3',
};

describe('v1.1 → v2 migration (no progress is reset)', () => {
  it('maps grades to levels and topics to skills, preserving everything', () => {
    const st = migrateV1(V1, 5);
    const p = st.profiles[st.activeProfileId]!;
    expect(p.coins).toBe(137);
    expect(p.mascot).toBe('owl');
    expect(p.unlocked).toEqual(['fox', 'owl']);
    expect(Object.keys(p.badges)).toEqual(['first', 'perfect']);
    expect(p.totals).toEqual({ correct: 61, answered: 80, timeMs: 1_800_000 });
    expect(p.level).toBe(4); // grade 3 → Level 4
    expect(p.nickname).toBe('Ada Lovelace');
    // k_shapes + k_position merge into L1-shapes
    expect(p.skills['L1-shapes']!.legacy).toEqual({ attempts: 15, correct: 12, mastered: true, stars: 3, bestPct: 90 });
    expect(p.skills['L1-shapes']!.stars).toBe(3);
    expect(p.skills['L4-fracequiv']!.legacy!.attempts).toBe(20);
    expect(p.legacyTrophies).toEqual(['L1-shapes']);
    expect(p.history[0]).toMatchObject({ skill: 'L4-fracequiv', level: 4, ok: 1, legacy: 1 });
    expect(p.practiceDays).toEqual(['2025-09-03']);
    expect(st.settings).toMatchObject({ sound: false, slow: true, large: true });
  });

  it('legacy trophies map to "ready for a Skill Check", not to mastery (evidence rules changed)', () => {
    const st = migrateV1(V1);
    const p = st.profiles[st.activeProfileId]!;
    expect(skillState(p.skills['L1-shapes'])).toBe('ready');
    expect(skillState(p.skills['L4-fracequiv'])).toBe('practicing');
  });

  it('loadState migrates once, keeps v1 keys untouched, and writes a backup copy', async () => {
    const kv = new MemoryKV();
    await kv.set('mq_profile', JSON.stringify(V1.profile));
    await kv.set('mq_settings', JSON.stringify(V1.settings));
    await kv.set('mq_lastGrade', JSON.stringify('3'));
    const r = await loadState(kv);
    expect(r.source).toBe('migrated-v1');
    expect(await kv.get('mq_profile')).toBe(JSON.stringify(V1.profile));
    expect(JSON.parse((await kv.get(KEY_V1_BACKUP))!).data.mq_profile.coins).toBe(137);
    expect(JSON.parse((await kv.get(KEY_STATE))!).schemaVersion).toBe(2);
    const again = await loadState(kv);
    expect(again.source).toBe('v2');
    expect(again.state.profiles[again.state.activeProfileId]!.coins).toBe(137);
  });

  it('survives garbage v1 data', () => {
    const st = migrateV1({ profile: { coins: 'lots', stats: { k: { nope: 1, k_count: 'x' } }, history: [null, 3] }, settings: 7 });
    expect(repairState(st)).not.toBeNull();
  });
});

describe('state validation & storage', () => {
  it('repairs out-of-range and unknown data instead of crashing', () => {
    const st = freshState() as any;
    const p = st.profiles[st.activeProfileId];
    p.coins = -50; p.level = 9; p.skills = { 'L1-count': { stars: 99, attempts: [{ bad: 1 }] }, 'X-unknown': {} };
    p.totals = { answered: 1, correct: 5, timeMs: 0 };
    const r = repairState(st)!;
    const q = r.profiles[r.activeProfileId]!;
    expect(q.coins).toBe(0);
    expect(q.level).toBe(1);
    expect(q.skills['L1-count']!.stars).toBe(3);
    expect(q.skills['L1-count']!.attempts).toEqual([]);
    expect(q.skills['X-unknown']).toBeUndefined();
    expect(q.totals.correct).toBe(1);
  });
  it('keeps a copy of corrupt data and starts fresh', async () => {
    const kv = new MemoryKV();
    await kv.set(KEY_STATE, '{not json');
    const r = await loadState(kv, 42);
    expect(r.source).toBe('repaired-corrupt');
    expect(await kv.get('mq2_corrupt_42')).toBe('{not json');
  });
  it('REGRESSION: loading the app does not record a practice day', async () => {
    const kv = new MemoryKV();
    const s = new Store(kv); await s.init();
    expect(s.state.profiles[s.state.activeProfileId]!.practiceDays).toEqual([]);
  });
  it('erase removes every MathQuest key', async () => {
    const kv = new MemoryKV();
    await kv.set('mq_profile', '{}'); await kv.set(KEY_STATE, '{}'); await kv.set('other_app', 'keep');
    const s = new Store(kv); await s.init(); await s.eraseAll();
    expect(await kv.keys()).toEqual(['other_app']);
  });
  it('nicknames are sanitized and short', () => {
    expect(sanitizeNickname('  <script>alert(1)</script> ')).toBe('scriptalert1script');
    expect(sanitizeNickname('a'.repeat(40))).toHaveLength(18);
    expect(sanitizeNickname('')).toBe('Explorer');
  });
});

describe('exports', () => {
  const profile = () => {
    const p = freshProfile('Sam, "the" great');
    const r = emptyRecord();
    pushAttempt(r, { t: 0, qid: 'q', sig: 's', mode: 'solve', diff: 1, ctx: 'practice', correct: true, firstTry: true, tries: 1, hints: 0, guess: 0.25, ms: 3000 });
    pushAttempt(r, { t: 1, qid: 'q2', sig: 's2', mode: 'explain', diff: 2, ctx: 'reasoning', correct: true, firstTry: false, tries: 2, hints: 1, guess: 0.25, ms: 9000 });
    p.skills['L2-add20'] = r;
    return p;
  };
  it('REGRESSION: CSV exports are single, valid RFC 4180 tables with a BOM', () => {
    for (const csv of [skillsCSV(profile()), attemptsCSV(profile())]) {
      expect(csv.startsWith('﻿')).toBe(true);
      const rows = parseCSV(csv);
      expect(rows.length).toBeGreaterThan(1);
      expect(new Set(rows.map(r => r.length)).size).toBe(1); // one table, consistent width
    }
    const rows = parseCSV(skillsCSV(profile()));
    expect(rows[1]![0]).toBe('Sam the great');
    expect(rows[1]![6]).toBe('1'); // independent_correct
    expect(rows[1]![7]).toBe('1'); // assisted_correct
  });
  it('defuses spreadsheet formula injection', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell(-5)).toBe('"-5"');
  });
  it('backup round-trips and rejects foreign files', () => {
    const st = freshState();
    st.profiles[st.activeProfileId] = { ...profile(), id: st.activeProfileId };
    const back = parseBackup(backupJSON(st));
    expect(back.profiles[st.activeProfileId]!.skills['L2-add20']!.attempts).toHaveLength(2);
    expect(() => parseBackup('{"hello":1}')).toThrow(/not a MathQuest backup/);
    expect(() => parseBackup('nope')).toThrow();
  });
});
