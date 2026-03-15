import { defineConfig } from 'bunup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  exports: true,
  external: ['@randsum/roller'],
  splitting: false,
  minify: true,
  sourcemap: 'external',
  target: 'browser',
  clean: true
})
