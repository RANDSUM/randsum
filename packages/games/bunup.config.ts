import { readdirSync } from 'node:fs'
import { defineConfig } from 'bunup'

// Only per-game spec outputs become public subpaths. Meta artifacts
// (like availableGames.generated.ts) are inlined into src/index.ts.
const generatedEntries = readdirSync('src')
  .filter(f => f.endsWith('.generated.ts') && f !== 'availableGames.generated.ts')
  .map(f => `src/${f}`)

// `exports: true` is intentionally OFF. package.json#exports is hand-maintained.
// bunup's auto-generated export keys are derived from output-path common-prefix
// inference, which is fragile: adding a new entry (e.g. availableGames.generated.ts)
// can cause bunup to drop the prefix-stripping and re-key every subpath to
// `./src/*`, silently breaking every consumer. See `exports-sync.test.ts` for
// the guard that catches package.json drift on each build.
export default defineConfig({
  entry: [...generatedEntries, 'src/index.ts', 'src/schema.ts'],
  format: ['esm'],
  dts: true,
  external: ['@randsum/roller'],
  minify: true,
  sourcemap: 'external',
  target: 'browser',
  clean: true
})
