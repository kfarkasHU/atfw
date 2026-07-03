import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['generated/vitest/**/*.spec.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['test/**/*.ts'],
      exclude: ['generated/**/*.spec.ts'],
      reportsDirectory: 'coverage/vitest',
      reporter: ['html', 'text-summary', 'json-summary'],
    },
  },
});
