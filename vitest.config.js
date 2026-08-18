import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      // Auch nie importierte Dateien in den Report aufnehmen: sonst fehlen
      // ungetestete Komponenten komplett im lcov und die ausgewiesene Coverage
      // ist höher als die tatsächliche. (In Vitest 4 steuert `include` das —
      // das früher übliche `all: true` gibt es nicht mehr.)
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{js,jsx}',
        '**/*.config.{js,ts}',
        '**/main.jsx',
        'dist/',
      ],
    },
  },
});
