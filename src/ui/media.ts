/** Sound effects (WebAudio synth, no audio files) and read-aloud (Web Speech, or native TTS in the app). */
import type { Settings } from '../data/schema';
import { stripEmoji } from './dom';
import { isNative } from '../platform/native';

let ctx: AudioContext | null = null;
let settings: Settings;
export function bindMediaSettings(s: Settings) { settings = s; }

function ensure(): AudioContext | null {
  if (!ctx) { try { ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)(); } catch { return null; } }
  if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
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
export const warmAudio = () => { ensure(); };

/* ------------------------------------------------------------------ voice */
let voice: SpeechSynthesisVoice | null = null;
let nativeTTS: { speak: (o: { text: string; lang: string; rate: number; pitch: number; volume: number }) => Promise<void>; stop: () => Promise<void> } | null = null;
export async function initVoice() {
  if (isNative()) {
    try { const m = await import('@capacitor-community/text-to-speech'); nativeTTS = m.TextToSpeech as never; return; } catch { /* fall back to web speech */ }
  }
  if (!('speechSynthesis' in window)) return;
  const load = () => {
    const vs = speechSynthesis.getVoices();
    if (!vs.length) return;
    const en = vs.filter(v => v.lang?.startsWith('en'));
    voice = en.find(v => /en-US/i.test(v.lang) && v.localService) ?? en.find(v => /en-US/i.test(v.lang)) ?? en[0] ?? vs[0] ?? null;
  };
  load();
  speechSynthesis.addEventListener?.('voiceschanged', load);
}
export const voiceAvailable = () => !!nativeTTS || 'speechSynthesis' in window;
export function say(text: string, force = false) {
  if (!settings || (!settings.voice && !force)) return;
  const t = stripEmoji(text).replace(/−/g, ' minus ').replace(/×/g, ' times ').replace(/÷/g, ' divided by ').replace(/___/g, ' blank ').replace(/\?/g, '?');
  const rate = settings.slow ? 0.75 : 0.95;
  if (nativeTTS) { void nativeTTS.stop().catch(() => {}); void nativeTTS.speak({ text: t, lang: 'en-US', rate, pitch: 1.05, volume: settings.volume }).catch(() => {}); return; }
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(t);
  if (voice) u.voice = voice;
  u.lang = 'en-US'; u.rate = rate; u.pitch = 1.05; u.volume = settings.volume;
  speechSynthesis.speak(u);
}
export function stopVoice() {
  if (nativeTTS) { void nativeTTS.stop().catch(() => {}); return; }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}
