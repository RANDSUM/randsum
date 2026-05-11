import { defineConfig } from 'bunup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false,
  minify: false,
  sourcemap: 'external',
  target: 'node',
  clean: true,
  noExternal: [/^@randsum\//]
})
