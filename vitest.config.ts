import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'hooks/**/*.{ts,tsx}',
        'utils/**/*.{ts,tsx}',
        'systemConfig.ts',
      ],
      exclude: [
        'dist/**',
        'dev-dist/**',
        'node_modules/**',
      ],
    },
  },
});


