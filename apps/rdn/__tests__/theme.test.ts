import { describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rdnDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const globalCss = path.join(rdnDir, 'src/styles/global.css')
const RAW_HEX = /#[0-9a-fA-F]{3,8}\b/g

describe('only theme colours', () => {
  test('global.css imports the shared theme, and the file exists', () => {
    const imported = fs.readFileSync(globalCss, 'utf-8').match(/@import '([^']+theme\.css)'/)
    expect(imported?.[1]).toBeDefined()
    expect(fs.existsSync(path.resolve(path.dirname(globalCss), imported?.[1] ?? ''))).toBe(true)
  })

  // Biome's no-raw-color plugin covers .css files but cannot see Astro <style>
  // blocks, so this is the same rule for those.
  const astroFiles = [...new Bun.Glob('src/**/*.astro').scanSync({ cwd: rdnDir })]

  test('finds the Astro components', () => {
    expect(astroFiles.length).toBeGreaterThan(0)
  })

  test.each(astroFiles)('%s has no raw hex in a <style> block', file => {
    const source = fs.readFileSync(path.join(rdnDir, file), 'utf-8')
    const styles = [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1])
    expect(styles.join('\n').match(RAW_HEX) ?? []).toEqual([])
  })
})
