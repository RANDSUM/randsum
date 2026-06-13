import { describe, expect, test } from 'bun:test'
import { loadSpec } from '../../src/lib/loader'
import { generateCode } from '../../src/lib/codegen'
import { validateSpec } from '../../src/lib/validator'
import type { RandSumSpec } from '../../src/lib/types'

/**
 * Multi-roll support: a spec may declare `rolls` (a record of named rolls) instead of
 * a single `roll`. Each named roll is exported as its own function (e.g. `attack`,
 * `damage`) and loadable independently. `roll` and `rolls` are mutually exclusive and
 * exactly one is required.
 */

const multiRollSpec: RandSumSpec = {
  $schema: 'https://randsum.dev/schemas/v1/randsum.json',
  name: 'Multi Roll Test',
  shortcode: 'multitest',
  game_url: 'https://example.com',
  rolls: {
    attack: {
      dice: { pool: { sides: 20 }, quantity: 1 },
      resolve: 'sum'
    },
    damage: {
      dice: { pool: { sides: 6 }, quantity: 2 },
      resolve: 'sum'
    }
  }
}

describe('multi-roll specs', () => {
  test('validateSpec accepts a spec with `rolls`', () => {
    const result = validateSpec(multiRollSpec)
    expect(result.valid).toBe(true)
  })

  test('codegen emits one exported function per named roll', async () => {
    const code = await generateCode(multiRollSpec)
    expect(code).toContain('export function attack(')
    expect(code).toContain('export function damage(')
    // Single-roll `roll` function must NOT be emitted for a multi-roll spec
    expect(code).not.toContain('export function roll(')
  })

  test('loadSpec exposes every named roll as a callable', () => {
    const loaded = loadSpec(multiRollSpec)
    expect(Object.keys(loaded).sort()).toEqual(['attack', 'damage'])

    const attackFn = loaded.attack
    const damageFn = loaded.damage
    expect(attackFn).toBeDefined()
    expect(damageFn).toBeDefined()

    Array.from({ length: 50 }).forEach(() => {
      const attack = attackFn!()
      expect(attack.total).toBeGreaterThanOrEqual(1)
      expect(attack.total).toBeLessThanOrEqual(20)

      const damage = damageFn!()
      expect(damage.total).toBeGreaterThanOrEqual(2)
      expect(damage.total).toBeLessThanOrEqual(12)
    })
  })

  test('single-roll specs still work unchanged', () => {
    const singleRollSpec: RandSumSpec = {
      $schema: 'https://randsum.dev/schemas/v1/randsum.json',
      name: 'Single Roll Test',
      shortcode: 'singletest',
      game_url: 'https://example.com',
      roll: { dice: { pool: { sides: 20 }, quantity: 1 }, resolve: 'sum' }
    }
    expect(validateSpec(singleRollSpec).valid).toBe(true)
    expect(Object.keys(loadSpec(singleRollSpec))).toEqual(['roll'])
  })

  describe('roll/rolls are mutually exclusive and exactly one is required', () => {
    test('rejects a spec declaring BOTH roll and rolls', () => {
      const both: RandSumSpec = {
        ...multiRollSpec,
        roll: { dice: { pool: { sides: 20 }, quantity: 1 }, resolve: 'sum' }
      }
      expect(validateSpec(both).valid).toBe(false)
      expect(() => loadSpec(both)).toThrow()
    })

    test('rejects a spec declaring NEITHER roll nor rolls', () => {
      const neither: RandSumSpec = {
        $schema: 'https://randsum.dev/schemas/v1/randsum.json',
        name: 'No Roll Test',
        shortcode: 'noroll',
        game_url: 'https://example.com'
      }
      expect(validateSpec(neither).valid).toBe(false)
      expect(() => loadSpec(neither)).toThrow()
    })

    test('rejects roll keys that are not valid identifiers', () => {
      const badKey: RandSumSpec = {
        $schema: 'https://randsum.dev/schemas/v1/randsum.json',
        name: 'Bad Key Test',
        shortcode: 'badkey',
        game_url: 'https://example.com',
        rolls: {
          '1-bad': { dice: { pool: { sides: 6 }, quantity: 1 }, resolve: 'sum' }
        }
      }
      expect(validateSpec(badKey).valid).toBe(false)
    })
  })
})
