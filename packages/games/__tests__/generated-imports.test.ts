/**
 * Holds the cross-game boundary for the generated game entries.
 *
 * Biome excludes `*.generated.ts` (biome.json `files.includes`), so neither
 * `noRestrictedImports` nor `noImportCycles` sees these files. `gen:check`
 * guarantees each file matches codegen output, so asserting on the committed
 * files here gates the codegen itself: a game entry may import only
 * `@randsum/roller` (and its subpaths), `./types` and `./lib/**`. That rules
 * out a sibling game (`./<game>.generated`) and any `@randsum/games/*` subpath.
 */
import { describe, expect, test } from 'bun:test'
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

const srcDir = resolve(import.meta.dirname, '..', 'src')
const generatedFiles = readdirSync(srcDir).filter(name => name.endsWith('.generated.ts'))

const SPECIFIER = /\b(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g
const ALLOWED = /^(?:@randsum\/roller(?:\/[^/]+)?|\.\/types|\.\/lib\/.+)$/

function importSpecifiers(source: string): readonly string[] {
  return Array.from(source.matchAll(SPECIFIER), match => match[1] ?? '')
}

describe('generated game entries', () => {
  test('exist', () => {
    expect(generatedFiles.length).toBeGreaterThan(0)
  })

  test.each(generatedFiles)('%s imports only roller, ./types and ./lib', file => {
    const source = readFileSync(join(srcDir, file), 'utf8')
    const disallowed = importSpecifiers(source).filter(spec => !ALLOWED.test(spec))
    expect(disallowed).toEqual([])
  })
})
