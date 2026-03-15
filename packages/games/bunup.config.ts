import { readdirSync } from 'node:fs'
import { defineConfig } from 'bunup'

const generatedEntries = readdirSync('src')
  .filter(f => f.endsWith('.generated.ts'))
  .map(f => `src/${f}`)

export default defineConfig({
  entry: [...generatedEntries, 'src/index.ts', 'src/schema.ts'],
  format: ['esm'],
  dts: true,
  exports: true,
  external: ['@randsum/roller'],
  minify: true,
  sourcemap: 'external',
  clean: true
})
