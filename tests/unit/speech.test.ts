/**
 * v2.1 read-aloud controller. These are deterministic tests with MOCKED speech engines and voice
 * lists modelled on real platforms. They verify the logic (voice choice, cancellation, iPad
 * gesture rules, fallbacks); they do NOT prove how a physical iPad sounds — see docs/IPAD_TEST_CHECKLIST.md.
 */
import { describe, expect, it } from 'vitest';
import { chunkText, pickVoice, rankVoice, SpeechController, speechText, suitableVoices, type SpeechEnv, type VoiceLike } from '../../src/ui/speech';

const v = (name: string, lang: string, localService = true, def = false): VoiceLike => ({ name, lang, localService, default: def, voiceURI: `uri:${name}` });

// iPadOS Safari lists novelty voices first (alphabetical), all on-device.
const IPAD = [
  'Albert', 'Bad News', 'Bahh', 'Bells', 'Boing', 'Bubbles', 'Cellos', 'Eddy', 'Flo', 'Fred', 'Good News', 'Grandma', 'Grandpa', 'Jester',
  'Junior', 'Kathy', 'Organ', 'Ralph', 'Reed', 'Rocko', 'Samantha', 'Sandy', 'Shelley', 'Superstar', 'Trinoids', 'Whisper', 'Wobble', 'Zarvox',
].map(n => v(n, 'en-US')).concat([v('Karen', 'en-AU'), v('Daniel', 'en-GB'), v('Moira', 'en-IE'), v('Rishi', 'en-IN'), v('Amélie', 'fr-CA'), v('Thomas', 'fr-FR')]);
const WINDOWS_EDGE = [v('Microsoft David - English (United States)', 'en-US', true, true), v('Microsoft Mark - English (United States)', 'en-US'), v('Microsoft Zira - English (United States)', 'en-US'), v('Microsoft Aria Online (Natural) - English (United States)', 'en-US', false), v('Microsoft Libby Online (Natural) - English (United Kingdom)', 'en-GB', false)];
const CHROME_DESKTOP = [v('Microsoft David - English (United States)', 'en-US', true, true), v('Google Deutsch', 'de-DE', false), v('Google US English', 'en-US', false), v('Google UK English Female', 'en-GB', false)];
const ANDROID = [v('English United States', 'en-US', true, true), v('English United Kingdom', 'en-GB'), v('Español Estados Unidos', 'es-US')];

