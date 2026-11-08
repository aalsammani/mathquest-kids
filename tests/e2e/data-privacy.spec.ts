import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { parseCSV } from '../../src/data/export';
import { completeItem, holdContinue, onboard, passGate, profileState } from './helpers';

test.describe('privacy, persistence and migration', () => {
  test('makes NO requests to any other origin (audit M7)', async ({ page, baseURL }) => {
    const foreign: string[] = [];
    page.on('request', r => { const u = r.url(); if (!u.startsWith(baseURL!) && !u.startsWith('data:') && !u.startsWith('blob:')) foreign.push(u); });
    await onboard(page, 2);
    await page.getByRole('button', { name: /^Level 2 ?:/ }).click();
    await page.getByRole('button', { name: /^Coins ?\. / }).click();
    await page.getByRole('button', { name: '🚀 Practice' }).click();
    await completeItem(page);
    await page.goto('./');
    await page.getByRole('button', { name: /Math Tools/ }).click();
    await page.getByRole('button', { name: /Clock/ }).click();
    expect(foreign).toEqual([]);
  });

  test('migrates v1.1 progress without resetting it (and keeps the old keys)', async ({ page }) => {
    await page.addInitScript(() => {
      if (sessionStorage.getItem('seeded')) return;
      sessionStorage.setItem('seeded', '1');
      localStorage.setItem('mq_profile', JSON.stringify({ mascot: 'owl', coins: 137, xp: 50, unlocked: ['fox', 'owl'], badges: { first: '2025-01-01T00:00:00Z' }, streak: { count: 2, last: '2025-9-3' }, totals: { correct: 9, answered: 12, timeMs: 1000 }, stats: { '3': { g3_mult: { attempts: 12, correct: 9, stars: 2, bestPct: 80, timeMs: 1000, mastered: true, plays: 2 } } }, history: [] }));
      localStorage.setItem('mq_settings', JSON.stringify({ sound: true, voice: false, slow: false, large: false, motion: true, contrast: false, name: 'Ada' }));
      localStorage.setItem('mq_lastGrade', JSON.stringify('3'));
    });
    await page.goto('./');
    await expect(page.getByRole('heading', { name: /Hi, Ada!/ })).toBeVisible();
    await expect(page.locator('#hud-coins')).toHaveText('137');
    await expect(page.locator('.grade-card.recommended .g-name')).toHaveText('Level 4');
    await page.reload();
    await expect(page.locator('#hud-coins')).toHaveText('137');
    const old = await page.evaluate(() => localStorage.getItem('mq_profile'));
    expect(old).toContain('"coins":137');
    await page.getByRole('button', { name: /^Level 4 ?:/ }).click();
    await expect(page.getByRole('button', { name: /^Multiplication ?\. .*Ready for a Skill Check/ })).toBeVisible();
  });

  test('recovers from corrupt saved data without crashing', async ({ page }) => {
    await page.addInitScript(() => { if (!sessionStorage.getItem('c')) { sessionStorage.setItem('c', '1'); localStorage.setItem('mq2_state', '{broken'); } });
    await page.goto('./');
    await expect(page.getByRole('heading', { name: 'Welcome to MathQuest Kids!' })).toBeVisible();
    expect(await page.evaluate(() => Object.keys(localStorage).some(k => k.startsWith('mq2_corrupt_')))).toBe(true);
  });

  test('parental gate, CSV export, backup, and erase-all', async ({ page }, info) => {
    test.skip(info.project.name === 'phone', 'download flow covered on desktop/tablet');
    await onboard(page, 2);
    await page.getByRole('button', { name: 'Grown-Ups' }).click();
    await page.getByLabel('Answer in digits').fill('1');
    await page.getByRole('button', { name: 'Press and hold to continue' }).click(); // a tap is not enough
    await expect(page.getByRole('heading', { name: /Grown-Ups Dashboard/ })).toBeHidden();
    await holdContinue(page);
    await expect(page.getByRole('alert')).toContainText(/Not quite/);
    await passGate(page);
    await expect(page.getByRole('heading', { name: /Grown-Ups Dashboard/ })).toBeVisible();
    await page.getByRole('tab', { name: 'Data & privacy' }).click();
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Skills report/ }).click()]);
    const csv = readFileSync((await dl.path())!, 'utf8');
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const rows = parseCSV(csv);
    expect(rows[0]![0]).toBe('profile');
    const [bk] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Full backup/ }).click()]);
    expect(JSON.parse(readFileSync((await bk.path())!, 'utf8')).app).toBe('MathQuest Kids');
    await page.getByRole('button', { name: 'Erase everything' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Erase everything' }).click();
    await expect(page.getByRole('heading', { name: 'Welcome to MathQuest Kids!' })).toBeVisible();
    expect(await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('mq')))).toEqual([]);
  });

  test('progress persists across reloads; multiple profiles are separate', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'one project is enough');
    await onboard(page, 2);
    await page.getByRole('button', { name: /^Level 2 ?:/ }).click();
    await page.getByRole('button', { name: /^Coins ?\. / }).click();
    await page.getByRole('button', { name: '🚀 Practice' }).click();
    await completeItem(page);
    await page.reload();
    const p = await profileState(page);
    expect(p.totals.answered).toBe(1);
    await page.getByRole('button', { name: 'Grown-Ups' }).click();
    await passGate(page);
    await page.getByRole('button', { name: '+ Add child' }).click();
    await page.getByRole('textbox', { name: 'Nickname' }).fill('Sam');
    await page.getByRole('button', { name: 'Add' }).click();
    const p2 = await profileState(page);
    expect(p2.nickname).toBe('Sam');
    expect(p2.totals.answered).toBe(0);
  });
});

test.describe('offline', () => {
  test('works offline after the first visit (service worker)', async ({ page, context }, info) => {
    test.skip(info.project.name !== 'desktop', 'service worker test runs once');
    await onboard(page, 1);
    await page.waitForFunction(async () => !!(await navigator.serviceWorker.ready));
    await page.reload();
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('heading', { name: /Ready for a math adventure/ })).toBeVisible();
    await page.getByRole('button', { name: /^Level 1 ?:/ }).click();
    await page.getByRole('button', { name: /^Counting ?\. / }).click();
    await page.getByRole('button', { name: '🚀 Practice' }).click();
    await completeItem(page);
    await context.setOffline(false);
  });
});
