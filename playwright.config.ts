import { defineConfig, devices } from '@playwright/test';

// E2E runs against the production-like `--mode e2e` build (adds a read-only test hook).
// Browser: the locally installed Microsoft Edge (Chromium) via the `msedge` channel.
// Set PW_CHANNEL=chromium to use Playwright's bundled Chromium instead (used in GitHub Actions).
const channel = process.env.PW_CHANNEL ?? 'msedge';
const ch = channel === '' || channel === 'chromium' ? {} : { channel };
const CI = !!process.env.CI;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  fullyParallel: true,
  workers: CI ? 2 : 4,
  retries: CI ? 1 : 0,
  reporter: [['list'], ['json', { outputFile: 'reports/e2e/results.json' }], ['html', { outputFolder: 'reports/e2e/html', open: 'never' }]],
  use: { baseURL: 'http://localhost:4173', ...ch, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: { command: 'node node_modules/vite/bin/vite.js preview --outDir dist-e2e --port 4173 --strictPort', url: 'http://localhost:4173', reuseExistingServer: !CI, timeout: 60_000 },
  projects: [
    { name: 'phone', use: { ...devices['Pixel 7'], ...ch } },
    { name: 'tablet', use: { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, ...ch } },
    { name: 'desktop', use: { viewport: { width: 1280, height: 860 }, ...ch } },
  ],
});
