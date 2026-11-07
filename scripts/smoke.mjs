// Visual smoke run: serves dist-e2e, walks key screens, saves screenshots + console errors.
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const out = 'reports/screens'; mkdirSync(out, { recursive: true });
const srv = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--outDir', 'dist-e2e', '--port', '4180', '--strictPort'], { stdio: 'pipe' });
await new Promise(r => setTimeout(r, 2500));
const b = await chromium.launch({ channel: 'msedge' });
const errors = [];
for (const vp of [{ n: 'phone', w: 390, h: 844 }, { n: 'desktop', w: 1280, h: 860 }]) {
  const p = await b.newPage({ viewport: { width: vp.w, height: vp.h } });
  p.on('console', m => { if (m.type() === 'error') errors.push(`[${vp.n}] ${m.text()}`); });
  p.on('pageerror', e => errors.push(`[${vp.n}] PAGEERROR ${e.message}`));
  const shot = async name => { await p.waitForTimeout(400); await p.screenshot({ path: `${out}/${vp.n}-${name}.png`, fullPage: true }); const hs = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); if (hs > 1) errors.push(`[${vp.n}] horizontal scroll ${hs}px on ${name}`); };
  await p.goto('http://localhost:4180/');
  await shot('01-welcome');
  await p.getByRole('button', { name: /Start at Level 2/ }).click();
  await shot('02-home');
  await p.getByRole('button', { name: /^Level 3 ?:/ }).click();
  await shot('03-map-l3');
  await p.getByRole('button', { name: /^Equal Parts/ }).click();
  await shot('04-lesson');
  await p.getByRole('button', { name: /Practice/ }).click();
  await shot('05-activity');
  await p.goto('http://localhost:4180/');
  await p.getByRole('button', { name: /Math Story Adventures/ }).first().click();
  await p.getByRole('button', { name: /Start Level 3 stories/ }).click();
  await shot('06-story');
  await p.goto('http://localhost:4180/');
  await p.getByRole('button', { name: /Math Tools/ }).click();
  await shot('07-tools');
  await p.getByRole('button', { name: /Fraction Bars/ }).click();
  await shot('08-tool-fractions');
  await p.close();
}
await b.close(); srv.kill();
console.log(errors.length ? errors.join('\n') : 'NO CONSOLE ERRORS / NO H-SCROLL');
