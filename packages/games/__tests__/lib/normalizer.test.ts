import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, test } from 'bun:test'

import type {
  NormalizedDetailsFieldDef,
  NormalizedRollDefinition,
  NormalizedSpec
} from '../../src/lib/normalizedTypes'
import { normalizeSpec } from '../../src/lib/normalizer'
import type { RandSumSpec } from '../../src/lib/types'

const packageDir = join(import.meta.dirname, '..', '..')

function loadSpec(filename: string): RandSumSpec {
  const absPath = join(packageDir, filename)
  return JSON.parse(readFileSync(absPath, 'utf-8')) as RandSumSpec
}

function containsRef(obj: unknown): boolean {
  if (typeof obj !== 'object' || obj === null) return false
  if ('$ref' in obj) return true
  return Object.values(obj as Record<string, unknown>).some(containsRef)
}

function allDetailsHaveKind(details: Readonly<Record<string, NormalizedDetailsFieldDef>>): boolean {
  return Object.values(details).every(d => 'kind' in d)
}

function allPoolsMaterialized(rollDef: NormalizedRollDefinition): boolean {
  if (rollDef.dice !== undefined) {
    const diceArr = Array.isArray(rollDef.dice) ? rollDef.dice : [rollDef.dice]
    if (diceArr.some(d => '$ref' in d.pool)) return false
  }
  if (rollDef.dicePools !== undefined) {
    if (Object.values(rollDef.dicePools).some(d => '$ref' in d.pool)) return false
  }
  if (rollDef.conditionalPools !== undefined) {
    if (Object.values(rollDef.conditionalPools).some(cp => '$ref' in cp.pool)) return false
  }
  if (rollDef.when !== undefined) {
    for (const rc of rollDef.when) {
      if (rc.override.dice !== undefined) {
        const overrideDice = Array.isArray(rc.override.dice) ? rc.override.dice : [rc.override.dice]
        if (overrideDice.some(d => '$ref' in d.pool)) return false
      }
    }
  }
  return true
}

const specFiles = readdirSync(packageDir).filter(f => f.endsWith('.randsum.json'))

describe('normalizeSpec', () => {
  const specs: { readonly filename: string; readonly spec: RandSumSpec }[] = specFiles.map(f => ({
    filename: f,
    spec: loadSpec(f)
  }))

  for (const { filename, spec } of specs) {
    describe(filename, () => {
      const normalized: NormalizedSpec = normalizeSpec(spec)

      test('preserves top-level metadata', () => {
        expect(normalized.name).toBe(spec.name)
        expect(normalized.shortcode).toBe(spec.shortcode)
        expect(normalized.game_url).toBe(spec.game_url)
      })

      test('discovers roll definitions', () => {
        expect(Object.keys(normalized.rolls).length).toBeGreaterThan(0)
      })

      test('contains no $ref values', () => {
        expect(containsRef(normalized)).toBe(false)
      })

      for (const [key, rollDef] of Object.entries(normalized.rolls)) {
        test(`${key}: all pools are materialized`, () => {
          expect(allPoolsMaterialized(rollDef)).toBe(true)
        })

        if (rollDef.details !== undefined) {
          test(`${key}: all details fields have kind discriminant`, () => {
            expect(allDetailsHaveKind(rollDef.details!)).toBe(true)
          })
        }
      }
    })
  }
})