describe('voice choice', () => {
  it('iPad: never picks a novelty or robotic voice; picks a clear en-US voice (Samantha)', () => {
    expect(pickVoice(IPAD)?.name).toBe('Samantha');
    for (const n of ['Albert', 'Bad News', 'Bubbles', 'Zarvox', 'Whisper', 'Trinoids']) expect(rankVoice(IPAD.find(x => x.name === n)!)).toBeLessThan(0);
  });
  it('iPad: an Enhanced/Premium voice the family downloaded is preferred', () => {
    expect(pickVoice([...IPAD, v('Ava (Enhanced)', 'en-US')])?.name).toBe('Ava (Enhanced)');
  });
  it('Windows/Chrome/Android: keeps the same on-device en-US voice as before (no regression)', () => {
    expect(pickVoice(WINDOWS_EDGE)?.name).toBe('Microsoft David - English (United States)');
    expect(pickVoice(CHROME_DESKTOP)?.name).toBe('Microsoft David - English (United States)');
    expect(pickVoice(ANDROID)?.name).toBe('English United States');
  });
  it('prefers on-device voices over network voices (offline, private)', () => {
    expect(pickVoice([v('Google US English', 'en-US', false), v('Samantha', 'en-US', true)])?.name).toBe('Samantha');
  });
  it('honours a chosen voice by URI or name; ignores a novelty or missing choice', () => {
    expect(pickVoice(IPAD, 'uri:Daniel')?.name).toBe('Daniel');
    expect(pickVoice(IPAD, 'Karen')?.name).toBe('Karen');
    expect(pickVoice(IPAD, 'uri:Bubbles')?.name).toBe('Samantha');
    expect(pickVoice(IPAD, 'uri:Gone')?.name).toBe('Samantha');
  });
  it('accepts en_US style language tags; returns null when no English voice exists', () => {
    expect(pickVoice([v('X', 'fr-FR'), v('Y', 'en_US')])?.name).toBe('Y');
    expect(pickVoice([v('X', 'fr-FR'), v('Z', 'de-DE')])).toBeNull();
    expect(pickVoice([])).toBeNull();
  });
  it('the Settings list shows only clear English voices (no novelty voices), best first', () => {
    const list = suitableVoices(IPAD).map(x => x.name);
    expect(list[0]).toBe('Samantha');
    expect(list).not.toContain('Albert');
    expect(list).not.toContain('Zarvox');
    expect(list).not.toContain('Amélie');
    expect(list.length).toBeLessThanOrEqual(8);
  });
  it('privacy: the picker hides online voices when on-device voices exist (question text stays on the device)', () => {
    const list = suitableVoices(WINDOWS_EDGE).map(x => x.name);
    expect(list).toContain('Microsoft Zira - English (United States)');
    expect(list.some(n => /Online/.test(n))).toBe(false);
    expect(suitableVoices(CHROME_DESKTOP).map(x => x.name)).not.toContain('Google US English');
    // only if a device has no on-device English voice at all are online voices offered
    expect(suitableVoices([v('Google US English', 'en-US', false)]).map(x => x.name)).toEqual(['Google US English']);
  });
});

describe('text prepared for speech', () => {
  it('reads math symbols, fractions and blanks as words', () => {
    expect(speechText('7 − 3 = ?')).toBe('7 minus 3 equals?');
    expect(speechText('12 + 5 = 17')).toBe('12 plus 5 equals 17');
    expect(speechText('4 × 5 and 20 ÷ 4')).toBe('4 times 5 and 20 divided by 4');
    expect(speechText('Shade 3/4 of the bar')).toBe('Shade three fourths of the bar');
    expect(speechText('1/2 is one part')).toBe('one half is one part');
    expect(speechText('19 ___ 14')).toBe('19 blank 14');
    expect(speechText('🎉 Great job! 🦊')).toBe('Great job!');
    expect(speechText('left-over pieces')).toBe('left-over pieces');
  });
  it('splits long text into sentence-sized chunks', () => {
    const long = Array.from({ length: 12 }, (_, i) => `This is sentence number ${i + 1} about counting apples in the basket.`).join(' ');
    const parts = chunkText(long);
    expect(parts.length).toBeGreaterThan(2);
    expect(parts.every(p => p.length <= 180)).toBe(true);
    expect(parts.join(' ')).toBe(long);
  });
});

/* ------------------------------------------------------------------ fake engine */
class FakeUtterance {
  voice: VoiceLike | null = null; lang = ''; rate = 1; pitch = 1; volume = 1;
  onstart: (() => void) | null = null; onend: (() => void) | null = null; onerror: ((e: { error: string }) => void) | null = null;
  constructor(public text: string) {}
}
function fakeEnv(opts: { voices?: VoiceLike[]; appleTouch?: boolean; webkit?: boolean; autoStart?: boolean } = {}) {
  const timers: { at: number; fn: () => void }[] = [];
  let now = 0;
  const spoken: FakeUtterance[] = [];
  const calls: string[] = [];
  let voices = opts.voices ?? IPAD;
  const listeners: (() => void)[] = [];
  const synth = {
    speaking: false, pending: false, paused: false,
    getVoices: () => voices,
    addEventListener: (_: string, fn: () => void) => listeners.push(fn),
    speak(u: FakeUtterance) { calls.push(`speak:${u.text}`); spoken.push(u); if (opts.autoStart !== false && u.volume > 0) { synth.speaking = true; u.onstart?.(); } },
    cancel() { calls.push('cancel'); synth.speaking = false; synth.pending = false; },
    resume() { calls.push('resume'); synth.paused = false; },
  };
  const env: SpeechEnv = {
    synth: synth as unknown as SpeechSynthesis,
    Utterance: FakeUtterance as unknown as new (t: string) => SpeechSynthesisUtterance,
    appleTouch: opts.appleTouch ?? true, webkit: opts.webkit ?? true,
    setTimeout: (fn, ms) => { timers.push({ at: now + ms, fn }); return 0; },
  };
  const advance = (ms: number) => { now += ms; for (;;) { timers.sort((a, b) => a.at - b.at); const t = timers[0]; if (!t || t.at > now) break; timers.shift(); t.fn(); } };
  return { env, synth, spoken, calls, advance, setVoices: (vs: VoiceLike[]) => { voices = vs; listeners.forEach(f => f()); } };
}
const real = (spoken: FakeUtterance[]) => spoken.filter(u => u.volume > 0);

