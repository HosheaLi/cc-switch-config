import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node18',
  clean: true,
  dts: true,
  minify: false,
  sourcemap: true,
  // Banner removed - shebang now in src/index.ts directly (per D-08)
  outDir: 'dist',
});