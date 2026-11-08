// v2.1 regression: complete activity sessions — not just the first question — across all four levels,
// on phone, tablet and desktop, with touch/mouse/keyboard and rapid-tap protection.
import { expect, test, type Page } from '@playwright/test';
import type { Interaction } from '../../src/core/types';
import { answer, completeItem, currentQuestion, noHorizontalScroll, onboard, profileState } from './helpers';

const NEXT = /Next question|Next story|See my results/;
const nextBtn = (page: Page) => page.getByRole('button', { name: NEXT });

/** Watch for console errors and failed requests during a test. */
function watch(page: Page) {
  const problems: string[] = [];
  page.on('console', m => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
  page.on('pageerror', e => problems.push(`pageerror: ${e.message}`));
  page.on('requestfailed', r => problems.push(`request failed: ${r.url()}`));
  return problems;
}

/** One wrong try is possible for these types without disturbing the second attempt. */
const retryable = (i: Interaction) => ['choice', 'tf', 'match', 'order', 'numeric', 'numberline'].includes(i.type) && !(i.type === 'choice' && i.options.length - i.correct.length < 1);

async function answerCurrent(page: Page, k: number) {
  const q = await currentQuestion(page);
  if (k % 3 === 1 && retryable(q.interaction)) {
    await answer(page, q.interaction, true);
    await expect(page.locator('.feedback.hint')).toBeVisible();          // "Try again…" — not a dead end
    await expect(nextBtn(page)).toBeHidden();
    await answer(page, q.interaction, false);
  } else {
    await answer(page, q.interaction, false);
  }
  await expect(page.locator('.feedback.good, .feedback.bad').first()).toBeVisible();
}

async function playSession(page: Page, n: number, unit = 'Question') {
  for (let k = 0; k < n; k++) {
    await expect(page.locator('#act-h')).toHaveText(`${unit} ${k + 1} of ${n}`);
    await answerCurrent(page, k);
    const next = nextBtn(page);
    await expect(next).toBeVisible();
    await expect(next, `Next must be on screen after question ${k + 1}`).toBeInViewport({ ratio: 0.9 });
    await next.click();
  }
}

test.describe('complete practice sessions in every level', () => {
  for (const level of [1, 2, 3, 4] as const) {
    test(`Level ${level}: 10-question practice → results → replay → back to level`, async ({ page }) => {
      test.slow();
      const problems = watch(page);
      await onboard(page, level);
      await page.getByRole('button', { name: new RegExp(`^Level ${level} ?:`) }).click();
      await page.getByRole('list', { name: `Level ${level} skills` }).getByRole('button').first().click();
      await page.getByRole('button', { name: '🚀 Practice' }).click();
      await playSession(page, 10);
      const results = page.locator('.results-card');
      await expect(results.getByRole('heading', { level: 2 })).toBeVisible();
      await expect(results).toContainText('/10');
      await noHorizontalScroll(page);
      // Replay starts a valid NEW session at question 1.
      await page.getByRole('button', { name: /Practice again/ }).click();
      await expect(page.locator('#act-h')).toHaveText('Question 1 of 10');
      await answerCurrent(page, 0);
      await nextBtn(page).click();
      await expect(page.locator('#act-h')).toHaveText('Question 2 of 10');
      // Leaving mid-round asks first; then return to the level map.
      await page.getByRole('button', { name: 'Exit this activity' }).click();
      await page.getByRole('button', { name: 'Leave' }).click();
      await page.getByRole('button', { name: '🚀 Practice' }).click();
      await playSession(page, 10);
      await page.getByRole('button', { name: `🗺️ Back to Level ${level}` }).click();
      await expect(page.getByRole('list', { name: `Level ${level} skills` })).toBeVisible();
      const p = await profileState(page);
      const answered = Object.values(p.skills as Record<string, { attempts: unknown[] }>).reduce((s, r) => s + r.attempts.length, 0);
      expect(answered).toBe(21);
      expect(problems).toEqual([]);
    });
  }
});

test('Next works after wrong answers when retries are not allowed (Find my level)', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /Find my level/ }).click();
  for (let k = 0; k < 3; k++) {
    await expect(page.locator('#act-h')).toContainText(`Question ${k + 1} of`);
    const q = await currentQuestion(page);
    if (q.interaction.type === 'shade' || q.interaction.type === 'array') await answer(page, q.interaction, false);
    else await answer(page, q.interaction, true); // wrong, single try
    await expect(page.locator('.feedback.good, .feedback.bad').first()).toBeVisible();
    await expect(nextBtn(page)).toBeInViewport({ ratio: 0.9 });
    await nextBtn(page).click();
  }
});

