// GitHub Pages deployment checks against the exact production build (dist-pages/), served
// under the project-site path by scripts/serve-pages.mjs. Run with: npm run test:pages
import { expect, test, type Page } from '@playwright/test';

/** Records console errors, page errors, failed requests and HTTP errors for one page. */
function watch(page: Page) {
  const problems: string[] = [];
  page.on('console', m => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
  page.on('pageerror', e => problems.push(`pageerror: ${e.message}`));
  page.on('requestfailed', r => problems.push(`request failed: ${r.url()} (${r.failure()?.errorText})`));
  page.on('response', r => { if (r.status() >= 400) problems.push(`HTTP ${r.status()}: ${r.url()}`); });
  return problems;
}

const basePath = (baseURL: string | undefined) => new URL(baseURL!).pathname;

async function start(page: Page, level = 2) {
  await page.goto('./');
  await page.getByRole('button', { name: new RegExp(`Start at Level ${level}`) }).click();
  await expect(page.getByRole('heading', { name: /Ready for a math adventure/ })).toBeVisible();
}

async function noHorizontalScroll(page: Page, where: string) {
  const extra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(extra, `horizontal scroll on ${where}`).toBeLessThanOrEqual(1);
}

async function goHome(page: Page) {
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Ready for a math adventure/ })).toBeVisible();
}

test('loads the compiled app with JS, CSS, fonts and icons under the Pages path', async ({ page, baseURL }) => {
  const problems = watch(page);
  const res = await page.goto('./');
  expect(res?.status()).toBe(200);
  await expect(page.getByRole('button', { name: /Start at Level 1/ })).toBeVisible();
  // Everything is requested from the project-site path, never the domain root or raw source.
  const refs = await page.evaluate(() => [...document.querySelectorAll('script[src],link[href]')].map(e => (e as HTMLScriptElement).src || (e as HTMLLinkElement).href));
  for (const u of refs) expect(new URL(u).pathname.startsWith(basePath(baseURL)), u).toBe(true);
  expect(refs.some(u => u.includes('/src/'))).toBe(false);
  // CSS applied (not browser defaults) and the bundled fonts actually loaded.
  const css = await page.evaluate(() => ({ sheets: document.styleSheets.length, font: getComputedStyle(document.body).fontFamily }));
  expect(css.sheets).toBeGreaterThan(0);
  expect(css.font).toMatch(/Nunito/i);
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([document.fonts.load('700 20px "Nunito"'), document.fonts.load('700 20px "Baloo 2"')]);
    return { nunito: document.fonts.check('700 20px "Nunito"'), baloo: document.fonts.check('700 20px "Baloo 2"'),
      loaded: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family) };
  });
  expect(fonts.loaded.length, `loaded fonts: ${fonts.loaded.join(', ')}`).toBeGreaterThan(0);
  expect(fonts.nunito && fonts.baloo).toBe(true);
  // Icons referenced by the page resolve to real images.
  for (const href of await page.evaluate(() => [...document.querySelectorAll('link[rel~="icon"],link[rel="apple-touch-icon"]')].map(l => (l as HTMLLinkElement).href))) {
    const r = await page.request.get(href);
    expect(r.status(), href).toBe(200);
    expect(r.headers()['content-type']).toContain('image/');
  }
  await noHorizontalScroll(page, 'welcome');
  expect(problems).toEqual([]);
});

