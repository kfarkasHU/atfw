import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['generated/vitest/**/*.spec.ts'],
    environment: 'node',
  },
});
