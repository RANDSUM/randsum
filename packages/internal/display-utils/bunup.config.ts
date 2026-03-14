import { defineConfig } from 'bunup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  exports: true,
  external: ['@randsum/roller'],
  minify: true,
  sourcemap: 'external',
  target: 'browser',
  clean: true
})