test('all four levels (lesson + practice question each), stories, tools, games, dashboard gate', async ({ page }) => {
  test.setTimeout(180_000);
  const problems = watch(page);
  await start(page, 2);
  await noHorizontalScroll(page, 'home');
  for (const [n, world] of [[1, 'Discovery Garden'], [2, 'Number Kingdom'], [3, 'Puzzle Island'], [4, 'Logic Galaxy']] as const) {
    await page.getByRole('button', { name: new RegExp(`^Level ${n} ?:`) }).click();
    await expect(page.locator('main')).toContainText(world);
    const trail = page.getByRole('list', { name: `Level ${n} skills` });
    await expect(trail).toBeVisible();
    await noHorizontalScroll(page, `Level ${n} map`);
    await trail.getByRole('button').first().click();
    await page.getByRole('button', { name: '🚀 Practice' }).click();
    await expect(page.locator('#interaction')).toBeVisible();
    await noHorizontalScroll(page, `Level ${n} practice`);
    await goHome(page);
  }
  // Word problems / story adventures
  await page.getByRole('button', { name: /Math Story Adventures/ }).first().click();
  await page.getByRole('button', { name: /Start Level 3 stories/ }).click();
  await expect(page.locator('#interaction, main .story, main h2').first()).toBeVisible();
  await noHorizontalScroll(page, 'story');
  await goHome(page);
  // Math tools: open every tool
  for (const tool of ['Number Line', 'Ten Frames', 'Base-Ten Blocks', 'Fraction Bars', 'Array Builder', 'Clock', 'Balance']) {
    await page.getByRole('button', { name: /Math Tools/ }).click();
    await page.getByRole('button', { name: new RegExp(tool) }).first().click();
    const region = page.getByRole('region', { name: new RegExp(tool) });
    await expect(region).toBeVisible();
    await expect(region.locator('svg, button, input').first()).toBeVisible();
    await noHorizontalScroll(page, `tool ${tool}`);
    await goHome(page);
  }
  // Games
  for (const i of [0, 1]) {
    await page.getByRole('button', { name: /Game Room/ }).click();
    await expect(page.getByRole('heading', { name: 'Balloon Pop' })).toBeVisible();
    await page.getByRole('button', { name: 'Play' }).nth(i).click();
    await expect(page.locator('main')).toBeVisible();
    await noHorizontalScroll(page, `game ${i}`);
    await goHome(page);
  }
  // Collection, then the parent dashboard's parental gate
  await page.getByRole('button', { name: /My Collection/ }).first().click();
  await expect(page.locator('main')).toBeVisible();
  await goHome(page);
  await page.getByRole('button', { name: 'Grown-Ups' }).click();
  await expect(page.locator('.gate-q')).toBeVisible();
  await expect(page.locator('main')).not.toContainText('could not start');
  expect(problems).toEqual([]);
});

test('page refresh and direct URLs do not 404', async ({ page, baseURL }) => {
  const problems = watch(page);
  await start(page, 1);
  await page.getByRole('button', { name: /^Level 1 ?:/ }).click();
  const r1 = await page.reload();
  expect(r1?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: /Ready for a math adventure/ })).toBeVisible();
  const r2 = await page.goto('index.html');
  expect([200, 304]).toContain(r2?.status());
  await expect(page.getByRole('heading', { name: /Ready for a math adventure/ })).toBeVisible();
  // https://user.github.io/mathquest-kids (no trailing slash) still reaches the app.
  await page.goto(new URL(baseURL!).origin + basePath(baseURL).replace(/\/$/, ''));
  await expect(page.getByRole('heading', { name: /Ready for a math adventure/ })).toBeVisible();
  expect(new URL(page.url()).pathname).toBe(basePath(baseURL));
  expect(problems).toEqual([]);
});

test('unknown URLs under the site return to the app (404.html redirect)', async ({ browser, baseURL }) => {
  // A fresh context (no service worker yet) sees the server's real 404 page.
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  const res = await p.goto(new URL('no-such-page/deeper', baseURL).href);
  expect(res?.status()).toBe(404);
  await p.waitForURL(u => u.pathname === basePath(baseURL));
  await expect(p.getByRole('button', { name: /Start at Level 1/ })).toBeVisible();
  await ctx.close();
});

test('PWA manifest and service worker are scoped to the Pages path', async ({ page, baseURL }) => {
  const base = basePath(baseURL);
  await page.goto('./');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBe(`${base}manifest.webmanifest`);
  const manifestUrl = new URL(href!, baseURL).href;
  const res = await page.request.get(manifestUrl);
  expect(res.status()).toBe(200);
  const m = await res.json();
  expect(m.start_url).toBe(base);
  expect(m.scope).toBe(base);
  expect(m.display).toBe('standalone');
  for (const icon of m.icons) {
    const r = await page.request.get(new URL(icon.src, manifestUrl).href);
    expect(r.status(), icon.src).toBe(200);
  }
  const reg = await page.evaluate(async () => { const r = await navigator.serviceWorker.ready; return { scope: r.scope, script: r.active?.scriptURL }; });
  expect(new URL(reg.scope).pathname).toBe(base);
  expect(new URL(reg.script!).pathname).toBe(`${base}sw.js`);
});

test('works offline after the first visit', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'pages-desktop', 'offline check runs once');
  await start(page, 1);
  await page.waitForFunction(async () => !!(await navigator.serviceWorker.ready));
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: /Ready for a math adventure/ })).toBeVisible();
  const fontsOk = await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('700 20px "Nunito"'); });
  expect(fontsOk).toBe(true);
  await page.getByRole('button', { name: /^Level 1 ?:/ }).click();
  await page.getByRole('list', { name: 'Level 1 skills' }).getByRole('button').first().click();
  await page.getByRole('button', { name: '🚀 Practice' }).click();
  await expect(page.locator('#interaction')).toBeVisible();
  await context.setOffline(false);
});
