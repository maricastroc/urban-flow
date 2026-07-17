import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// The engine is pure (no DOM), so tests run in the Node environment.
// The `@` alias mirrors tsconfig `paths` so tests can import `@/engine`, `@/render`, etc.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
