import { defineConfig } from 'vitest/config';

// Large-sample, fixed-seed validation of every registered generator.
// Writes reports/math-validation-report.json and reports/MATH_VALIDATION_SUMMARY.md
export default defineConfig({
  define: { __E2E__: 'false', __APP_VERSION__: '"validation"' },
  test: {
    include: ['tests/validation/**/*.test.ts'],
    exclude: ['tests/validation/debug/**', '**/node_modules/**'],
    environment: 'node',
    testTimeout: 600_000,
  },
});
