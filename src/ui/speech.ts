/**
 * Cross-platform read-aloud controller for the web build (Web Speech API).
 *
 * Why this exists (v2.1): on iPad/iPhone Safari, speechSynthesis.getVoices() lists dozens of
 * voices, including Apple "novelty" voices (Albert, Bad News, Bubbles, Zarvox, …) and older
 * robotic ones. The previous code picked the FIRST local en-US voice, which on Apple devices is
 * often one of those — hence speech that was hard to understand. Safari also drops or garbles
 * an utterance spoken immediately after cancel(), may not fire `voiceschanged`, can be left in a
 * paused state after an interruption, and blocks speech until the page has had a user gesture.
 *
 * This controller:
 *   - ranks voices for clarity (English, en-US first, on-device first, novelty voices excluded),
 *   - honours a voice the user picked in Settings when it is still available,
 *   - waits for voices that load late (event + short polling),
 *   - never overlaps speech (one generation counter; stale requests are dropped),
 *   - waits briefly after cancel() before speaking again (WebKit),
 *   - resumes a paused engine, splits long text into sentences (avoids long-utterance cut-offs),
 *   - "unlocks" speech on the first tap on Apple touch devices and does not auto-speak before it,
 *   - speaks math symbols as words, at full utterance volume (the device volume still applies),
 *   - reports a status the UI can show (so failures are never silent).
 *
 * It cannot change the device's speaker volume, silent/ring switch, audio route, or OS settings.
 * Pure helpers (rankVoice, pickVoice, speechText, chunkText) are exported for unit tests.
 */
import { fractionWords } from '../core/text';

export type SpeechStatus = 'idle' | 'loading' | 'speaking' | 'needs-tap' | 'unavailable' | 'error';
export interface VoiceLike { name: string; lang: string; localService: boolean; default: boolean; voiceURI: string }

/* ------------------------------------------------------------------ voice ranking */
// Apple novelty/sound-effect voices: never chosen automatically or offered.
const NOVELTY = /^(albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|jester|organ|pipe organ|superstar|trinoids|whisper|wobble|zarvox)\b/i;
// Older or synthetic-sounding voices: allowed, but only when nothing clearer exists.
const ROBOTIC = /^(agnes|bruce|fred|junior|kathy|princess|ralph|vicki|victoria|eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley)\b/i;
// Generally clear voices across platforms (Apple, Microsoft, Google/Android).
const CLEAR = /\b(samantha|ava|allison|susan|zoe|nicky|evan|joelle|noelle|nathan|aaron|tom|karen|daniel|moira|tessa|serena|kate|fiona|aria|jenny|guy|zira|david|mark|libby|sonia|google us english|english united states)\b/i;
const QUALITY = /\b(enhanced|premium|neural|natural)\b/i;

const normLang = (l: string) => (l || '').replace('_', '-').toLowerCase();
export const isEnglish = (v: VoiceLike) => normLang(v.lang).startsWith('en');
export const isNovelty = (v: VoiceLike) => NOVELTY.test(v.name.trim());

/** Higher is better. English novelty voices and non-English voices score far below zero. */
export function rankVoice(v: VoiceLike): number {
  const lang = normLang(v.lang);
  if (!lang.startsWith('en')) return -1000;
  if (isNovelty(v)) return -500;
  let s = 0;
  if (lang === 'en-us') s += 40;
  else if (/^en-(gb|au|ca|ie|nz)$/.test(lang)) s += 25;
  else s += 15;
  if (v.localService) s += 30; // on-device: works offline and sends no text anywhere
  if (QUALITY.test(v.name)) s += 15;
  if (CLEAR.test(v.name)) s += 20;
  if (ROBOTIC.test(v.name.trim())) s -= 45;
  if (v.default) s += 5;
  return s;
}

/**
 * Clear English voices, best first, for the Settings picker. Novelty voices are excluded, and so are
 * network ("online") voices whenever an on-device English voice exists: an online voice sends the
 * question text to the browser vendor's servers, which this app promises not to do.
 */
export function suitableVoices<V extends VoiceLike>(voices: readonly V[], max = 8): V[] {
  const seen = new Set<string>();
  const anyLocal = voices.some(v => v.localService && isEnglish(v) && !isNovelty(v));
  return voices
    .filter(v => !anyLocal || v.localService)
    .map((v, i) => ({ v, i, s: rankVoice(v) }))
    .filter(x => x.s >= 30)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map(x => x.v)
    .filter(v => (seen.has(v.name) ? false : (seen.add(v.name), true)))
    .slice(0, max);
}

/** The voice to use: the user's choice if still available and suitable, else the best-ranked English voice. */
export function pickVoice<V extends VoiceLike>(voices: readonly V[], preferred = ''): V | null {
  if (preferred) {
    const p = voices.find(v => v.voiceURI === preferred || v.name === preferred);
    if (p && isEnglish(p) && !isNovelty(p)) return p;
  }
  let best: V | null = null, bestScore = -100;
  voices.forEach(v => { const s = rankVoice(v); if (s > bestScore) { best = v; bestScore = s; } });
  return best;
}

