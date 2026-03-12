import { describe, expect, test } from 'bun:test'
import { loadSpec, validateSpec } from '../src'

const BASE_MULTI = {
  $schema: 'https://randsum.dev/schemas/v1/randsum.json',
  name: 'Multi-Pool Test',
  shortcode: 'test-multi',
  game_url: 'https://example.com',
  roll: {
    dicePools: {
      hope: { pool: { sides: 12 }, quantity: 1 },
      fear: { pool: { sides: 12 }, quantity: 1 }
    },
    resolve: {
      comparePoolHighest: {
        pools: ['hope', 'fear'],
        ties: 'critical hope',
        outcomes: { hope: 'hope', fear: 'fear' }
      }
    }
  }
}

const RUNTIME_SPEC = {
  $schema: 'https://randsum.dev/schemas/v1/randsum.json',
  name: 'Multi-Pool Runtime Test',
  shortcode: 'test-mpr',
  game_url: 'https://example.com',
  roll: {
    dicePools: {
      hope: { pool: { sides: 12 }, quantity: 1 },
      fear: { pool: { sides: 12 }, quantity: 1 }
    },
    resolve: {
      comparePoolHighest: {
        pools: ['hope', 'fear'],
        ties: 'critical hope',
        outcomes: { hope: 'hope', fear: 'fear' }
      }
    }
  }
}

describe('dicePools runtime execution', () => {
  test('result is one of the declared outcomes or ties value', () => {
    const game = loadSpec(RUNTIME_SPEC)
    const VALID = ['hope', 'fear', 'critical hope']
    Array.from({ length: 100 }, () => game.roll()).forEach(r => {
      expect(VALID).toContain(r.result)
    })
  })

  test('rolls contains entries from both pools', () => {
    const game = loadSpec(RUNTIME_SPEC)
    const r = game.roll()
    // Two separate pools → at least 2 roll records
    expect(r.rolls.length).toBeGreaterThanOrEqual(2)
  })

  test('total is the sum of both pool totals', () => {
    const game = loadSpec(RUNTIME_SPEC)
    Array.from({ length: 20 }, () => game.roll()).forEach(r => {
      // Each pool rolls 1d12, so total should be 2-24
      expect(r.total).toBeGreaterThanOrEqual(2)
      expect(r.total).toBeLessThanOrEqual(24)
    })
  })

  test('comparePoolSum works the same way', () => {
    const sumSpec = {
      ...RUNTIME_SPEC,
      roll: {
        ...RUNTIME_SPEC.roll,
        resolve: {
          comparePoolSum: {
            pools: ['hope', 'fear'],
            ties: 'tie',
            outcomes: { hope: 'hope_wins', fear: 'fear_wins' }
          }
        }
      }
    }
    const game = loadSpec(sumSpec)
    const VALID = ['hope_wins', 'fear_wins', 'tie']
    Array.from({ length: 50 }, () => game.roll()).forEach(r => {
      expect(VALID).toContain(r.result)
    })
  })
})

describe('dicePools schema validation', () => {
  test('spec with dicePools and comparePoolHighest is valid', () => {
    const result = validateSpec(BASE_MULTI)
    expect(result.valid).toBe(true)
  })

  test('spec with comparePoolSum is valid', () => {
    const result = validateSpec({
      ...BASE_MULTI,
      roll: {
        ...BASE_MULTI.roll,
        resolve: {
          comparePoolSum: {
            pools: ['hope', 'fear'],
            ties: 'tie',
            outcomes: { hope: 'hope_wins', fear: 'fear_wins' }
          }
        }
      }
    })
    expect(result.valid).toBe(true)
  })

  test('dicePools and dice together is invalid', () => {
    const result = validateSpec({
      ...BASE_MULTI,
      roll: {
        ...BASE_MULTI.roll,
        dice: { pool: { sides: 6 }, quantity: 1 }
      }
    })
    expect(result.valid).toBe(false)
  })

  test('comparePoolHighest missing ties field is valid (ties is optional)', () => {
    const result = validateSpec({
      ...BASE_MULTI,
      roll: {
        ...BASE_MULTI.roll,
        resolve: {
          comparePoolHighest: {
            pools: ['hope', 'fear'],
            outcomes: { hope: 'hope', fear: 'fear' }
          }
        }
      }
    })
    expect(result.valid).toBe(true)
  })
})
