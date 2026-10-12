import { describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { gamePackages } from '../src/utils/packageData'

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const theme = fs.readFileSync(path.join(siteDir, 'src/styles/theme.css'), 'utf-8')
const RAW_HEX = /#[0-9a-fA-F]{3,8}\b/g

// Biome's no-raw-color plugin covers .css files but cannot see Astro <style>
// blocks, so this is the same rule for those.
describe('only theme colours', () => {
  const astroFiles = [...new Bun.Glob('src/**/*.astro').scanSync({ cwd: siteDir })]

  test('finds the Astro components', () => {
    expect(astroFiles.length).toBeGreaterThan(0)
  })

  test.each(astroFiles)('%s has no raw hex in a <style> block', file => {
    const source = fs.readFileSync(path.join(siteDir, file), 'utf-8')
    const styles = [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1])
    expect(styles.join('\n').match(RAW_HEX) ?? []).toEqual([])
  })

  test('every game has a theme colour', () => {
    const missing = gamePackages.map(g => `--game-${g.id}:`).filter(t => !theme.includes(t))
    expect(missing).toEqual([])
  })
})
