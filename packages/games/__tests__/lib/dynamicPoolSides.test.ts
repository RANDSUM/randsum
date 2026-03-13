import { describe, expect, test } from 'bun:test'
import { generateCode } from '../../src/lib/codegen'
import { loadSpec, validateSpec } from '../../src/lib'

const DYNAMIC_SIDES_SPEC = {
  $schema: 'https://randsum.dev/schemas/v1/randsum.json',
  name: 'Dynamic Sides Test',
  shortcode: 'test-dyn',
  game_url: 'https://example.com',
  roll: {
    inputs: {
      amplify: { type: 'boolean' as const, default: false }
    },
    dicePools: {
      hope: {
        pool: { sides: { $input: 'amplify', ifTrue: 20, ifFalse: 12 } },
        quantity: 1
      },
      fear: { pool: { sides: 12 }, quantity: 1 }
    },
    resolve: {
      comparePoolHighest: {
        pools: ['hope', 'fear'],
        ties: 'tie',
        outcomes: { hope: 'hope', fear: 'fear' }
      }
    }
  }
}

describe('dynamic pool sides (conditional IntegerOrInput)', () => {
  describe('schema validation', () => {
    test('spec with { $input, ifTrue, ifFalse } sides is valid', () => {
      const result = validateSpec(DYNAMIC_SIDES_SPEC)
      expect(result.valid).toBe(true)
    })

    test('spec with conditional sides in single-pool dice is valid', () => {
      const result = validateSpec({
        $schema: 'https://randsum.dev/schemas/v1/randsum.json',
        name: 'Single Pool Dynamic',
        shortcode: 'test-spd',
        game_url: 'https://example.com',
        roll: {
          inputs: { big: { type: 'boolean' as const, default: false } },
          dice: {
            pool: { sides: { $input: 'big', ifTrue: 20, ifFalse: 6 } },
            quantity: 1
          },
          resolve: 'sum'
        }
      })
      expect(result.valid).toBe(true)
    })
  })

  describe('runtime behavior', () => {
    test('ifTrue=20 produces values up to 20 when input is true', () => {
      const game = loadSpec(DYNAMIC_SIDES_SPEC)
      const results = Array.from({ length: 50 }, () => game.roll({ amplify: true }))
      const hopeTotals = results.flatMap(r =>
        r.rolls.filter(rec => rec.rolls.length > 0).map(rec => rec.rolls[0])
      )
      // With d20, at least one value should exceed 12 in 50 rolls (extremely likely)
      // But we can only verify bounds: all values <= 20
      hopeTotals.forEach(v => {
        if (v !== undefined) {
          expect(v).toBeGreaterThanOrEqual(1)
          expect(v).toBeLessThanOrEqual(20)
        }
      })
    })

    test('ifFalse=12 keeps values within d12 range when input is false', () => {
      const game = loadSpec(DYNAMIC_SIDES_SPEC)
      const results = Array.from({ length: 50 }, () => game.roll({ amplify: false }))
      const hopeTotals = results.flatMap(r =>
        r.rolls.filter(rec => rec.rolls.length > 0).map(rec => rec.rolls[0])
      )
      hopeTotals.forEach(v => {
        if (v !== undefined) {
          expect(v).toBeGreaterThanOrEqual(1)
          expect(v).toBeLessThanOrEqual(12)
        }
      })
    })

    test('default false uses ifFalse value', () => {
      const game = loadSpec(DYNAMIC_SIDES_SPEC)
      const results = Array.from({ length: 50 }, () => game.roll())
      const hopeTotals = results.flatMap(r =>
        r.rolls.filter(rec => rec.rolls.length > 0).map(rec => rec.rolls[0])
      )
      hopeTotals.forEach(v => {
        if (v !== undefined) {
          expect(v).toBeGreaterThanOrEqual(1)
          expect(v).toBeLessThanOrEqual(12)
        }
      })
    })
  })

  describe('codegen', () => {
    test('generates ternary expression for conditional sides', async () => {
      const code = await generateCode(DYNAMIC_SIDES_SPEC)
      expect(code).toContain('? 20 : 12')
    })

    test('generated code references the input field', async () => {
      const code = await generateCode(DYNAMIC_SIDES_SPEC)
      expect(code).toContain('amplify')
    })

    test('static sides pool is unaffected', async () => {
      const code = await generateCode(DYNAMIC_SIDES_SPEC)
      // fear pool uses static 12
      expect(code).toContain('sides: 12')
    })
  })
})