test.describe('rapid taps and keyboard', () => {
  test('a fast double tap on Next advances exactly once and does not answer the next question', async ({ page }) => {
    await onboard(page, 2);
    await page.getByRole('button', { name: /^Level 2 ?:/ }).click();
    await page.getByRole('list', { name: 'Level 2 skills' }).getByRole('button').first().click();
    await page.getByRole('button', { name: '🚀 Practice' }).click();
    for (let k = 0; k < 2; k++) {
      await completeItem(page);
      await expect(nextBtn(page)).toBeInViewport({ ratio: 0.9 });
      await page.waitForTimeout(700); // let the smooth scroll that reveals Next finish, as a child would
      const box = (await nextBtn(page).boundingBox())!;
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { clickCount: 1 });
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { clickCount: 1 });
      await expect(page.locator('#act-h')).toHaveText(`Question ${k + 2} of 10`);
      await page.waitForTimeout(500);
      await expect(page.locator('#act-h')).toHaveText(`Question ${k + 2} of 10`);
      await expect(page.locator('.feedback.good, .feedback.bad')).toHaveCount(0); // the second tap answered nothing
    }
    const p = await profileState(page);
    expect(p.skills['L2-add20']?.attempts ?? Object.values(p.skills as Record<string, { attempts: unknown[] }>)[0]!.attempts).toHaveLength(2);
  });

  test('Enter on question 2+ advances exactly one question (no stacked key handlers)', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'keyboard test on desktop');
    await onboard(page, 2);
    await page.getByRole('button', { name: /^Level 2 ?:/ }).click();
    await page.getByRole('list', { name: 'Level 2 skills' }).getByRole('button').first().click();
    await page.getByRole('button', { name: '🚀 Practice' }).click();
    for (let k = 0; k < 4; k++) {
      await expect(page.locator('#act-h')).toHaveText(`Question ${k + 1} of 10`);
      await completeItem(page);
      await expect(nextBtn(page)).toBeFocused();
      await page.keyboard.press('Enter');
    }
    await expect(page.locator('#act-h')).toHaveText('Question 5 of 10');
  });

  test('a double tap on ✓ Check counts as ONE try (the child still gets a second chance)', async ({ page }) => {
    await page.addInitScript(() => { (window as unknown as { __mqForceGen?: string }).__mqForceGen = 'frac.shade'; });
    await onboard(page, 3);
    await page.getByRole('button', { name: /^Level 3 ?:/ }).click();
    await page.getByRole('button', { name: /^Equal Parts / }).click();
    await page.getByRole('button', { name: '🚀 Practice' }).click();
    const q = await currentQuestion(page);
    expect(q.interaction.type).toBe('shade');
    await page.locator('#interaction [data-check]').dblclick(); // 0 parts shaded: wrong, sent twice
    await expect(page.locator('.feedback.hint')).toBeVisible();   // still "try again", not a final wrong answer
    await expect(nextBtn(page)).toBeHidden();
  });
});

test.describe('other activity types complete and can be replayed', () => {
  test('Math Story Adventure: 3 stories, visible coaching in every step, then "More stories"', async ({ page }, info) => {
    test.skip(info.project.name === 'tablet', 'phone + desktop are enough for the long story flow');
    test.slow();
    await onboard(page, 2);
    await page.getByRole('button', { name: /Math Story Adventures/ }).first().click();
    await page.getByRole('button', { name: /Start Level 2 stories/ }).click();
    for (let k = 0; k < 3; k++) {
      await expect(page.locator('#act-h')).toHaveText(`Story ${k + 1} of 3`);
      const q = await currentQuestion(page);
      if (k === 0) {
        // a wrong reason in the Explain step shows visible coaching (not just sound)
        await page.locator(`#interaction .answer[data-opt="${q.phases!.understand.interaction.correct[0]}"]`).click();
        await page.locator(`#interaction .answer[data-opt="${q.phases!.plan.interaction.correct[0]}"]`).click({ timeout: 8000 });
        await answer(page, q.interaction);
        await page.getByRole('button', { name: 'Yes, it makes sense!' }).click();
        const wrong = q.phases!.explain.interaction.options.find(o => !q.phases!.explain.interaction.correct.includes(o.id));
        if (wrong) { await page.locator(`.learn-box .answer[data-opt="${wrong.id}"]`).click(); await expect(page.locator('.learn-box .feedback.hint')).toContainText('Good try'); }
        await page.locator(`.learn-box .answer[data-opt="${q.phases!.explain.interaction.correct[0]}"]`).click();
      } else await completeItem(page);
      await expect(page.getByText('Story solved!')).toBeVisible();
      await expect(nextBtn(page)).toBeInViewport({ ratio: 0.9 });
      await nextBtn(page).click();
    }
    await expect(page.locator('.results-card')).toContainText('Story Adventure complete!');
    await page.getByRole('button', { name: /More stories/ }).click();
    await expect(page.locator('#act-h')).toHaveText('Story 1 of 3');
  });

  test('Daily Review and Level Challenge: 10 questions each, results, Play again', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'mixed sessions run once');
    test.slow();
    await onboard(page, 1);
    await page.getByRole('button', { name: /Daily Review/ }).click();
    await playSession(page, 10);
    await expect(page.locator('.results-card')).toContainText('Review complete!');
    await page.getByRole('button', { name: /Play again/ }).click();
    await expect(page.locator('#act-h')).toHaveText('Question 1 of 10');
    await page.getByRole('button', { name: 'Home', exact: true }).click(); // nothing answered yet: leaves without asking
    await page.getByRole('button', { name: /^Level 4 ?:/ }).click();
    await page.getByRole('button', { name: /Level 4 Challenge/ }).click();
    await playSession(page, 10);
    await expect(page.locator('.results-card h2')).toContainText(/Challenge/);
    await page.getByRole('button', { name: '🗺️ Back to Level 4' }).click();
    await expect(page.getByRole('list', { name: 'Level 4 skills' })).toBeVisible();
  });
});

