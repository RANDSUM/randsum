import { defineConfig } from 'bunup'

export default defineConfig({
  entry: ['src/index.ts', 'src/types/index.ts', 'src/errors.ts', 'src/validate.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  exports: true,
  splitting: false,
  minify: true,
  sourcemap: 'external',
  target: 'node',
  clean: true
})
