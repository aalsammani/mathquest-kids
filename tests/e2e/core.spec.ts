import { expect, test } from '@playwright/test';
import { answer, completeItem, currentQuestion, noHorizontalScroll, onboard, playRound, profileState } from './helpers';

test.describe('first launch & levels', () => {
  test('onboarding → four Level labels, no grade terminology', async ({ page }) => {
    await page.goto('./');
    await expect(page.getByRole('heading', { name: 'Welcome to MathQuest Kids!' })).toBeVisible();
    await noHorizontalScroll(page);
    await page.getByRole('button', { name: /Start at Level 2/ }).click();
    const cards = page.locator('.grade-card .g-name');
    await expect(cards).toHaveText(['Level 1', 'Level 2', 'Level 3', 'Level 4']);
    await expect(page.locator('.grade-card.recommended .g-name')).toHaveText('Level 2');
    for (const lvl of [1, 2, 3, 4]) {
      await page.getByRole('button', { name: new RegExp(`^Level ${lvl} ?:`) }).click();
      await expect(page.locator('body')).not.toContainText(/Kindergarten|Grade [123K]/);
      await noHorizontalScroll(page);
      await page.getByRole('button', { name: 'Home' }).click();
    }
  });

  test('top bar has no "Lv" XP label (audit M6)', async ({ page }) => {
    await onboard(page);
    await expect(page.locator('.topbar')).not.toContainText(/\bLv\b/);
  });

  test('loading the app does not record a practice day (audit M2)', async ({ page }) => {
    await onboard(page);
    await page.reload();
    expect((await profileState(page)).practiceDays).toEqual([]);
  });
});

