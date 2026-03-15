import { defineConfig } from 'bunup'

export default defineConfig({
  entry: ['src/index.ts', 'src/validateNotation.ts', 'src/tokenize.ts', 'src/comparison/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  exports: true,
  splitting: false,
  minify: true,
  sourcemap: 'external',
  target: 'node',
  clean: true
})
