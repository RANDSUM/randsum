import { describe, expect, test } from 'bun:test'

/**
 * The web (`index.ts`) and native (`index.native.ts`) barrels must expose the same public
 * component API — Metro picks `index.native.ts` for React Native, every other bundler picks
 * `index.ts`. When they drift, a consumer importing a name present in one barrel but missing
 * from the other crashes only on the affected platform (e.g. `DocModal` was exported from web
 * but not native, crashing the Expo app at runtime while typechecking clean via a hand-written
 * ambient .d.ts). This test parses both barrels and asserts their *value* exports match.
 */

// Parse `export { A, B as C } from '...'` (NOT `export type { ... }`) and the names a module
// exposes as runtime values, normalizing `X as Y` to the exported name `Y`.
function valueExports(source: string): Set<string> {
  const names = new Set<string>()
  const exportBlock = /export\s+(type\s+)?\{([^}]*)\}/g
  for (const match of source.matchAll(exportBlock)) {
    const isTypeOnly = match[1] !== undefined
    if (isTypeOnly) continue
    const body = match[2] ?? ''
    for (const rawEntry of body.split(',')) {
      const entry = rawEntry.trim()
      if (entry.length === 0) continue
      // Skip inline `type X` specifiers inside a value export block
      if (entry.startsWith('type ')) continue
      const asMatch = /(?:\bas\s+)([A-Za-z0-9_$]+)$/.exec(entry)
      names.add(asMatch ? asMatch[1]! : entry)
    }
  }
  return names
}

describe('dice-ui barrel parity', () => {
  test('web and native barrels export the same value names', async () => {
    const dir = new URL('../src/', import.meta.url)
    const web = await Bun.file(new URL('index.ts', dir)).text()
    const native = await Bun.file(new URL('index.native.ts', dir)).text()

    const webExports = valueExports(web)
    const nativeExports = valueExports(native)

    const missingFromNative = [...webExports].filter(name => !nativeExports.has(name)).sort()
    const missingFromWeb = [...nativeExports].filter(name => !webExports.has(name)).sort()

    expect(
      missingFromNative,
      `value exports missing from index.native.ts: ${missingFromNative.join(', ')}`
    ).toEqual([])
    expect(
      missingFromWeb,
      `value exports missing from index.ts: ${missingFromWeb.join(', ')}`
    ).toEqual([])
  })

  test('sanity: both barrels export DocModal and QuickReferenceGrid', async () => {
    const dir = new URL('../src/', import.meta.url)
    const web = valueExports(await Bun.file(new URL('index.ts', dir)).text())
    const native = valueExports(await Bun.file(new URL('index.native.ts', dir)).text())
    for (const name of ['DocModal', 'QuickReferenceGrid', 'DiceUIThemeProvider']) {
      expect(web.has(name)).toBe(true)
      expect(native.has(name)).toBe(true)
    }
  })
})
