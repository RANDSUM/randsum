import { defineConfig } from 'bunup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/roll/index.ts',
    'src/errors.ts',
    'src/validate.ts',
    'src/notation/tokenize.ts',
    'src/notation/comparison/index.ts'
  ],
  format: ['esm'],
  dts: true,
  exports: false,
  minify: true,
  sourcemap: 'external',
  target: 'node',
  clean: true
})
