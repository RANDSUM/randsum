import { describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Runs after `bun run build` (the `check` chain builds first). Assertions are
// booleans so a failure does not print a 400 KB page.
// The spec pages build under /spec/ and scripts/build-notation.ts lifts them
// into dist-notation/, notation.randsum.dev's root.
const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(site, 'dist-notation')
const read = (page: string): string => {
  const file = path.join(out, page)
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : ''
}
const root = read('index.html')
const versioned = read('v/0.9.0/index.html')

describe.skipIf(root === '' || versioned === '')('built spec pages (notation.randsum.dev)', () => {
  // The fonts are configured in astro.config.mjs, but nothing loads them unless
  // a page renders <Font />. SpecLayout is not Starlight's Head, so it must.
  test('declares @font-face rules for Gabarito and JetBrains Mono', () => {
    expect(/@font-face\{font-family:Gabarito-/.test(root)).toBe(true)
    expect(/@font-face\{font-family:"?JetBrains Mono-/.test(root)).toBe(true)
  })

  // A plain Astro page inside a Starlight app: none of Starlight's chrome.
  test('renders through SpecLayout, not StarlightPage', () => {
    expect(/class="spec-layout[ "]/.test(root)).toBe(true)
    expect(root.includes('<starlight-theme-select')).toBe(false)
  })

  // The root and the latest version page render the same spec, so both name
  // notation.randsum.dev/ as canonical and both carry Appendix H.
  test.each([
    ['/', root],
    ['/v/0.9.0/', versioned]
  ])('%s is canonical to notation.randsum.dev/ and carries Appendix H', (_, html) => {
    expect(html.includes('<link rel="canonical" href="https://notation.randsum.dev/">')).toBe(true)
    expect(html.includes('id="appendix-h"')).toBe(true)
  })

  test('only the canonical page is in the search index', () => {
    expect(root.includes('data-pagefind-body')).toBe(true)
    expect(versioned.includes('data-pagefind-body')).toBe(false)
  })

  // Served from the host's root, a page must not link back under /spec/.
  test('links within the spec by host paths, not /spec/', () => {
    for (const html of [root, versioned, read('conformance/index.html')]) {
      expect(/(href|src)="\/spec\//.test(html)).toBe(false)
    }
  })

  test('carries the badges, the conformance vectors and a sitemap', () => {
    expect(read('badges/v0.9.0/level-4.svg').startsWith('<svg')).toBe(true)
    expect(JSON.parse(read('conformance/v0.9.0.json')).$id).toBe(
      'https://notation.randsum.dev/conformance/v0.9.0.json'
    )
    expect(read('sitemap.xml').includes('<loc>https://notation.randsum.dev/</loc>')).toBe(true)
    expect(read('sitemap.xml').includes('/v/0.9.0/')).toBe(false)
  })

  test('caches the fingerprinted /_astro/ assets forever', () => {
    expect(read('_headers')).toMatch(
      /^\/_astro\/\*\n {2}Cache-Control: public, max-age=31536000, immutable$/m
    )
  })

  test('randsum.dev keeps no copy, only redirects', () => {
    expect(fs.existsSync(path.join(site, 'dist/spec'))).toBe(false)
    const redirects = fs.readFileSync(path.join(site, 'public/_redirects'), 'utf-8')
    expect(redirects).toMatch(/^\/spec\/\*\s+https:\/\/notation\.randsum\.dev\/:splat\s+301$/m)
  })
})
