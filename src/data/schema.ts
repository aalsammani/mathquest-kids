/** Persisted application state (schema v2), validation/repair, and v1.1 → v2 migration. */
import { ALL_SKILLS, LEGACY_GRADE_TO_LEVEL, LEGACY_TOPIC_TO_SKILL, SKILL_INDEX } from '../curriculum/levels';
import type { LevelId } from '../core/types';
import { emptyRecord, type SkillRecord } from '../learning/mastery';

export const SCHEMA_VERSION = 2;

export interface Settings { sound: boolean; voice: boolean; slow: boolean; large: boolean; motion: boolean; contrast: boolean; volume: number }
export interface ParentSettings { breakMinutes: 0 | 10 | 15 | 20 | 30; reviewDelayDays: 1 | 3 | 7; timedGames: boolean }
export interface HistoryEntry { d: number; skill: string; level: LevelId; q: string; ok: 0 | 1; hinted: 0 | 1; tries: number; ms: number; mode: string; ctx: string; legacy?: 1 }
export interface Counters { explain: number; mistake: number; anotherWay: number; detective: number; stories: number; persistence: number; tools: string[]; worlds: number[]; checksPassed: number }
export interface ChildProfile {
  id: string;
  nickname: string;
  mascot: string;
  createdAt: number;
  level: LevelId;
  coins: number;
  unlocked: string[];
  badges: Record<string, string>;
  practiceDays: string[];
  totals: { answered: number; correct: number; timeMs: number };
  skills: Record<string, SkillRecord>;
  history: HistoryEntry[];
  counters: Counters;
  familyDone: string[];
  placement?: { level: LevelId; at: number };
  legacyTrophies?: string[];
}
export interface AppState {
  schemaVersion: 2;
  activeProfileId: string;
  profiles: Record<string, ChildProfile>;
  settings: Settings;
  parent: ParentSettings;
  onboarded: boolean;
  migratedFromV1?: number;
}

export const DEFAULT_SETTINGS: Settings = { sound: true, voice: true, slow: false, large: false, motion: false, contrast: false, volume: 0.8 };
export const DEFAULT_PARENT: ParentSettings = { breakMinutes: 20, reviewDelayDays: 1, timedGames: false };
export const freshCounters = (): Counters => ({ explain: 0, mistake: 0, anotherWay: 0, detective: 0, stories: 0, persistence: 0, tools: [], worlds: [], checksPassed: 0 });

let idCounter = 0;
export function newId(): string {
  const r = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
  return `p-${Date.now().toString(36)}-${r}-${idCounter++}`;
}

export function freshProfile(nickname = 'Explorer', mascot = 'fox', level: LevelId = 1): ChildProfile {
  return {
    id: newId(), nickname: sanitizeNickname(nickname), mascot, createdAt: Date.now(), level,
    coins: 0, unlocked: ['fox'], badges: {}, practiceDays: [], totals: { answered: 0, correct: 0, timeMs: 0 },
    skills: {}, history: [], counters: freshCounters(), familyDone: [],
  };
}
export function freshState(): AppState {
  const p = freshProfile();
  return { schemaVersion: 2, activeProfileId: p.id, profiles: { [p.id]: p }, settings: { ...DEFAULT_SETTINGS }, parent: { ...DEFAULT_PARENT }, onboarded: false };
}

