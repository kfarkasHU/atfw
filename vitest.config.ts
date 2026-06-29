import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['generated/**/*.spec.ts'],
    environment: 'node',
  },
});