/* ------------------------------------------------------------------ text */
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2B00}-\u{2BFF}\u{200D}]/gu;

/** Turn on-screen text into words a speech engine reads clearly (math symbols, fractions, blanks). */
export function speechText(raw: string): string {
  let t = raw.replace(EMOJI, ' ');
  t = t.replace(/\b(\d{1,2})\/(\d{1,2})\b/g, (m, a: string, b: string) => { const n = Number(a), d = Number(b); if (d < 2 || d > 12 || n > 99) return m; try { return fractionWords(n, d); } catch { return m; } });
  t = t.replace(/(\d)\s*[−-]\s*(?=\d)/g, '$1 minus ').replace(/−/g, ' minus ');
  t = t.replace(/×/g, ' times ').replace(/÷/g, ' divided by ').replace(/≠/g, ' does not equal ').replace(/=/g, ' equals ');
  t = t.replace(/\s<\s/g, ' is less than ').replace(/\s>\s/g, ' is greater than ').replace(/(\d)\s*\+\s*(?=\d)/g, '$1 plus ');
  t = t.replace(/_{2,}/g, ' blank ').replace(/[→·•]/g, ', ').replace(/¢/g, ' cents');
  return t.replace(/\s+([.,!?;:])/g, '$1').replace(/\s+/g, ' ').trim();
}

/** Split into sentence-sized pieces (≤ max chars) so long passages are not cut off. */
export function chunkText(t: string, max = 180): string[] {
  const out: string[] = [];
  for (const sentence of t.split(/(?<=[.!?])\s+/)) {
    if (!sentence) continue;
    const last = out[out.length - 1];
    if (last !== undefined && last.length + sentence.length + 1 <= max) { out[out.length - 1] = `${last} ${sentence}`; continue; }
    if (sentence.length <= max) { out.push(sentence); continue; }
    let cur = '';
    for (const part of sentence.split(/(?<=,)\s+/)) {
      if (cur && cur.length + part.length + 1 > max) { out.push(cur); cur = part; } else cur = cur ? `${cur} ${part}` : part;
    }
    if (cur) out.push(cur);
  }
  return out;
}

/* ------------------------------------------------------------------ controller */
export interface SpeechEnv {
  synth: SpeechSynthesis | null;
  Utterance: (new (text: string) => SpeechSynthesisUtterance) | null;
  /** iPad / iPhone (including iPadOS that reports itself as a Mac). */
  appleTouch: boolean;
  /** Any WebKit engine (Safari on macOS/iOS; every browser on iOS). */
  webkit: boolean;
  setTimeout: (fn: () => void, ms: number) => unknown;
}

