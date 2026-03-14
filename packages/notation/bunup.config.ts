import { defineConfig } from 'bunup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/parse.ts',
    'src/validate.ts',
    'src/transform.ts',
    'src/comparison/index.ts',
    'src/schemas.ts',
    'src/tokenize.ts',
    'src/types.ts'
  ],
  format: ['esm', 'cjs'],
  dts: true,
  exports: true,
  splitting: false,
  minify: true,
  sourcemap: 'external',
  target: 'node',
  clean: true
})
