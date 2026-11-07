import { expect, type Page } from '@playwright/test';
import type { Interaction, Question } from '../../src/core/types';

export async function onboard(page: Page, level: 1 | 2 | 3 | 4 = 2) {
  await page.goto('./');
  await page.getByRole('button', { name: new RegExp(`Start at Level ${level}`) }).click();
  await expect(page.getByRole('heading', { name: /Ready for a math adventure/ })).toBeVisible();
}

export async function currentQuestion(page: Page): Promise<Question> {
  await page.waitForFunction(() => !!(window as unknown as { __mqTest?: unknown }).__mqTest);
  return page.evaluate(() => (window as unknown as { __mqTest: { question: Question } }).__mqTest.question);
}

const inter = (page: Page) => page.locator('#interaction');

/** Answer an interaction through the real UI (correctly unless `wrong`). */
export async function answer(page: Page, i: Interaction, wrong = false) {
  const root = inter(page);
  switch (i.type) {
    case 'choice': {
      const id = wrong ? i.options.find(o => !i.correct.includes(o.id))!.id : i.correct[0]!;
      await root.locator(`.answer[data-opt="${id}"]`).click();
      return;
    }
    case 'numeric': {
      const v = String(wrong ? i.answer + 1 : i.answer);
      for (const d of v) await root.getByRole('button', { name: d, exact: true }).click();
      break;
    }
    case 'order': {
      const ids = wrong ? [...i.correctOrder].reverse() : i.correctOrder;
      for (const id of ids) await root.getByRole('button', { name: `Add ${i.items.find(x => x.id === id)!.label}`, exact: true }).click();
      break;
    }
    case 'numberline': {
      const slider = root.getByRole('slider');
      await slider.focus();
      await page.keyboard.press('Home');
      const k = (i.answer[0] * i.denom) / i.answer[1] - i.min * i.denom + (wrong ? 1 : 0);
      for (let n = 0; n < k; n++) await page.keyboard.press('ArrowRight');
      break;
    }
    case 'shade': {
      const n = wrong ? (i.answer === i.parts ? i.answer - 1 : i.answer + 1) : i.answer;
      for (let k = 0; k < n; k++) await root.getByRole(i.shape === 'bar' ? 'button' : 'checkbox', { name: `Part ${k + 1}`, exact: true }).click();
      break;
    }
    case 'array': {
      let rows = 1, cols = i.product;
      for (let r = i.maxRows; r >= 1; r--) if (i.product % r === 0 && i.product / r <= i.maxCols && (i.fixedRows === undefined || r === i.fixedRows)) { rows = r; cols = i.product / r; break; }
      if (wrong) cols = Math.max(1, cols - 1);
      if (i.fixedRows === undefined) for (let k = 1; k < rows; k++) await root.getByRole('button', { name: 'More rows' }).click();
      for (let k = 1; k < cols; k++) await root.getByRole('button', { name: 'More in each row' }).click();
      break;
    }
    case 'tf': {
      const truth = wrong ? !i.truth : i.truth;
      await root.getByRole('button', { name: truth ? 'True' : 'False', exact: true }).click();
      const idx = i.justifications.findIndex(j => i.correctJust.includes(j.id));
      await root.getByRole('button', { name: new RegExp(`^Reason ${idx + 1}:`) }).click();
      break;
    }
    case 'match': {
      const cols = root.locator('.match-col');
      const pairs = wrong ? i.pairs.map(([l], k) => [l, i.pairs[(k + 1) % i.pairs.length]![1]] as [string, string]) : i.pairs;
      for (const [l, r] of pairs) {
        await cols.nth(0).locator('.match-item').nth(i.left.findIndex(x => x.id === l)).click();
        await cols.nth(1).locator('.match-item').nth(i.right.findIndex(x => x.id === r)).click();
      }
      break;
    }
  }
  await root.locator('[data-check]').click();
}

/** Complete the current item (story phases included) correctly; returns the question. */
export async function completeItem(page: Page): Promise<Question> {
  const q = await currentQuestion(page);
  if (q.phases && (await page.locator('.phase-steps').count())) {
    await inter(page).locator(`.answer[data-opt="${q.phases.understand.interaction.correct[0]}"]`).click();
    await expect(page.locator('.phase-steps li.now')).toHaveText('Plan');
    await inter(page).locator(`.answer[data-opt="${q.phases.plan.interaction.correct[0]}"]`).click();
    await expect(page.locator('.phase-steps li.now')).toHaveText('Solve', { timeout: 8000 });
    await answer(page, q.interaction);
    await page.getByRole('button', { name: 'Yes, it makes sense!' }).click();
    await inter(page).locator(`.learn-box .answer[data-opt="${q.phases.explain.interaction.correct[0]}"]`).click();
  } else {
    await answer(page, q.interaction);
  }
  await expect(page.locator('.feedback.good').first()).toBeVisible();
  return q;
}

export async function nextOrResults(page: Page) {
  const next = page.getByRole('button', { name: /Next →|See results/ });
  await next.click();
}

export async function playRound(page: Page, n: number): Promise<Question[]> {
  const qs: Question[] = [];
  for (let k = 0; k < n; k++) {
    // wait for a fresh question (hook updates per item)
    await expect(page.locator('#act-h')).toContainText(`${k + 1} of`);
    qs.push(await completeItem(page));
    await nextOrResults(page);
  }
  return qs;
}

export async function profileState(page: Page) {
  await page.waitForTimeout(450); // saves are debounced (250 ms)
  return page.evaluate(() => { const s = JSON.parse(localStorage.getItem('mq2_state')!); return s.profiles[s.activeProfileId]; });
}

const W: Record<string, number> = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
const words = (s: string) => s.split(/[\s-]+/).reduce((acc, w) => acc + (W[w] ?? 0), 0);
export async function passGate(page: Page) {
  const text = await page.locator('.gate-q').textContent();
  const m = text!.match(/What is (.+) times (.+)\?/)!;
  await page.getByLabel('Answer in digits').fill(String(words(m[1]!) * words(m[2]!)));
  await holdContinue(page);
}
export async function holdContinue(page: Page) {
  const b = page.getByRole('button', { name: 'Press and hold to continue' });
  await b.hover();
  await page.mouse.down();
  await page.waitForTimeout(1400);
  await page.mouse.up();
}

export async function noHorizontalScroll(page: Page) {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(over, 'horizontal scroll').toBeLessThanOrEqual(1);
}