test.describe('games and tools never trap the child', () => {
  test('Balloon Pop (relaxed): 10 rounds → finish message → Play again starts a new game', async ({ page }) => {
    test.slow();
    await onboard(page, 2);
    await page.getByRole('button', { name: /Game Room/ }).click();
    await page.getByRole('button', { name: 'Play' }).first().click();
    await page.getByRole('button', { name: /Start game/ }).click();
    const solve = (t: string) => { const m = t.match(/(\d+)\s*([+−×])\s*(\d+)/)!; const a = Number(m[1]), b = Number(m[3]); return m[2] === '+' ? a + b : m[2] === '−' ? a - b : a * b; };
    for (let r = 1; r <= 10; r++) {
      await expect(page.locator('.bp-msg')).toHaveText(`Round ${r} of 10`);
      const ans = solve((await page.locator('.bp-eq').textContent())!);
      await page.getByRole('button', { name: `Balloon ${ans}`, exact: true }).dispatchEvent('click'); // balloons float; dispatch avoids chasing them
    }
    await expect(page.locator('.bp-done')).toContainText('Great job! You popped 10 balloons');
    await page.getByRole('button', { name: /Play again/ }).click();
    await expect(page.locator('.bp-msg')).toHaveText('Round 1 of 10');
  });

  test('Memory Match: finish all pairs → finish message → Play again deals new cards', async ({ page }) => {
    await onboard(page, 4);
    await page.getByRole('button', { name: /Game Room/ }).click();
    await page.getByRole('button', { name: 'Play' }).nth(1).click();
    const faces = await page.locator('.mm-card .mm-face').allTextContents();
    const val = (t: string) => { const m = t.match(/(\d+)\s*([+−×])\s*(\d+)/); if (!m) return Number(t); const a = Number(m[1]), b = Number(m[3]); return m[2] === '+' ? a + b : m[2] === '−' ? a - b : a * b; };
    const used = new Set<number>();
    for (let i = 0; i < faces.length; i++) {
      if (used.has(i) || !/[+−×]/.test(faces[i]!)) continue;
      const j = faces.findIndex((f, k) => !used.has(k) && k !== i && !/[+−×]/.test(f) && Number(f) === val(faces[i]!));
      used.add(i); used.add(j);
      await page.locator('.mm-card').nth(i).click();
      await page.locator('.mm-card').nth(j).click();
    }
    await expect(page.locator('.mm-done')).toContainText('You matched them all');
    await page.getByRole('button', { name: /Play again/ }).click();
    await expect(page.locator('.mm-done')).toBeHidden();
    await expect(page.locator('.mm-card.matched')).toHaveCount(0);
  });

  test('every Math Tool has a visible way back', async ({ page }) => {
    await onboard(page, 2);
    await page.getByRole('button', { name: /Math Tools/ }).click();
    for (const tool of ['Number Line', 'Ten Frames', 'Base-Ten Blocks', 'Fraction Bars', 'Array Builder', 'Clock', 'Balance']) {
      await page.getByRole('button', { name: new RegExp(tool) }).first().click();
      await expect(page.getByRole('heading', { level: 2, name: new RegExp(tool) })).toBeVisible();
      await page.getByRole('button', { name: '← Back to Math Tools' }).click();
      await expect(page.getByRole('heading', { name: /Math Tools/ })).toBeVisible();
    }
  });
});
