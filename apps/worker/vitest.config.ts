import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@repo/db': path.resolve(__dirname, '../../packages/db/src'),
      '@repo/queue': path.resolve(__dirname, '../../packages/queue/src'),
    },
  },
  test: {
    name: 'worker',
    include: ['src/**/*.test.ts'],
  },
});
