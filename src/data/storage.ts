/**
 * Local-first persistence. Web: localStorage (memory fallback). Native (Capacitor): Preferences,
 * which survives WebView storage eviction. No network. No third parties.
 */
import { freshState, migrateV1, repairState, type AppState } from './schema';

export interface KV {
  readonly kind?: 'web' | 'native' | 'memory';
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  keys(): Promise<string[]>;
}

export class MemoryKV implements KV {
  readonly kind = 'memory' as const;
  m = new Map<string, string>();
  async get(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  async set(k: string, v: string) { this.m.set(k, v); }
  async remove(k: string) { this.m.delete(k); }
  async keys() { return [...this.m.keys()]; }
}

export class WebKV implements KV {
  readonly kind = 'web' as const;
  private mem = new MemoryKV();
  private ok = (() => { try { const t = '__mq_t'; localStorage.setItem(t, '1'); localStorage.removeItem(t); return true; } catch { return false; } })();
  async get(k: string) { try { if (this.ok) return localStorage.getItem(k); } catch { /* fall through */ } return this.mem.get(k); }
  async set(k: string, v: string) { try { if (this.ok) { localStorage.setItem(k, v); return; } } catch { /* quota/private mode */ } await this.mem.set(k, v); }
  async remove(k: string) { try { if (this.ok) localStorage.removeItem(k); } catch { /* ignore */ } await this.mem.remove(k); }
  async keys() { try { if (this.ok) return Object.keys(localStorage); } catch { /* ignore */ } return this.mem.keys(); }
  get persistent() { return this.ok; }
}

export const KEY_STATE = 'mq2_state';
export const KEY_V1_BACKUP = 'mq2_v1_backup';
export const V1_KEYS = ['mq_profile', 'mq_settings', 'mq_lastGrade'];

export interface LoadResult { state: AppState; source: 'v2' | 'migrated-v1' | 'fresh' | 'repaired-corrupt'; notes: string[] }

/** Load state: v2 → validate/repair; else migrate v1 (keeping v1 keys + a backup copy); else fresh. */
export async function loadState(kv: KV, now = Date.now()): Promise<LoadResult> {
  const notes: string[] = [];
  const raw = await kv.get(KEY_STATE);
  if (raw) {
    try {
      const repaired = repairState(JSON.parse(raw));
      if (repaired) return { state: repaired, source: 'v2', notes };
      notes.push('Saved data was not in the expected format.');
    } catch { notes.push('Saved data could not be read.'); }
    await kv.set(`mq2_corrupt_${now}`, raw); // never destroy unreadable data
    notes.push('A copy of the unreadable data was kept on this device.');
  }
  const v1: Record<string, unknown> = {};
  let hasV1 = false;
  for (const k of V1_KEYS) {
    const v = await kv.get(k);
    if (v !== null) { try { v1[k] = JSON.parse(v); hasV1 = true; } catch { notes.push(`Earlier-version key ${k} could not be read.`); } }
  }
  if (hasV1) {
    await kv.set(KEY_V1_BACKUP, JSON.stringify({ savedAt: now, data: v1 }));
    const state = migrateV1({ profile: v1.mq_profile, settings: v1.mq_settings, lastGrade: v1.mq_lastGrade }, now);
    await kv.set(KEY_STATE, JSON.stringify(state));
    notes.push('Progress from the earlier version was carried over.');
    return { state, source: raw ? 'repaired-corrupt' : 'migrated-v1', notes };
  }
  const state = freshState();
  return { state, source: raw ? 'repaired-corrupt' : 'fresh', notes };
}

export class Store {
  state!: AppState;
  private timer: ReturnType<typeof setTimeout> | null = null;
  constructor(readonly kv: KV) {}
  async init(): Promise<LoadResult> { const r = await loadState(this.kv); this.state = r.state; return r; }
  save(immediate = false) {
    if (this.timer) clearTimeout(this.timer);
    const write = () => { this.timer = null; void this.kv.set(KEY_STATE, JSON.stringify(this.state)); };
    if (immediate) write(); else this.timer = setTimeout(write, 250);
  }
  flush() { if (this.timer) { clearTimeout(this.timer); this.timer = null; void this.kv.set(KEY_STATE, JSON.stringify(this.state)); } }
  /** Delete ALL MathQuest data on this device (v2, v1 keys, backups). */
  async eraseAll() {
    for (const k of await this.kv.keys()) if (k.startsWith('mq2_') || k.startsWith('mq_')) await this.kv.remove(k);
    this.state = freshState();
  }
}
