import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    // jsdom is rebuilt per test file; vmThreads reuses it per worker and keeps per-file isolation (~4-9x faster here).
    pool: 'vmThreads',
    globals: true,
    setupFiles: ['./src/renderer/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer'),
    },
  },
});
