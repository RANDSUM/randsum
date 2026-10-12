import { describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// The Cloudflare adapter puts static assets under dist/client/. Runs after `bun run build`.
const client = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist/client')
const pages = ['index.html', 'roller/introduction/index.html'].map(page => path.join(client, page))

// astro.config.mjs configures Inter and JetBrains Mono, but nothing loads them unless
// the Head override renders <Font />; without it --sl-font computed to an empty string.
describe.skipIf(!pages.every(page => fs.existsSync(page)))(
  'built pages load the brand fonts',
  () => {
    for (const page of pages) {
      test(path.relative(client, page), () => {
        const html = fs.readFileSync(page, 'utf-8')
        expect(html).toMatch(/@font-face\{font-family:Inter-/)
        expect(html).toMatch(/@font-face\{font-family:"?JetBrains Mono-/)
      })
    }
  }
)