describe('normalizeSpec specifics', () => {
  test('blades: resolves pool $ref to actionDice', () => {
    const spec = loadSpec('blades.randsum.json')
    const normalized = normalizeSpec(spec)
    const roll = normalized.rolls['roll']
    expect(roll).toBeDefined()
    expect(roll!.dice).toBeDefined()
    const dice = Array.isArray(roll!.dice) ? roll!.dice[0]! : roll!.dice!
    expect(dice.pool.sides).toBe(6)
  })

  test('blades: resolves outcome $ref to coreMechanicOutcome', () => {
    const spec = loadSpec('blades.randsum.json')
    const normalized = normalizeSpec(spec)
    const roll = normalized.rolls['roll']
    expect(roll!.outcome).toBeDefined()
    expect('tableLookup' in roll!.outcome!).toBe(true)
    const outcome = roll!.outcome as {
      readonly tableLookup: { readonly ranges: readonly unknown[] }
    }
    expect(outcome.tableLookup.ranges.length).toBe(4)
  })

  test('blades: resolves when override outcome $ref', () => {
    const spec = loadSpec('blades.randsum.json')
    const normalized = normalizeSpec(spec)
    const roll = normalized.rolls['roll']
    expect(roll!.when).toBeDefined()
    expect(roll!.when!.length).toBe(1)
    const override = roll!.when![0]!.override
    expect(override.outcome).toBeDefined()
    expect('ranges' in override.outcome!).toBe(true)
  })

  test('blades: resolves tableLookup $ref inside outcome', () => {
    const spec = loadSpec('blades.randsum.json')
    const normalized = normalizeSpec(spec)
    const roll = normalized.rolls['roll']
    const outcome = roll!.outcome!
    if ('tableLookup' in outcome) {
      expect(outcome.tableLookup.ranges).toBeDefined()
      expect(outcome.tableLookup.ranges.length).toBe(4)
    }
  })

  test('daggerheart: conditional pools are named objects', () => {
    const spec = loadSpec('daggerheart.randsum.json')
    const normalized = normalizeSpec(spec)
    const roll = normalized.rolls['roll']
    expect(roll!.conditionalPools).toBeDefined()
    const cpKeys = Object.keys(roll!.conditionalPools!)
    expect(cpKeys).toContain('advantage')
    expect(cpKeys).toContain('disadvantage')
    expect(roll!.conditionalPools!['advantage']!.pool.sides).toBe(6)
  })

  test('daggerheart: dicePools are materialized', () => {
    const spec = loadSpec('daggerheart.randsum.json')
    const normalized = normalizeSpec(spec)
    const roll = normalized.rolls['roll']
    expect(roll!.dicePools).toBeDefined()
    const hopeDice = roll!.dicePools!['hope']
    expect(hopeDice).toBeDefined()
    expect(hopeDice!.pool.sides).toBeDefined()
  })

  test('daggerheart: details fields have kind discriminants', () => {
    const spec = loadSpec('daggerheart.randsum.json')
    const normalized = normalizeSpec(spec)
    const roll = normalized.rolls['roll']
    expect(roll!.details).toBeDefined()
    const details = roll!.details!

    // 'modifier' is a leaf
    expect(details['modifier']!.kind).toBe('leaf')

    // 'hope' is nested
    expect(details['hope']!.kind).toBe('nested')

    // 'extraDie' is conditional
    expect(details['extraDie']!.kind).toBe('conditional')
  })

  test('daggerheart: conditional details $conditionalPool uses string keys', () => {
    const spec = loadSpec('daggerheart.randsum.json')
    const normalized = normalizeSpec(spec)
    const roll = normalized.rolls['roll']
    const extraDie = roll!.details!['extraDie']!
    expect(extraDie.kind).toBe('conditional')
    if (extraDie.kind === 'conditional') {
      expect(extraDie.fields['advantageRoll']!.$conditionalPool).toBe('advantage')
      expect(extraDie.fields['disadvantageRoll']!.$conditionalPool).toBe('disadvantage')
    }
  })

  test('fifth: when overrides have materialized dice', () => {
    const spec = loadSpec('fifth.randsum.json')
    const normalized = normalizeSpec(spec)
    const roll = normalized.rolls['roll']
    expect(roll!.when).toBeDefined()
    expect(roll!.when!.length).toBe(2)
    for (const rc of roll!.when!) {
      expect(rc.override.dice).toBeDefined()
      const dice = Array.isArray(rc.override.dice) ? rc.override.dice[0]! : rc.override.dice!
      expect(dice.pool.sides).toBe(20)
    }
  })

  test('pbta: details fields are normalized', () => {
    const spec = loadSpec('pbta.randsum.json')
    const normalized = normalizeSpec(spec)
    const roll = normalized.rolls['roll']
    expect(roll!.details).toBeDefined()
    const details = roll!.details!
    expect(details['stat']!.kind).toBe('leaf')
    expect(details['diceTotal']!.kind).toBe('leaf')
    if (details['diceTotal']!.kind === 'leaf') {
      expect(details['diceTotal']!.def).toEqual({ expr: 'diceTotal' })
    }
  })

  test('salvageunion: remoteTableLookup passes through', () => {
    const spec = loadSpec('salvageunion.randsum.json')
    const normalized = normalizeSpec(spec)
    const roll = normalized.rolls['roll']
    const resolve = roll!.resolve
    expect(typeof resolve).toBe('object')
    expect('remoteTableLookup' in resolve).toBe(true)
  })

  test('root-rpg: inline outcome is preserved', () => {
    const spec = loadSpec('root-rpg.randsum.json')
    const normalized = normalizeSpec(spec)
    const roll = normalized.rolls['roll']
    expect(roll!.outcome).toBeDefined()
    expect('ranges' in roll!.outcome!).toBe(true)
    const outcome = roll!.outcome as { readonly ranges: readonly unknown[] }
    expect(outcome.ranges.length).toBe(3)
  })
})
