import { defineConfig } from 'bunup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false,
  minify: true,
  sourcemap: 'external',
  target: 'node',
  clean: true,
  noExternal: ['@randsum/roller', '@randsum/notation', '@randsum/display-utils']
})
