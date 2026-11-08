// v2.1 read-aloud in the real UI with a RECORDING speech engine (mock). Verifies what the app asks
// the engine to do (voice, text, cancel, settings, fallbacks). It cannot verify sound quality on a
// physical iPad — see docs/IPAD_TEST_CHECKLIST.md for the manual device test.
import { expect, test, type Page } from '@playwright/test';
import { onboard } from './helpers';

type Rec = { text: string; voice: string | null; volume: number; rate: number; pitch: number };
const IPAD_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';

async function installFakeSpeech(page: Page, opts: { supported?: boolean; voices?: [string, string][]; ipad?: boolean } = {}) {
  await page.addInitScript(({ supported, voices, ipad }) => {
    const w = window as unknown as Record<string, unknown>;
    // Real iPadOS Safari reports a Mac user agent with 5 touch points; Chromium emulation reports 1.
    if (ipad) Object.defineProperty(Navigator.prototype, 'maxTouchPoints', { get: () => 5, configurable: true });
    if (!supported) { try { delete (window as unknown as { speechSynthesis?: unknown }).speechSynthesis; } catch { /* */ } Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true }); w.SpeechSynthesisUtterance = undefined; return; }
    const log: unknown[] = []; const calls: string[] = [];
    const stats = { overlaps: 0 };
    w.__speech = { log, calls, stats };
    const vs = voices.map(([name, lang]) => ({ name, lang, localService: true, default: false, voiceURI: `uri:${name}` }));
    class U { text: string; voice: { name: string } | null = null; lang = ''; rate = 1; pitch = 1; volume = 1; onstart: (() => void) | null = null; onend: (() => void) | null = null; onerror: unknown = null; constructor(t: string) { this.text = t; } }
    const synth = {
      speaking: false, pending: false, paused: false,
      getVoices: () => vs,
      addEventListener: () => {},
      speak(u: U) { if (synth.speaking && u.volume > 0) stats.overlaps++; calls.push('speak'); log.push({ text: u.text, voice: u.voice?.name ?? null, volume: u.volume, rate: u.rate, pitch: u.pitch }); synth.speaking = u.volume > 0; setTimeout(() => u.onstart?.(), 5); setTimeout(() => { synth.speaking = false; u.onend?.(); }, 400); },
      cancel() { calls.push('cancel'); synth.speaking = false; },
      resume() { calls.push('resume'); },
      pause() {},
    };
    Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
    w.SpeechSynthesisUtterance = U;
  }, { ipad: opts.ipad ?? false, supported: opts.supported ?? true, voices: opts.voices ?? [['Albert', 'en-US'], ['Bad News', 'en-US'], ['Bubbles', 'en-US'], ['Fred', 'en-US'], ['Samantha', 'en-US'], ['Daniel', 'en-GB'], ['Karen', 'en-AU'], ['Zarvox', 'en-US'], ['Thomas', 'fr-FR']] });
}
const spoken = (page: Page) => page.evaluate(() => ((window as unknown as { __speech: { log: Rec[] } }).__speech.log).filter(r => r.volume > 0));
const calls = (page: Page) => page.evaluate(() => (window as unknown as { __speech: { calls: string[] } }).__speech.calls);

async function toPractice(page: Page) {
  await onboard(page, 2);
  await page.getByRole('button', { name: /^Level 2 ?:/ }).click();
  await page.getByRole('list', { name: 'Level 2 skills' }).getByRole('button').first().click();
  await page.getByRole('button', { name: '🚀 Practice' }).click();
  await expect(page.locator('#act-h')).toHaveText('Question 1 of 10');
}

