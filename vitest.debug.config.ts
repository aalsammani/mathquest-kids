import { defineConfig } from 'vitest/config';
// Developer probes: aggregated validator issues and human-review samples (not part of CI).
export default defineConfig({
  define: { __E2E__: 'false', __APP_VERSION__: '"debug"' },
  test: { include: ['tests/validation/debug/**/*.test.ts'], environment: 'node', testTimeout: 600_000 },
});
