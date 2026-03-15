import { readdirSync } from 'node:fs'
import { defineConfig } from 'bunup'

const generatedEntries = readdirSync('src')
  .filter(f => f.endsWith('.generated.ts'))
  .map(f => `src/${f}`)

export default defineConfig({
  entry: [...generatedEntries, 'src/index.ts', 'src/schema.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  exports: true,
  external: ['@randsum/roller'],
  splitting: false,
  minify: true,
  sourcemap: 'external',
  clean: true
})
