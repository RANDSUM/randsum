import { describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { gamePackages } from '../src/utils/packageData'

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const theme = fs.readFileSync(path.join(siteDir, 'src/styles/theme.css'), 'utf-8')

// Biome's design-token plugins (biome-plugins/no-raw-*.grit) cover stylesheets
// and Astro <style> blocks. Inline styles in React and Astro markup are code,
// not CSS, so this holds them to the same rule.
describe('only theme colours', () => {
  const files = [...new Bun.Glob('src/**/*.{astro,tsx,ts}').scanSync({ cwd: siteDir })]
  // The Ko-fi widget draws its own button and only takes a hex colour
  const ALLOWED = new Set(['src/components/KofiButton.astro'])

  test('finds the components', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  test.each(files.filter(file => !ALLOWED.has(file)))(
    '%s spells no colour in markup or code',
    file => {
      const source = fs.readFileSync(path.join(siteDir, file), 'utf-8')
      // <style> blocks are Biome's; everything else here is markup or script
      const code = source.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')
      expect(code.match(/['"`]#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([])
    }
  )

  test('every game has a theme colour', () => {
    const missing = gamePackages.map(g => `--game-${g.id}:`).filter(t => !theme.includes(t))
    expect(missing).toEqual([])
  })
})

// Shared patterns live in src/components/ui/. A page that hand-rolls one drifts
// from the rest of the site, so the old ad-hoc classes stay gone.
describe('shared components', () => {
  const markup = [...new Bun.Glob('src/**/*.{astro,tsx}').scanSync({ cwd: siteDir })].filter(
    file => !file.startsWith('src/components/ui/')
  )

  test.each(markup)('%s uses <Button> and <Section>, not ad-hoc classes', file => {
    const source = fs.readFileSync(path.join(siteDir, file), 'utf-8')
    const adHoc =
      /class(Name)?="(?:[^"]*\s)?(btn|btn-[a-z]+|section-divider|pkg-card)(?:\s[^"]*)?"/g
    expect(source.match(adHoc) ?? []).toEqual([])
    // Sections are spaced apart, never ruled off
    if (/^src\/(pages|components\/landing)\//.test(file))
      expect(source.match(/<hr\b/g) ?? []).toEqual([])
  })
})
