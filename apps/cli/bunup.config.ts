import { defineConfig } from 'bunup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  minify: true,
  sourcemap: 'external',
  target: 'node',
  clean: true,
  noExternal: ['@randsum/roller']
})
