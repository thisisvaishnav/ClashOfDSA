import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'battle-engine',
    include: ['src/**/*.test.ts'],
  },
});