describe('speech controller (mocked engine)', () => {
  it('unsupported browser: reports "unavailable" instead of failing silently', () => {
    const c = new SpeechController({ synth: null, Utterance: null, appleTouch: false, webkit: false, setTimeout: () => 0 });
    const seen: string[] = []; c.onStatus(s => seen.push(s));
    expect(c.speak('Hello', { source: 'user' })).toBe(false);
    expect(seen).toContain('unavailable');
  });
  it('iPad: no automatic speech before the first tap; a tap (Listen) unlocks and speaks', () => {
    const f = fakeEnv(); const c = new SpeechController(f.env); c.init();
    const seen: string[] = []; c.onStatus(s => seen.push(s));
    expect(c.speak('Count the shapes.', { source: 'auto' })).toBe(false);
    expect(real(f.spoken)).toHaveLength(0);
    expect(seen).toContain('needs-tap');
    expect(c.speak('Count the shapes.', { source: 'user' })).toBe(true);
    expect(f.spoken[0]!.volume).toBe(0); // silent unlock utterance inside the gesture
    expect(real(f.spoken).map(u => u.text)).toEqual(['Count the shapes.']);
    expect(c.speak('Next question.', { source: 'auto' })).toBe(true); // after unlock, automatic reading works
  });
  it('desktop/Android: automatic reading works without an unlock step', () => {
    const f = fakeEnv({ voices: WINDOWS_EDGE, appleTouch: false, webkit: false }); const c = new SpeechController(f.env); c.init();
    expect(c.speak('Hello there.', { source: 'auto' })).toBe(true);
    expect(real(f.spoken)[0]!.voice?.name).toBe('Microsoft David - English (United States)');
    expect(real(f.spoken)[0]!.rate).toBe(0.95);
  });
  it('uses a clear voice, natural pitch, full utterance volume, child-friendly rate; slow is slower', () => {
    const f = fakeEnv(); const c = new SpeechController(f.env); c.init();
    c.speak('Hello.', { source: 'user' });
    const u = real(f.spoken)[0]!;
    expect(u.voice?.name).toBe('Samantha'); expect(u.lang).toBe('en-US');
    expect(u.pitch).toBe(1); expect(u.volume).toBe(1); expect(u.rate).toBe(0.9);
    f.synth.speaking = false;
    c.speak('Hello again.', { source: 'user', slow: true });
    expect(real(f.spoken)[1]!.rate).toBeLessThan(0.8);
  });
  it('never overlaps: cancels current speech, waits (WebKit), and only the LAST of rapid taps is spoken', () => {
    const f = fakeEnv(); const c = new SpeechController(f.env); c.init();
    c.speak('One.', { source: 'user' });
    c.speak('Two.', { source: 'user' });
    c.speak('Three.', { source: 'user' });
    expect(f.calls.filter(x => x === 'cancel').length).toBeGreaterThanOrEqual(1);
    f.advance(200);
    expect(real(f.spoken).map(u => u.text)).toEqual(['One.', 'Three.']);
    const iCancel = f.calls.indexOf('cancel'), iThree = f.calls.indexOf('speak:Three.');
    expect(iCancel).toBeLessThan(iThree);
  });
  it('resumes a paused engine (iOS after an interruption) before speaking', () => {
    const f = fakeEnv(); const c = new SpeechController(f.env); c.init();
    f.synth.paused = true;
    c.speak('Hello.', { source: 'user' });
    expect(f.calls).toContain('resume');
    expect(real(f.spoken)).toHaveLength(1);
  });
  it('waits for voices that load late (voiceschanged), then picks the clear one', () => {
    const f = fakeEnv({ voices: [] }); const c = new SpeechController(f.env); c.init();
    f.setVoices(IPAD);
    c.speak('Hello.', { source: 'user' });
    expect(real(f.spoken)[0]!.voice?.name).toBe('Samantha');
  });
  it('polls for voices when the browser never fires voiceschanged (Safari)', () => {
    const f = fakeEnv({ voices: [] }); const c = new SpeechController(f.env); c.init();
    expect(c.listVoices()).toHaveLength(0);
    (f.synth as unknown as { getVoices: () => VoiceLike[] }).getVoices = () => IPAD; // appears without an event
    f.advance(600);
    expect(c.listVoices()[0]?.name).toBe('Samantha');
  });
  it('a voice that disappears falls back to the automatic choice', () => {
    const f = fakeEnv(); const c = new SpeechController(f.env); c.init();
    c.speak('Hi.', { source: 'user', voiceName: 'uri:Removed Voice' });
    expect(real(f.spoken)[0]!.voice?.name).toBe('Samantha');
  });
  it('errors: "not-allowed" asks for a tap; "interrupted" (our own cancel) is ignored; others are reported', () => {
    const f = fakeEnv({ autoStart: false }); const c = new SpeechController(f.env); c.init();
    const seen: string[] = []; c.onStatus(s => seen.push(s));
    c.speak('A.', { source: 'user' });
    real(f.spoken)[0]!.onerror?.({ error: 'interrupted' });
    expect(seen).not.toContain('error');
    real(f.spoken)[0]!.onerror?.({ error: 'not-allowed' });
    expect(seen).toContain('needs-tap');
    c.speak('B.', { source: 'user' });
    real(f.spoken)[1]!.onerror?.({ error: 'synthesis-failed' });
    expect(seen[seen.length - 1]).toBe('error');
  });
  it('watchdog: if speech never starts (muted/blocked engine), shows a message instead of silence', () => {
    const f = fakeEnv({ autoStart: false }); const c = new SpeechController(f.env); c.init();
    const seen: string[] = []; c.onStatus(s => seen.push(s));
    c.speak('Is anyone there?', { source: 'user' });
    f.advance(4000);
    expect(seen[seen.length - 1]).toBe('error');
  });
  it('stop() cancels speech and drops anything still waiting to start (screen changes)', () => {
    const f = fakeEnv(); const c = new SpeechController(f.env); c.init();
    c.speak('First.', { source: 'user' });
    c.speak('Queued after cancel.', { source: 'user' });
    c.stop();
    f.advance(500);
    expect(real(f.spoken).map(u => u.text)).toEqual(['First.']);
    expect(c.status).toBe('idle');
  });
  it('long passages are queued as several utterances, and status returns to idle at the end', () => {
    const f = fakeEnv(); const c = new SpeechController(f.env); c.init();
    const seen: string[] = []; c.onStatus(s => seen.push(s));
    const long = Array.from({ length: 10 }, (_, i) => `Sentence ${i + 1} tells part of the story about the farm.`).join(' ');
    c.speak(long, { source: 'user' });
    const us = real(f.spoken);
    expect(us.length).toBeGreaterThan(1);
    us.forEach(u => u.onend?.());
    expect(seen[seen.length - 1]).toBe('idle');
  });
});
