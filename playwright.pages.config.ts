import { defineConfig, devices } from '@playwright/test';

// GitHub Pages checks: everything is served under the project-site path (default /mathquest-kids/)
// by scripts/serve-pages.mjs, which behaves like GitHub Pages (no SPA fallback, real 404 page).
//
//   phone/tablet/desktop : the full E2E suite (tests/e2e) against `--mode e2e-pages` (dist-e2e-pages/),
//             i.e. the production code under the Pages base plus the read-only test hook.
//   pages-*  : deployment checks (tests/pages) against the exact production build that is
//             uploaded to GitHub Pages (dist-pages/): assets, fonts, icons, manifest, service
//             worker, offline, console errors and failed requests, phone and desktop.
//
// Build first: npm run build:pages && npm run build:e2e:pages   (or: npm run test:pages)
let base = process.env.BASE_PATH?.trim() || '/mathquest-kids/';
if (!base.startsWith('/')) base = '/' + base;
if (!base.endsWith('/')) base += '/';
const channel = process.env.PW_CHANNEL ?? 'msedge';
const ch = channel === '' || channel === 'chromium' ? {} : { channel };
const CI = !!process.env.CI;
const E2E = `http://localhost:4174${base}`;
const PROD = `http://localhost:4175${base}`;

export default defineConfig({
  timeout: 90_000,
  fullyParallel: true,
  workers: CI ? 2 : 4,
  retries: CI ? 1 : 0,
  reporter: [['list'], ['json', { outputFile: 'reports/e2e-pages/results.json' }], ['html', { outputFolder: 'reports/e2e-pages/html', open: 'never' }]],
  use: { ...ch, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: [
    { command: `node scripts/serve-pages.mjs dist-e2e-pages ${base} 4174`, url: E2E, reuseExistingServer: !CI, timeout: 60_000 },
    { command: `node scripts/serve-pages.mjs dist-pages ${base} 4175`, url: PROD, reuseExistingServer: !CI, timeout: 60_000 },
  ],
  projects: [
    { name: 'phone', testDir: 'tests/e2e', use: { ...devices['Pixel 7'], ...ch, baseURL: E2E } },
    { name: 'tablet', testDir: 'tests/e2e', use: { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, ...ch, baseURL: E2E } },
    { name: 'desktop', testDir: 'tests/e2e', use: { viewport: { width: 1280, height: 860 }, ...ch, baseURL: E2E } },
    { name: 'pages-phone', testDir: 'tests/pages', use: { ...devices['Pixel 7'], ...ch, baseURL: PROD } },
    { name: 'pages-iphone-size', testDir: 'tests/pages', use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3, ...ch, baseURL: PROD } },
    { name: 'pages-desktop', testDir: 'tests/pages', use: { viewport: { width: 1280, height: 860 }, ...ch, baseURL: PROD } },
  ],
});
