// Audit harness for the ORIGINAL app (legacy/index-v1.1-original.html).
// Loads it in Edge via Playwright, records console errors, takes screenshots,
// and samples every original question generator to measure defects.
// Output: reports/legacy-audit.json and reports/legacy-screens/*.png
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const file = pathToFileURL(resolve(root, 'legacy/index-v1.1-original.html')).href;
mkdirSync(resolve(root, 'reports/legacy-screens'), { recursive: true });

const browser = await chromium.launch({ channel: 'msedge' });
const result = { file: 'legacy/index-v1.1-original.html', consoleErrors: [], pageErrors: [], screens: [], generators: {} };

for (const vp of [{ name: 'phone', width: 390, height: 844 }, { name: 'tablet', width: 820, height: 1180 }, { name: 'desktop', width: 1280, height: 800 }]) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  page.on('console', m => { if (m.type() === 'error') result.consoleErrors.push(`[${vp.name}] ${m.text()}`); });
  page.on('pageerror', e => result.pageErrors.push(`[${vp.name}] ${e.message}`));
  await page.goto(file);
  await page.waitForTimeout(600);
  const shot = `reports/legacy-screens/home-${vp.name}.png`;
  await page.screenshot({ path: resolve(root, shot), fullPage: true });
  result.screens.push(shot);
  if (vp.name === 'phone') {
    const hscroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    result.phoneHorizontalScroll = hscroll;
    // Open a quiz to capture the question screen
    await page.click('.grade-card >> nth=3');
    await page.click('.map-node >> nth=5');
    await page.click('#btn-start-quiz');
    await page.waitForTimeout(500);
    await page.screenshot({ path: resolve(root, 'reports/legacy-screens/quiz-phone.png'), fullPage: true });
    result.screens.push('reports/legacy-screens/quiz-phone.png');
  }
  await page.close();
}

// Sample every generator in-page.
const page = await browser.newPage();
page.on('pageerror', e => result.pageErrors.push(`[sampler] ${e.message}`));
await page.goto(file);
result.generators = await page.evaluate(() => {
  const N = 3000;
  const out = {};
  const toNum = (s) => { const m = String(s).match(/-?\d+/); return m ? Number(m[0]) : NaN; };
  for (const id of Object.keys(QGen)) {
    const r = { samples: 0, throws: 0, dupOptions: 0, correctMissing: 0, multiCorrectShape: 0, inche: 0, compareTakeAwayVisual: 0, ordinalPlural: 0, grammarHas: 0, keywordHint: 0, prompts: new Set(), examples: [] };
    for (let d = 1; d <= 3; d++) {
      for (let i = 0; i < N / 3; i++) {
        let q;
        try { q = QGen[id](d); } catch (e) { r.throws++; continue; }
        r.samples++;
        r.prompts.add(q.prompt + '|' + (q.story || ''));
        const opts = q.options.map(String);
        if (new Set(opts).size !== opts.length) r.dupOptions++;
        if (!opts.includes(String(q.correct))) r.correctMissing++;
        // Square shown while 'rectangle' or 'rhombus' is offered: two mathematically correct names.
        if (q.visual && q.visual.kind === 'shape' && q.visual.name === 'square' && (opts.includes('rectangle') || opts.includes('rhombus'))) {
          r.multiCorrectShape++; if (r.examples.length < 3) r.examples.push({ issue: 'square also a rectangle/rhombus', prompt: q.prompt, options: opts });
        }
        if (q.visual && q.visual.kind === 'ruler' && q.visual.unit === 'inches') r.inche++;
        if (/than/.test(q.prompt) && q.visual && q.visual.kind === 'counters' && q.visual.cross) {
          r.compareTakeAwayVisual++; if (r.examples.length < 6) r.examples.push({ issue: 'comparison story drawn as take-away', story: q.story, prompt: q.prompt });
        }
        if (/\b\d+ths\b/.test(q.prompt)) { r.ordinalPlural++; if (r.examples.length < 8) r.examples.push({ issue: 'ordinal written as digits+ths', prompt: q.prompt }); }
        if (/the \w+s has (more|fewer)/i.test(q.explain)) r.grammarHas++;
        if (/that means (add|subtract)|means divide/i.test(q.hint1 || '')) r.keywordHint++;
      }
    }
    r.distinctPrompts = r.prompts.size; delete r.prompts;
    out[id] = r;
  }
  // The quiz fallback: what happens when a generator throws?
  const saved = QGen.g3_frac;
  QGen.g3_frac = () => { throw new Error('simulated failure'); };
  Quiz.s = { topicId: 'g3_frac', diff: 1, lastPrompt: '' };
  const fb = Quiz.generate();
  QGen.g3_frac = saved;
  out.__fallbackOnFractionFailure = { prompt: fb.prompt, badge: fb.badge };
  // Streak: opening the app counts as a practice day
  out.__streakIncrementsOnLoad = /touchStreak\(false\)/.test(Profile.load.toString());
  // Hint-assisted answers are recorded identically to independent ones
  out.__hintFlagRecorded = /usedHint|hint/.test(Profile.record.toString());
  // CSV export structure
  out.__csvHeaders = (Dashboard.exportCSV.toString().match(/'[a-z_,]+\\n'/g) || []);
  return out;
});
await browser.close();
writeFileSync(resolve(root, 'reports/legacy-audit.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify({
  consoleErrors: result.consoleErrors.length, pageErrors: result.pageErrors, phoneHorizontalScroll: result.phoneHorizontalScroll,
  fallback: result.generators.__fallbackOnFractionFailure, streakOnLoad: result.generators.__streakIncrementsOnLoad,
  hintRecorded: result.generators.__hintFlagRecorded, csv: result.generators.__csvHeaders,
  issues: Object.fromEntries(Object.entries(result.generators).filter(([k]) => !k.startsWith('__')).map(([k, v]) => [k,
    Object.fromEntries(Object.entries(v).filter(([kk, vv]) => typeof vv === 'number' && vv > 0 && kk !== 'samples' && kk !== 'distinctPrompts'))]).filter(([, v]) => Object.keys(v).length))
}, null, 1));
