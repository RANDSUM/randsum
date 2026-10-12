import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { inputs as blades } from '@randsum/games/blades'
import { inputs as daggerheart } from '@randsum/games/daggerheart'
import { inputs as fate } from '@randsum/games/fate'
import { inputs as fifth } from '@randsum/games/fifth'
import { inputs as pbta } from '@randsum/games/pbta'
import { inputs as rootRpg } from '@randsum/games/root-rpg'
import { inputs as salvageunion } from '@randsum/games/salvageunion'

const EXPORTED = {
  blades,
  daggerheart,
  fate,
  fifth,
  pbta,
  'root-rpg': rootRpg,
  salvageunion
} as const

function specInputs(shortcode: string): Readonly<Record<string, unknown>> {
  const path = join(import.meta.dirname, '..', `${shortcode}.randsum.json`)
  const spec = JSON.parse(readFileSync(path, 'utf-8')) as {
    roll: { inputs?: Readonly<Record<string, unknown>> }
  }
  return spec.roll.inputs ?? {}
}

// The bot and the MCP server read input ranges and enums from these exports,
// so they must be the spec's declarations, not a copy that can drift.
describe('generated inputs metadata', () => {
  for (const [shortcode, exported] of Object.entries(EXPORTED)) {
    test(`${shortcode} exports its spec's roll.inputs`, () => {
      expect<unknown>(exported).toEqual(specInputs(shortcode))
    })
  }

  test('blades rating is 0-10', () => {
    expect(blades.rating.minimum).toBe(0)
    expect(blades.rating.maximum).toBe(10)
  })
})
