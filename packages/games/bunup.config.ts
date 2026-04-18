import { readdirSync } from 'node:fs'
import { defineConfig } from 'bunup'

// Only per-game spec outputs should become public subpaths. Meta artifacts
// (like availableGames.generated.ts) are inlined into src/index.ts.
const generatedEntries = readdirSync('src')
  .filter(f => f.endsWith('.generated.ts') && f !== 'availableGames.generated.ts')
  .map(f => `src/${f}`)

export default defineConfig({
  entry: [...generatedEntries, 'src/index.ts', 'src/schema.ts'],
  format: ['esm'],
  dts: true,
  exports: true,
  external: ['@randsum/roller'],
  minify: true,
  sourcemap: 'external',
  target: 'browser',
  clean: true
})
