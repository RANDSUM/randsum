import { describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Runs after `bun run build` (the `check` chain builds first).
const builtIndex = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist/index.html')
const html = fs.existsSync(builtIndex) ? fs.readFileSync(builtIndex, 'utf-8') : ''

describe.skipIf(html === '')('built spec page', () => {
  // The fonts are configured in astro.config.ts, but nothing loads them unless a
  // page renders <Font />. Without it the body fell back to Times in production.
  test('declares @font-face rules for Inter and JetBrains Mono', () => {
    expect(html).toMatch(/@font-face\{font-family:Inter-/)
    expect(html).toMatch(/@font-face\{font-family:"?JetBrains Mono-/)
  })

  test('code blocks carry both Shiki themes instead of a fixed github-dark', () => {
    expect(html).toContain('astro-code-themes github-light github-dark')
    expect(html).not.toContain('background-color:#24292e')
  })
})