/** Nicknames only: letters, numbers, spaces, - and '. Max 18 chars. No full names/emails are requested. */
export function sanitizeNickname(s: unknown): string {
  const t = String(s ?? '').normalize('NFC').replace(/[^\p{L}\p{N} '\-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 18);
  return t || 'Explorer';
}

/* ------------------------------------------------------------------ validation / repair */
const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const num = (x: unknown, d: number, lo = -Infinity, hi = Infinity) => (typeof x === 'number' && Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : d);
const bool = (x: unknown, d: boolean) => (typeof x === 'boolean' ? x : d);
const lvl = (x: unknown): LevelId => ([1, 2, 3, 4].includes(x as number) ? (x as LevelId) : 1);

function repairSkill(x: unknown): SkillRecord {
  const r = emptyRecord();
  if (!isObj(x)) return r;
  r.stars = num(x.stars, 0, 0, 3);
  r.bestPct = num(x.bestPct, 0, 0, 100);
  r.plays = num(x.plays, 0, 0);
  r.timeMs = num(x.timeMs, 0, 0);
  if (typeof x.provisionalAt === 'number') r.provisionalAt = x.provisionalAt;
  if (typeof x.retainedAt === 'number') r.retainedAt = x.retainedAt;
  if (isObj(x.lastCheck)) r.lastCheck = x.lastCheck as never;
  if (isObj(x.legacy)) r.legacy = { attempts: num(x.legacy.attempts, 0, 0), correct: num(x.legacy.correct, 0, 0), mastered: bool(x.legacy.mastered, false), stars: num(x.legacy.stars, 0, 0, 3), bestPct: num(x.legacy.bestPct, 0, 0, 100) };
  if (Array.isArray(x.attempts)) {
    r.attempts = x.attempts.filter(isObj).filter(a => typeof a.t === 'number' && typeof a.sig === 'string' && typeof a.correct === 'boolean').map(a => ({
      t: a.t as number, qid: String(a.qid ?? ''), sig: a.sig as string, mode: (a.mode as never) ?? 'solve', diff: ([1, 2, 3].includes(a.diff as number) ? a.diff : 1) as never,
      ctx: (a.ctx as never) ?? 'practice', correct: a.correct as boolean, firstTry: bool(a.firstTry, false), tries: num(a.tries, 1, 1, 3), hints: num(a.hints, 0, 0, 5), guess: num(a.guess, 0, 0, 1), ms: num(a.ms, 0, 0),
    })).slice(-60);
  }
  return r;
}

function repairProfile(x: unknown): ChildProfile | null {
  if (!isObj(x) || typeof x.id !== 'string') return null;
  const p = freshProfile();
  p.id = x.id;
  p.nickname = sanitizeNickname(x.nickname);
  p.mascot = typeof x.mascot === 'string' ? x.mascot : 'fox';
  p.createdAt = num(x.createdAt, Date.now());
  p.level = lvl(x.level);
  p.coins = num(x.coins, 0, 0, 1e7);
  p.unlocked = Array.isArray(x.unlocked) ? [...new Set(['fox', ...x.unlocked.filter(u => typeof u === 'string')])] as string[] : ['fox'];
  p.badges = isObj(x.badges) ? Object.fromEntries(Object.entries(x.badges).filter(([, v]) => typeof v === 'string')) as Record<string, string> : {};
  p.practiceDays = Array.isArray(x.practiceDays) ? (x.practiceDays.filter(d => typeof d === 'string') as string[]).slice(-120) : [];
  const t = isObj(x.totals) ? x.totals : {};
  p.totals = { answered: num(t.answered, 0, 0), correct: num(t.correct, 0, 0), timeMs: num(t.timeMs, 0, 0) };
  if (p.totals.correct > p.totals.answered) p.totals.correct = p.totals.answered;
  p.skills = {};
  if (isObj(x.skills)) for (const [k, v] of Object.entries(x.skills)) if (SKILL_INDEX[k]) p.skills[k] = repairSkill(v);
  p.history = Array.isArray(x.history) ? (x.history.filter(isObj) as never[]).slice(0, 200) : [];
  const c = isObj(x.counters) ? x.counters : {};
  p.counters = { ...freshCounters(), ...Object.fromEntries(Object.entries(c).filter(([k]) => k in freshCounters())) } as never;
  if (!Array.isArray(p.counters.tools)) p.counters.tools = [];
  if (!Array.isArray(p.counters.worlds)) p.counters.worlds = [];
  p.familyDone = Array.isArray(x.familyDone) ? x.familyDone.filter(s => typeof s === 'string') as string[] : [];
  if (isObj(x.placement)) p.placement = { level: lvl(x.placement.level), at: num(x.placement.at, Date.now()) };
  if (Array.isArray(x.legacyTrophies)) p.legacyTrophies = x.legacyTrophies.filter(s => typeof s === 'string') as string[];
  return p;
}

/** Validate and repair untrusted state. Returns null when it is not a v2 state at all. */
export function repairState(x: unknown): AppState | null {
  if (!isObj(x) || x.schemaVersion !== 2 || !isObj(x.profiles)) return null;
  const profiles: Record<string, ChildProfile> = {};
  for (const v of Object.values(x.profiles)) { const p = repairProfile(v); if (p) profiles[p.id] = p; }
  if (!Object.keys(profiles).length) { const p = freshProfile(); profiles[p.id] = p; }
  const s = isObj(x.settings) ? x.settings : {};
  const pa = isObj(x.parent) ? x.parent : {};
  const active = typeof x.activeProfileId === 'string' && profiles[x.activeProfileId] ? x.activeProfileId : Object.keys(profiles)[0]!;
  return {
    schemaVersion: 2, activeProfileId: active, profiles,
    settings: { sound: bool(s.sound, true), voice: bool(s.voice, true), slow: bool(s.slow, false), large: bool(s.large, false), motion: bool(s.motion, false), contrast: bool(s.contrast, false), volume: num(s.volume, 0.8, 0, 1) },
    parent: {
      breakMinutes: ([0, 10, 15, 20, 30].includes(pa.breakMinutes as number) ? pa.breakMinutes : 20) as never,
      reviewDelayDays: ([1, 3, 7].includes(pa.reviewDelayDays as number) ? pa.reviewDelayDays : 1) as never,
      timedGames: bool(pa.timedGames, false),
    },
    onboarded: bool(x.onboarded, true),
    ...(typeof x.migratedFromV1 === 'number' ? { migratedFromV1: x.migratedFromV1 } : {}),
  };
}

/* ------------------------------------------------------------------ v1.1 migration */
export interface V1Raw { profile?: unknown; settings?: unknown; lastGrade?: unknown }

/**
 * Migrate v1.1 data (keys mq_profile / mq_settings / mq_lastGrade) into one v2 child profile.
 * Nothing is reset: coins, mascots, badges, totals, stars, per-topic stats, trophies and history are kept.
 * v1 mastery trophies are preserved as trophies; under the new evidence rules they map to
 * "Ready for a Skill Check" (the old rule allowed hints and a single session).
 */
export function migrateV1(raw: V1Raw, now = Date.now()): AppState {
  const st = freshState();
  const p = st.profiles[st.activeProfileId]!;
  const v1 = isObj(raw.profile) ? raw.profile : {};
  const s1 = isObj(raw.settings) ? raw.settings : {};
  p.nickname = sanitizeNickname(typeof s1.name === 'string' && s1.name.trim() ? s1.name : 'Explorer');
  p.mascot = typeof v1.mascot === 'string' ? v1.mascot : 'fox';
  p.coins = num(v1.coins, 0, 0, 1e7);
  p.unlocked = Array.isArray(v1.unlocked) ? [...new Set(['fox', ...v1.unlocked.filter(u => typeof u === 'string')])] as string[] : ['fox'];
  if (isObj(v1.badges)) p.badges = Object.fromEntries(Object.entries(v1.badges).filter(([, v]) => typeof v === 'string')) as Record<string, string>;
  const tot = isObj(v1.totals) ? v1.totals : {};
  p.totals = { answered: num(tot.answered, 0, 0), correct: num(tot.correct, 0, 0), timeMs: num(tot.timeMs, 0, 0) };
  const streak = isObj(v1.streak) ? v1.streak : {};
  if (typeof streak.last === 'string' && /^\d{4}-\d{1,2}-\d{1,2}$/.test(streak.last)) p.practiceDays = [normalizeDay(streak.last)];

  const trophies: string[] = [];
  const stats = isObj(v1.stats) ? v1.stats : {};
  for (const [grade, topics] of Object.entries(stats)) {
    if (!isObj(topics)) continue;
    for (const [topicId, t] of Object.entries(topics)) {
      const skillId = LEGACY_TOPIC_TO_SKILL[topicId];
      if (!skillId || !isObj(t)) continue;
      const rec = p.skills[skillId] ?? emptyRecord();
      const prev = rec.legacy ?? { attempts: 0, correct: 0, mastered: false, stars: 0, bestPct: 0 };
      rec.legacy = {
        attempts: prev.attempts + num(t.attempts, 0, 0), correct: prev.correct + num(t.correct, 0, 0),
        mastered: prev.mastered || t.mastered === true, stars: Math.max(prev.stars, num(t.stars, 0, 0, 3)), bestPct: Math.max(prev.bestPct, num(t.bestPct, 0, 0, 100)),
      };
      rec.stars = Math.max(rec.stars, rec.legacy.stars);
      rec.bestPct = Math.max(rec.bestPct, rec.legacy.bestPct);
      rec.plays += num(t.plays, 0, 0);
      rec.timeMs += num(t.timeMs, 0, 0);
      p.skills[skillId] = rec;
      if (t.mastered === true) trophies.push(skillId);
      void grade;
    }
  }
  if (trophies.length) p.legacyTrophies = [...new Set(trophies)];
  if (Array.isArray(v1.history)) {
    p.history = v1.history.filter(isObj).map(h => {
      const skill = LEGACY_TOPIC_TO_SKILL[String(h.t)] ?? 'L1-count';
      return { d: num(h.d, now), skill, level: LEGACY_GRADE_TO_LEVEL[String(h.g)] ?? SKILL_INDEX[skill]!.level, q: String(h.q ?? '').slice(0, 90), ok: (h.ok ? 1 : 0) as 0 | 1, hinted: 0 as const, tries: 1, ms: num(h.ms, 0, 0), mode: 'solve', ctx: 'practice', legacy: 1 as const };
    }).slice(0, 200);
  }
  const lg = typeof raw.lastGrade === 'string' ? LEGACY_GRADE_TO_LEVEL[raw.lastGrade] : undefined;
  if (lg) p.level = lg;
  st.settings = {
    ...DEFAULT_SETTINGS,
    sound: bool(s1.sound, true), voice: bool(s1.voice, true), slow: bool(s1.slow, false),
    large: bool(s1.large, false), motion: bool(s1.motion, false), contrast: bool(s1.contrast, false),
  };
  st.onboarded = true;
  st.migratedFromV1 = now;
  return st;
}

/** v1 used "2026-1-5"; v2 uses ISO "2026-01-05". */
export function normalizeDay(k: string): string {
  const [y, m, d] = k.split('-').map(Number);
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
export function todayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export const SKILL_IDS = ALL_SKILLS.map(s => s.id);