test.describe('read aloud (mocked engine)', () => {
  test.beforeEach(({}, info) => { test.skip(info.project.name === 'tablet', 'phone + desktop are enough'); });

  test('🔊 Listen reads the question with a clear voice (never a novelty voice), full volume', async ({ page }) => {
    await installFakeSpeech(page);
    await toPractice(page);
    await page.getByRole('button', { name: 'Listen to the question' }).click();
    await expect.poll(async () => (await spoken(page)).length).toBeGreaterThan(0);
    const all = await spoken(page);
    expect(all.every(r => r.voice === 'Samantha')).toBe(true);
    expect(all.every(r => r.volume === 1 && r.pitch === 1)).toBe(true);
    const prompt = (await page.locator('#q-prompt').textContent())!;
    for (const n of prompt.match(/\d+/g) ?? []) expect(all[all.length - 1]!.text).toContain(n);
    expect(all[all.length - 1]!.text).not.toMatch(/[−×÷=]/); // symbols are read as words
  });

  test('repeated taps never overlap: the engine is cancelled and only the last request is spoken', async ({ page }) => {
    await installFakeSpeech(page);
    await toPractice(page);
    const listen = page.getByRole('button', { name: 'Listen to the question' });
    for (let k = 0; k < 5; k++) await listen.click({ delay: 0 });
    await page.waitForTimeout(700);
    expect((await calls(page)).filter(c => c === 'cancel').length).toBeGreaterThan(0);
    // The engine was never asked to speak while it was still speaking (each request cancels the previous one first).
    expect(await page.evaluate(() => (window as unknown as { __speech: { stats: { overlaps: number } } }).__speech.stats.overlaps)).toBe(0);
  });

  test('moving to the next question or leaving the activity stops speech', async ({ page }) => {
    await installFakeSpeech(page);
    await toPractice(page);
    await page.getByRole('button', { name: 'Listen to the question' }).click();
    const n = (await calls(page)).filter(c => c === 'cancel').length;
    await page.getByRole('button', { name: 'Exit this activity' }).click();
    expect((await calls(page)).filter(c => c === 'cancel').length).toBeGreaterThan(n);
  });

  test('Settings: Test voice, Slow/Normal speed, voice picker without novelty voices, choice is used and saved', async ({ page }) => {
    await installFakeSpeech(page);
    await onboard(page, 1);
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByRole('button', { name: '🔊 Test voice' }).click();
    await expect.poll(async () => (await spoken(page)).map(r => r.text).join(' ')).toContain('solve this problem together');
    const options = await page.locator('#set-voicename option').allTextContents();
    expect(options[0]).toContain('Automatic (Samantha)');
    expect(options.join('|')).not.toMatch(/Albert|Bad News|Bubbles|Zarvox|Thomas/);
    await page.locator('#set-voicename').selectOption('uri:Daniel');
    await expect.poll(async () => (await spoken(page)).at(-1)?.voice).toBe('Daniel');
    await page.getByRole('radio', { name: '🐢 Slow' }).click();
    await expect.poll(async () => (await spoken(page)).at(-1)?.rate ?? 1).toBeLessThan(0.8);
    await page.waitForTimeout(400);
    const s = await page.evaluate(() => JSON.parse(localStorage.getItem('mq2_state')!).settings);
    expect(s.voiceName).toBe('uri:Daniel');
    expect(s.slow).toBe(true);
  });

  test('turning read-aloud off stops automatic reading; 🔊 Listen still works on request', async ({ page }) => {
    await installFakeSpeech(page);
    await onboard(page, 2);
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByLabel('Read questions aloud').uncheck();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /^Level 2 ?:/ }).click();
    await page.getByRole('list', { name: 'Level 2 skills' }).getByRole('button').first().click();
    const before = (await spoken(page)).length;
    await page.getByRole('button', { name: '🚀 Practice' }).click();
    await page.waitForTimeout(900);
    expect((await spoken(page)).length).toBe(before); // nothing automatic
    await page.getByRole('button', { name: 'Listen to the question' }).click();
    await expect.poll(async () => (await spoken(page)).length).toBeGreaterThan(before);
  });

  test('browser without speech: clear on-screen message, everything still works', async ({ page }) => {
    await installFakeSpeech(page, { supported: false });
    await onboard(page, 2);
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.locator('.voice-panel')).toContainText('not available in this browser');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /^Level 2 ?:/ }).click();
    await page.getByRole('list', { name: 'Level 2 skills' }).getByRole('button').first().click();
    await page.getByRole('button', { name: '🚀 Practice' }).click();
    await page.getByRole('button', { name: 'Listen to the question' }).click();
    await expect(page.locator('.speech-note')).toContainText('not available');
  });
});

test.describe('iPad Safari user agent (mocked engine)', () => {
  test.use({ userAgent: IPAD_UA, hasTouch: true, isMobile: true, viewport: { width: 820, height: 1180 } });
  test('first tap unlocks speech with a silent utterance; later reading uses a clear voice at an iPad-friendly rate', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'one run with the iPad user agent');
    await installFakeSpeech(page, { ipad: true });
    await page.goto('./');
    await page.getByRole('button', { name: /Start at Level 2/ }).click();
    const log = await page.evaluate(() => (window as unknown as { __speech: { log: Rec[] } }).__speech.log);
    expect(log[0]?.volume).toBe(0); // unlock utterance inside the first tap
    await page.getByRole('button', { name: /^Level 2 ?:/ }).click();
    await page.getByRole('list', { name: 'Level 2 skills' }).getByRole('button').first().click();
    await page.getByRole('button', { name: '🚀 Practice' }).click();
    await page.getByRole('button', { name: 'Listen to the question' }).click();
    await expect.poll(async () => (await spoken(page)).length).toBeGreaterThan(0);
    const last = (await spoken(page)).at(-1)!;
    expect(last.voice).toBe('Samantha');
    expect(last.rate).toBe(0.9);
  });
});