test.describe('learning flow', () => {
  test('lesson worked example reveals step by step, then a full practice round is recorded', async ({ page }) => {
    await onboard(page, 2);
    await page.getByRole('button', { name: /^Level 2 ?:/ }).click();
    await page.getByRole('button', { name: /^Adding to 20 ?\. / }).click();
    await expect(page.getByRole('heading', { name: 'Adding to 20' })).toBeVisible();
    const next = page.getByRole('button', { name: /Show next step/ });
    await next.click(); await next.click();
    await expect(page.getByRole('button', { name: /All steps shown/ })).toBeDisabled();
    await page.getByRole('button', { name: '🚀 Practice' }).click();
    await playRound(page, 8);
    await expect(page.getByRole('heading', { name: /Great thinking!/ })).toBeVisible();
    await expect(page.locator('.results-stars .star-on')).toHaveCount(3);
    const p = await profileState(page);
    const rec = p.skills['L2-add20'];
    expect(rec.attempts).toHaveLength(8);
    expect(rec.attempts.every((a: { firstTry: boolean; hints: number }) => a.firstTry && a.hints === 0)).toBe(true);
    expect(rec.stars).toBe(3);
    expect(p.coins).toBeGreaterThan(0);
    // reasoning items appeared in the round (2 reasoning slots)
    expect(rec.attempts.filter((a: { mode: string }) => a.mode !== 'solve').length).toBeGreaterThanOrEqual(1);
    await noHorizontalScroll(page);
  });

  test('hint use and second tries are recorded as assisted, with a persistence badge', async ({ page }) => {
    await onboard(page, 3);
    await page.getByRole('button', { name: /^Level 3 ?:/ }).click();
    await page.getByRole('button', { name: /^Two-Digit Adding ?\. / }).click();
    await page.getByRole('button', { name: '🚀 Practice' }).click();
    // item 1: use a hint, then answer correctly
    let q = await currentQuestion(page);
    await page.getByRole('button', { name: /Hint/ }).click();
    await expect(page.locator('.feedback.hint')).toBeVisible();
    await answer(page, q.interaction);
    await page.getByRole('button', { name: /Next →/ }).click();
    // item 2: wrong first, then right
    await expect(page.locator('#act-h')).toContainText('2 of');
    q = await currentQuestion(page);
    await answer(page, q.interaction, true);
    await expect(page.locator('.feedback.hint')).toContainText(/try|look|not quite/i);
    if (q.interaction.type === 'numeric') await page.locator('#interaction').getByRole('button', { name: 'Clear' }).click();
    await answer(page, q.interaction);
    await expect(page.locator('.feedback.good')).toContainText('You kept trying');
    const p = await profileState(page);
    const [a1, a2] = p.skills['L3-addregroup'].attempts;
    expect(a1).toMatchObject({ hints: 1, correct: true }); // hinted → assisted (independent = first try AND no hints)
    expect(a2).toMatchObject({ tries: 2, firstTry: false, correct: true });
    expect(p.badges.persistent).toBeTruthy();
  });

  test('a wrong final answer shows the correct answer, explanation and worked steps', async ({ page }) => {
    await onboard(page, 1);
    await page.getByRole('button', { name: /^Level 1 ?:/ }).click();
    await page.getByRole('button', { name: /^Putting Together ?\. / }).click();
    await page.getByRole('button', { name: '🚀 Practice' }).click();
    const q = await currentQuestion(page);
    if (q.interaction.type !== 'choice') test.skip(true, 'first item is not multiple choice');
    const i = q.interaction as { options: { id: string }[]; correct: string[] };
    const wrongs = i.options.filter(o => !i.correct.includes(o.id));
    await page.locator(`#interaction .answer[data-opt="${wrongs[0]!.id}"]`).click();
    await expect(page.locator('.feedback.hint')).toBeVisible();
    await page.locator(`#interaction .answer[data-opt="${wrongs[1]!.id}"]`).click();
    await expect(page.locator('.feedback.bad')).toContainText(q.answerText);
    await expect(page.locator('.feedback.bad .fb-steps li').first()).toBeVisible();
  });

  test('Math Story Adventure: Understand → Plan → Solve → Check → Explain', async ({ page }) => {
    await onboard(page, 3);
    await page.getByRole('button', { name: /Math Story Adventures/ }).click();
    await page.getByRole('button', { name: 'Start Level 3 stories' }).click();
    const q = await currentQuestion(page);
    await expect(page.locator('.phase-steps li.now')).toHaveText('Understand');
    await expect(page.locator('.q-story')).toContainText(q.prompt);
    await completeItem(page);
    await expect(page.getByText('Story solved!')).toBeVisible();
    expect((await profileState(page)).counters.stories).toBe(1);
  });

  test('Skill Check: hint-free, single try, awards provisional mastery when passed', async ({ page }) => {
    await page.addInitScript(() => {
      if (localStorage.getItem('mq2_state')) return;
      const t = Date.now();
      const attempts = Array.from({ length: 8 }, (_, i) => ({ t: t - 1000 * i, qid: `q${i}`, sig: `seed-sig-${i}`, mode: i === 0 ? 'another-way' : 'solve', diff: 3, ctx: 'practice', correct: true, firstTry: true, tries: 1, hints: 0, guess: 0, ms: 4000 }));
      const id = 'p-test';
      localStorage.setItem('mq2_state', JSON.stringify({ schemaVersion: 2, activeProfileId: id, onboarded: true, settings: { sound: false, voice: false, slow: false, large: false, motion: true, contrast: false, volume: 0.5 }, parent: { breakMinutes: 0, reviewDelayDays: 1, timedGames: false },
        profiles: { [id]: { id, nickname: 'Tester', mascot: 'fox', createdAt: t, level: 2, coins: 0, unlocked: ['fox'], badges: {}, practiceDays: [], totals: { answered: 8, correct: 8, timeMs: 0 }, skills: { 'L2-add20': { attempts, stars: 3, bestPct: 100, plays: 1, timeMs: 0 } }, history: [], counters: { explain: 0, mistake: 0, anotherWay: 1, detective: 0, stories: 0, persistence: 0, tools: [], worlds: [], checksPassed: 0 }, familyDone: [] } } }));
    });
    await page.goto('./');
    await page.getByRole('button', { name: /^Level 2 ?:/ }).click();
    await expect(page.getByRole('button', { name: /^Adding to 20 ?\. .*Ready for a Skill Check/ })).toBeVisible();
    await page.getByRole('button', { name: /^Adding to 20 ?\. / }).click();
    await page.getByRole('button', { name: '🏆 Skill Check' }).click();
    await expect(page.getByRole('button', { name: /Hint/ })).toBeHidden();
    await playRound(page, 6);
    await expect(page.getByRole('heading', { name: 'Skill Check passed!' })).toBeVisible();
    const p = await profileState(page);
    expect(p.skills['L2-add20'].provisionalAt).toBeGreaterThan(0);
    expect(p.badges.master).toBeTruthy();
  });

  test('every interaction type works through the real UI', async ({ page }) => {
    test.slow();
    await onboard(page, 1);
    const seen = new Set<string>();
    const runSkill = async (level: number, skillName: RegExp, items = 8) => {
      await page.goto('./');
      await page.getByRole('button', { name: new RegExp(`^Level ${level} ?:`) }).click();
      await page.getByRole('button', { name: skillName }).click();
      await page.getByRole('button', { name: '🚀 Practice' }).click();
      for (let k = 0; k < items; k++) {
        await expect(page.locator('#act-h')).toContainText(`${k + 1} of`);
        const q = await completeItem(page);
        seen.add(q.interaction.type);
        await page.getByRole('button', { name: /Next →|See results/ }).click();
      }
    };
    // Each interaction type is forced via a test-build-only hook so coverage is deterministic.
    await page.addInitScript(() => { const g = sessionStorage.getItem('forceGen'); if (g) (window as unknown as { __mqForceGen?: string }).__mqForceGen = g; });
    const forced: [number, RegExp, string, string][] = [
      [1, /^Putting Together /, 'add.objects', 'choice'],
      [1, /^Number Friends /, 'numerals.match', 'match'],
      [1, /^Number Order /, 'order.sort', 'order'],
      [2, /^Number Lines /, 'nl.locate', 'numberline'],
      [3, /^Equal Parts /, 'frac.shade', 'shade'],
      [3, /^Equal Parts /, 'frac.equal-parts', 'tf'],
      [3, /^Arrays /, 'mult.build-array', 'array'],
      [4, /^Pattern Rules /, 'patterns.rule', 'numeric'],
      [4, /^Fraction Number Line /, 'fline.place', 'numberline'],
    ];
    for (const [lvl, name, gen, type] of forced) {
      await page.evaluate(g => sessionStorage.setItem('forceGen', g), gen);
      const before = seen.size;
      await runSkill(lvl, name, 2);
      expect(seen.has(type), `${gen} should render a ${type} interaction (seen: ${[...seen]}, before ${before})`).toBe(true);
    }
    await page.evaluate(() => sessionStorage.removeItem('forceGen'));
    for (const t of ['choice', 'numeric', 'order', 'numberline', 'shade', 'array', 'tf', 'match']) expect(seen, `missing ${t}`).toContain(t);
  });
});
