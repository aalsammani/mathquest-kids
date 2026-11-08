/** Sound effects (WebAudio synth, no audio files) and read-aloud (Web Speech, or native TTS in the app). */
import type { Settings } from '../data/schema';
import { isNative } from '../platform/native';
import { browserSpeechEnv, SpeechController, speechText, STATUS_MESSAGE, type SpeechStatus } from './speech';

let ctx: AudioContext | null = null;
let settings: Settings;
export function bindMediaSettings(s: Settings) { settings = s; }

function ensure(): AudioContext | null {
  if (!ctx) { try { ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)(); } catch { return null; } }
  if (ctx.state !== 'running' && ctx.state !== 'closed') void ctx.resume().catch(() => {}); // 'suspended', or 'interrupted' on iOS
  return ctx;
}
function tone(f: number, t0: number, dur: number, type: OscillatorType = 'sine', vol = 0.16) {
  const c = ctx!; const o = c.createOscillator(), g = c.createGain();
  const v = vol * (settings?.volume ?? 0.8);
  o.type = type; o.frequency.setValueAtTime(f, c.currentTime + t0);
  g.gain.setValueAtTime(Math.max(0.0001, v), c.currentTime + t0);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t0 + dur);
  o.connect(g); g.connect(c.destination); o.start(c.currentTime + t0); o.stop(c.currentTime + t0 + dur + 0.02);
}
export function play(name: 'click' | 'correct' | 'try' | 'coin' | 'fanfare' | 'pop') {
  if (!settings?.sound || !ensure()) return;
  switch (name) {
    case 'click': tone(760, 0, 0.05, 'triangle', 0.08); break;
    case 'correct': tone(523.25, 0, 0.13, 'triangle'); tone(659.25, 0.1, 0.13, 'triangle'); tone(783.99, 0.2, 0.22, 'triangle'); break;
    case 'try': tone(392, 0, 0.12, 'sine', 0.1); tone(349.2, 0.12, 0.16, 'sine', 0.1); break; // gentle, not a buzzer
    case 'coin': tone(987.77, 0, 0.08, 'square', 0.05); tone(1318.5, 0.07, 0.14, 'square', 0.05); break;
    case 'pop': tone(300, 0, 0.04, 'square', 0.1); tone(600, 0.03, 0.06, 'square', 0.07); break;
    case 'fanfare': [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.12, 0.2, 'triangle')); break;
  }
}
/** Call from a user gesture: resumes Web Audio and unlocks speech on iPad/iPhone. */
export const warmAudio = () => { ensure(); web?.unlock(); };

/* ------------------------------------------------------------------ voice */
let web: SpeechController | null = null;
let nativeTTS: { speak: (o: { text: string; lang: string; rate: number; pitch: number; volume: number }) => Promise<void>; stop: () => Promise<void> } | null = null;

export async function initVoice() {
  if (isNative()) {
    try { const m = await import('@capacitor-community/text-to-speech'); nativeTTS = m.TextToSpeech as never; return; } catch { /* fall back to web speech */ }
  }
  web = new SpeechController(browserSpeechEnv());
  web.init();
}
export const voiceAvailable = () => !!nativeTTS || !!web?.supported;
export const speechController = () => web;

/**
 * Read text aloud. `force` = the child or grown-up asked for it (🔊 Listen, Test voice):
 * it is spoken even when automatic reading is off, and it counts as a user gesture.
 */
export function say(text: string, force = false) {
  if (!settings || (!settings.voice && !force)) return;
  if (nativeTTS) {
    const t = speechText(text);
    if (!t) return;
    void nativeTTS.stop().catch(() => {});
    void nativeTTS.speak({ text: t, lang: 'en-US', rate: settings.slow ? 0.75 : 0.95, pitch: 1, volume: 1 }).catch(() => {});
    return;
  }
  web?.speak(text, { slow: settings.slow, voiceName: settings.voiceName ?? '', source: force ? 'user' : 'auto' });
}
export function stopVoice() {
  if (nativeTTS) { void nativeTTS.stop().catch(() => {}); return; }
  web?.stop();
}
/** Subscribe to read-aloud status (for on-screen messages). Native TTS reports nothing. */
export function onSpeechStatus(fn: (s: SpeechStatus, msg: string) => void): () => void {
  return web ? web.onStatus(fn) : () => {};
}
export { STATUS_MESSAGE };
export type { SpeechStatus };
