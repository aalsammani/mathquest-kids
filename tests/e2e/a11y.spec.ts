import AxeBuilder from '@axe-core/playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { currentQuestion, onboard, passGate } from './helpers';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
async function scan(page: Page, name: string) {
  await page.waitForTimeout(250);
  const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  // One evidence file per (viewport, screen): never overwritten by other workers.
  const project = test.info().project.name;
  mkdirSync('reports/e2e/axe', { recursive: true });
  writeFileSync(`reports/e2e/axe/${project}--${name}.json`, JSON.stringify({ project, screen: name, axe: r.testEngine.version, passes: r.passes.length, violations: r.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help })) }, null, 1));
  const serious = r.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map(v => `${v.id}: ${v.help} (${v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(' | ')})`), `axe on ${name}`).toEqual([]);
}

test.describe('accessibility (axe-core, WCAG 2.2 A/AA rules)', () => {
  test('all main screens have no serious/critical violations', async ({ page }) => {
    test.slow();
    await page.goto('./');
    await scan(page, 'welcome');
    await page.getByRole('button', { name: /Start at Level 3/ }).click();
    await scan(page, 'home');
    await page.getByRole('button', { name: /^Level 3 ?:/ }).click();
    await scan(page, 'map');
    await page.getByRole('button', { name: /^Equal Parts ?\. / }).click();
    await scan(page, 'lesson');
    await page.getByRole('button', { name: '🚀 Practice' }).click();
    await currentQuestion(page);
    await scan(page, 'activity');
    await page.goto('./');
    await page.getByRole('button', { name: /Math Tools/ }).click();
    await scan(page, 'tools');
    await page.getByRole('button', { name: /Base-Ten/ }).click();
    await scan(page, 'tool-blocks');
    await page.goto('./');
    await page.getByRole('button', { name: /My Collection/ }).click();
    await scan(page, 'collection');
    await page.goto('./');
    await page.getByRole('button', { name: 'Settings' }).click();
    await scan(page, 'settings-modal');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Grown-Ups' }).click();
    await scan(page, 'gate');
    await passGate(page);
    await scan(page, 'dashboard');
    await page.getByRole('tab', { name: 'Skills' }).click();
    await scan(page, 'dashboard-skills');
  });

  test('high contrast + large text modes also pass', async ({ page }) => {
    await onboard(page, 2);
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByLabel('High contrast').check();
    await page.getByLabel('Large text').check();
    await page.keyboard.press('Escape');
    await scan(page, 'home-contrast');
  });

  test('keyboard only: modal traps focus, Escape closes and restores focus; number keys answer', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'keyboard test on desktop');
    await onboard(page, 1);
    const settings = page.getByRole('button', { name: 'Settings' });
    await settings.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    for (let i = 0; i < 20; i++) await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role=dialog]'))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(settings).toBeFocused();
    await page.getByRole('button', { name: /^Level 1 ?:/ }).focus();
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: /^Counting ?\. / }).focus();
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: '🚀 Practice' }).focus();
    await page.keyboard.press('Enter');
    const q = await currentQuestion(page);
    if (q.interaction.type === 'choice') {
      const idx = q.interaction.options.findIndex(o => (q.interaction as { correct: string[] }).correct.includes(o.id));
      await page.locator('#interaction').focus().catch(() => {});
      await page.keyboard.press(String(idx + 1));
      await expect(page.locator('.feedback.good')).toBeVisible();
      await page.keyboard.press('Enter');
      await expect(page.locator('#act-h')).toContainText('2 of');
    }
  });

  test('touch targets are at least 44×44 CSS px on the activity screen', async ({ page }) => {
    await onboard(page, 2);
    await page.getByRole('button', { name: /^Level 2 ?:/ }).click();
    await page.getByRole('button', { name: /^Missing Numbers ?\. / }).click();
    await page.getByRole('button', { name: '🚀 Practice' }).click();
    await currentQuestion(page);
    const small = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('main button, .topbar button')]
      .filter(b => b.offsetParent !== null).map(b => ({ t: (b.getAttribute('aria-label') ?? b.textContent ?? '').trim().slice(0, 30), w: b.getBoundingClientRect().width, h: b.getBoundingClientRect().height }))
      .filter(x => x.w < 44 || x.h < 44));
    expect(small).toEqual([]);
  });
});
