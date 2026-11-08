import { defineConfig, devices } from '@playwright/test';

// Optional local check (not part of CI): the E2E suite in Playwright's WebKit engine with iPad and
// iPhone device emulation (Safari layout, touch, viewport, inert/scroll behaviour).
// Emulation is NOT a physical device: it cannot judge real iPad speech quality or speaker volume.
// See docs/IPAD_TEST_CHECKLIST.md for the manual device test.
//   npx playwright install webkit && npm run build:e2e && npx playwright test --config playwright.ipad.config.ts
export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: ['progression.spec.ts', 'core.spec.ts', 'audio.spec.ts'],
  timeout: 120_000,
  fullyParallel: true,
  workers: 3,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'reports/e2e-ipad/results.json' }]],
  use: { baseURL: 'http://localhost:4176', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: { command: 'node node_modules/vite/bin/vite.js preview --outDir dist-e2e --port 4176 --strictPort', url: 'http://localhost:4176', reuseExistingServer: !process.env.CI, timeout: 60_000 },
  projects: [
    { name: 'ipad-portrait', use: { ...devices['iPad (gen 7)'] } },
    { name: 'ipad-landscape', use: { ...devices['iPad (gen 7) landscape'] } },
    { name: 'iphone', use: { ...devices['iPhone 13'] } },
  ],
});
