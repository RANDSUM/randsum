import { describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Runs after `bun run build` (the `check` chain builds first). Assertions are
// booleans so a failure does not print a 400 KB page.
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist')
const read = (page: string): string => {
  const file = path.join(dist, page)
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : ''
}
const root = read('spec/index.html')
const versioned = read('spec/v/0.9.0/index.html')

describe.skipIf(root === '' || versioned === '')('built /spec pages', () => {
  // The fonts are configured in astro.config.mjs, but nothing loads them unless
  // a page renders <Font />. SpecLayout is not Starlight's Head, so it must.
  test('declares @font-face rules for Inter and JetBrains Mono', () => {
    expect(/@font-face\{font-family:Inter-/.test(root)).toBe(true)
    expect(/@font-face\{font-family:"?JetBrains Mono-/.test(root)).toBe(true)
  })

  // A plain Astro page inside a Starlight app: none of Starlight's chrome.
  test('renders through SpecLayout, not StarlightPage', () => {
    expect(/class="spec-layout[ "]/.test(root)).toBe(true)
    expect(root.includes('<starlight-theme-select')).toBe(false)
  })

  // The root and the latest version page render the same spec, so both name
  // the versioned URL as canonical and both carry Appendix H.
  test.each([
    ['/spec/', root],
    ['/spec/v/0.9.0/', versioned]
  ])('%s is canonical to /spec/v/0.9.0/ and carries Appendix H', (_, html) => {
    expect(html.includes('<link rel="canonical" href="https://randsum.dev/spec/v/0.9.0/">')).toBe(
      true
    )
    expect(html.includes('id="appendix-h"')).toBe(true)
  })

  test('only the canonical page is in the search index', () => {
    expect(root.includes('data-pagefind-body')).toBe(false)
    expect(versioned.includes('data-pagefind-body')).toBe(true)
  })
})