export function browserSpeechEnv(): SpeechEnv {
  const w = typeof window !== 'undefined' ? window : undefined;
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  const ua = nav?.userAgent ?? '';
  const appleTouch = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && (nav?.maxTouchPoints ?? 0) > 1);
  const webkit = appleTouch || (/AppleWebKit/.test(ua) && !/Chrome|Chromium|Edg\//.test(ua));
  const ok = !!w && 'speechSynthesis' in w && typeof (w as unknown as { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance === 'function';
  return { synth: ok ? w!.speechSynthesis : null, Utterance: ok ? w!.SpeechSynthesisUtterance : null, appleTouch, webkit, setTimeout: (fn, ms) => setTimeout(fn, ms) };
}

export interface SpeakOptions { slow?: boolean; voiceName?: string; source?: 'user' | 'auto' }
type Listener = (status: SpeechStatus, message: string) => void;

export const STATUS_MESSAGE: Record<SpeechStatus, string> = {
  idle: '',
  loading: 'Getting the voice ready…',
  speaking: 'Reading aloud…',
  'needs-tap': 'Tap 🔊 Listen to hear it.',
  unavailable: 'Read aloud is not available in this browser. The words are always on the screen.',
  error: 'No sound? Check that the volume is up and the silent switch is off, then tap 🔊 Listen again.',
};

export class SpeechController {
  status: SpeechStatus = 'idle';
  private voices: SpeechSynthesisVoice[] = [];
  private gen = 0;
  private unlocked = false;
  private started = false;
  private polls = 0;
  private live: SpeechSynthesisUtterance[] = []; // keep references: some engines drop events of GC'd utterances
  private listeners = new Set<Listener>();

  constructor(private env: SpeechEnv) {
    if (!env.synth || !env.Utterance) this.status = 'unavailable';
  }

  get supported() { return !!this.env.synth && !!this.env.Utterance; }
  get isUnlocked() { return this.unlocked || !this.env.appleTouch; }

  /** Load voices now and whenever the browser reports a change (Safari may report late, or never). */
  init() {
    const s = this.env.synth;
    if (!s) return;
    this.refreshVoices();
    try { s.addEventListener?.('voiceschanged', () => this.refreshVoices()); } catch { /* old engines */ }
    const poll = () => { if (this.voices.length || this.polls++ > 16) return; this.refreshVoices(); this.env.setTimeout(poll, 250); };
    if (!this.voices.length) this.env.setTimeout(poll, 250);
  }

  refreshVoices() {
    try { this.voices = this.env.synth?.getVoices() ?? []; } catch { this.voices = []; }
    return this.voices;
  }

  /** Clear English voices for the Settings picker. */
  listVoices(): SpeechSynthesisVoice[] { if (!this.voices.length) this.refreshVoices(); return suitableVoices(this.voices); }
  currentVoice(voiceName = ''): SpeechSynthesisVoice | null { if (!this.voices.length) this.refreshVoices(); return pickVoice(this.voices, voiceName); }

  onStatus(fn: Listener): () => void { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  private set(status: SpeechStatus, message = STATUS_MESSAGE[status]) {
    this.status = status;
    this.listeners.forEach(fn => { try { fn(status, message); } catch { /* listener errors never break speech */ } });
  }

  /**
   * Call from inside a user gesture (tap/click/key). On Apple touch devices the first utterance must
   * start from a gesture; a silent one is enough to allow later automatic reading.
   */
  unlock() {
    const { synth, Utterance, appleTouch } = this.env;
    if (this.unlocked || !synth || !Utterance) return;
    this.unlocked = true;
    if (!appleTouch) return;
    try { const u = new Utterance(' '); u.volume = 0; u.rate = 1; synth.speak(u); } catch { /* ignore */ }
  }

  /** Speak text. Returns false when nothing will be spoken (unsupported, blocked, empty). */
  speak(text: string, opts: SpeakOptions = {}): boolean {
    const { synth, Utterance } = this.env;
    if (!synth || !Utterance) { this.set('unavailable'); return false; }
    const clean = speechText(text);
    if (!clean) return false;
    const myGen = ++this.gen;
    if (opts.source === 'user') this.unlock();
    else if (!this.isUnlocked) { this.set('needs-tap'); return false; } // no unreliable auto-speech before the first tap
    let busy = false;
    try { busy = synth.speaking || synth.pending; } catch { /* ignore */ }
    if (busy) { try { synth.cancel(); } catch { /* ignore */ } }
    const go = () => { if (myGen === this.gen) this.queue(clean, opts, myGen); };
    // WebKit drops or garbles an utterance queued right after cancel(): give it a moment.
    if (busy) this.env.setTimeout(go, this.env.webkit ? 140 : 40);
    else go(); // synchronous: stays inside the user gesture on iOS
    return true;
  }

  private queue(clean: string, opts: SpeakOptions, myGen: number) {
    const { synth, Utterance, webkit } = this.env;
    if (!synth || !Utterance) return;
    try { if (synth.paused) synth.resume(); } catch { /* ignore */ }
    if (!this.voices.length) this.refreshVoices();
    const voice = pickVoice(this.voices, opts.voiceName ?? '');
    const parts = chunkText(clean);
    const rate = opts.slow ? (webkit ? 0.72 : 0.75) : webkit ? 0.9 : 0.95;
    this.live = [];
    this.started = false;
    parts.forEach((part, i) => {
      const u = new Utterance(part);
      if (voice) { u.voice = voice; u.lang = voice.lang || 'en-US'; } else u.lang = 'en-US';
      u.rate = rate; u.pitch = 1; u.volume = 1;
      u.onstart = () => { if (myGen === this.gen) { this.started = true; if (this.status !== 'speaking') this.set('speaking'); } };
      u.onend = () => { if (myGen !== this.gen) return; this.started = true; if (i === parts.length - 1) this.set('idle'); };
      u.onerror = e => {
        if (myGen !== this.gen) return;
        const err = (e as SpeechSynthesisErrorEvent).error;
        if (err === 'interrupted' || err === 'canceled') return;
        this.set(err === 'not-allowed' ? 'needs-tap' : 'error');
      };
      this.live.push(u);
      try { synth.speak(u); } catch { this.set('error'); }
    });
    if (!this.started && this.status !== 'speaking') this.set('loading');
    // Watchdog: if nothing started (muted engine, blocked audio, no voice), say so instead of failing silently.
    this.env.setTimeout(() => {
      if (myGen !== this.gen || this.started) return;
      let speaking = false;
      try { speaking = synth.speaking; if (synth.paused) synth.resume(); } catch { /* ignore */ }
      if (!speaking) this.set(this.isUnlocked ? 'error' : 'needs-tap');
    }, 3500);
  }

  stop() {
    this.gen++;
    try { this.env.synth?.cancel(); } catch { /* ignore */ }
    this.live = [];
    if (this.status !== 'unavailable') this.set('idle');
  }
}
