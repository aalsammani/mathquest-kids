import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: { __E2E__: 'false', __APP_VERSION__: '"test"' },
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/property/**/*.test.ts'],
    environment: 'node',
    testTimeout: 60_000,
  },
});
