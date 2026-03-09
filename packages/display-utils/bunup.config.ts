import { defineConfig } from 'bunup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  external: ['@randsum/roller'],
  minify: true,
  sourcemap: 'external',
  target: 'node',
  clean: true
})
