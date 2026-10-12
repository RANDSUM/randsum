/**
 * Test-only helper: a game's `inputs` export, read from its spec.
 *
 * Command tests `mock.module` a game subpath to stub `roll`, which replaces the
 * whole module, so the mock must also supply the `inputs` the command reads
 * its option bounds from. Reading the spec rather than importing the real
 * module keeps the mock from loading the roller the test may have stubbed.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const gamesDir = join(import.meta.dirname, '../../../../../packages/games')

export function specInputs(shortcode: string): unknown {
  const spec = JSON.parse(readFileSync(join(gamesDir, `${shortcode}.randsum.json`), 'utf-8')) as {
    readonly roll: { readonly inputs?: unknown }
  }
  return spec.roll.inputs ?? {}
}
