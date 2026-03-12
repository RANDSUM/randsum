import { describe, expect, test } from 'bun:test'
import { validateSpec } from '../src'

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
