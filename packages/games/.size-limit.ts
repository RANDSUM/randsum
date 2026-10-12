import { readdirSync } from 'node:fs'

// One budget per game subpath, derived from src/ the same way bunup.config.ts
// derives its entries, so a new game is gated without a hand-added entry.
// salvageunion bakes its remote tables into the bundle and is the only exception.
const LIMIT = '15 KB'
const OVERRIDES: Readonly<Record<string, string>> = { salvageunion: '33 KB' }

const checks: readonly { readonly path: string; readonly limit: string }[] = readdirSync('src')
  .filter(f => f.endsWith('.generated.ts') && f !== 'availableGames.generated.ts')
  .map(f => f.replace(/\.generated\.ts$/, ''))
  .map(game => ({ path: `dist/${game}.generated.js`, limit: OVERRIDES[game] ?? LIMIT }))

export default checks
