import { defineConfig } from 'bunup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/roll/index.ts',
    'src/errors.ts',
    'src/validate.ts',
    'src/tokenize.ts',
    'src/comparison.ts'
  ],
  format: ['esm'],
  dts: true,
  exports: true,
  minify: true,
  sourcemap: 'external',
  target: 'node',
  clean: true
})
