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
  banner: { js: '#!/usr/bin/env node' },
  outDir: 'dist',
});