import { describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Runs after `bun run build`.
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist')
const pages = ['index.html', 'roller/introduction/index.html'].map(page => path.join(dist, page))

// astro.config.mjs configures Inter and JetBrains Mono, but nothing loads them unless
// the Head override renders <Font />; without it --sl-font computed to an empty string.
describe.skipIf(!pages.every(page => fs.existsSync(page)))(
  'built pages load the brand fonts',
  () => {
    for (const page of pages) {
      test(path.relative(dist, page), () => {
        const html = fs.readFileSync(page, 'utf-8')
        expect(html).toMatch(/@font-face\{font-family:Inter-/)
        expect(html).toMatch(/@font-face\{font-family:"?JetBrains Mono-/)
      })
    }
  }
)
