import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Base path for GitHub Pages project site (https://<user>.github.io/research_buddy/).
// Overridable via VITE_BASE for local dev / other hosts.
const base = process.env.VITE_BASE ?? '/research_buddy/';

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      // The backend's browser-safe, fs-free data pipeline (Person B).
      // Imported as source; Vite/esbuild bundle the TypeScript directly.
      '@backend': fileURLToPath(new URL('../src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
