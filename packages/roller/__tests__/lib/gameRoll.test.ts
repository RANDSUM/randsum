import { describe, expect, test } from 'bun:test'
import { createGameRoll, createMultiRollGameRoll } from '../../src/lib/gameRoll'
import { ValidationError } from '../../src/errors'

describe('createGameRoll', () => {
  describe('basic functionality', () => {
    test('creates a working roll function', () => {
      const simpleRoll = createGameRoll({
        validate: () => undefined,
        toRollOptions: () => ({ sides: 6, quantity: 1 }),
        interpretResult: (_input, total) => total
      })

      const result = simpleRoll({})

      expect(result.total).toBeGreaterThanOrEqual(1)
      expect(result.total).toBeLessThanOrEqual(6)
      expect(result.result).toBe(result.total)
      expect(result.rolls).toHaveLength(1)
    })

    test('passes input to all config functions', () => {
      interface TestInput {
        modifier: number
        sides: number
      }

      const rollWithInput = createGameRoll<TestInput, number>({
        validate: input => {
          if (input.modifier < -10 || input.modifier > 10) {
            throw new ValidationError('modifier out of range')
          }
        },
        toRollOptions: input => ({
          sides: input.sides,
          quantity: 1,
          modifiers: { plus: input.modifier }
        }),
        interpretResult: (_input, total) => total
      })

      const result = rollWithInput({ modifier: 5, sides: 20 })

      expect(result.total).toBeGreaterThanOrEqual(6) // 1 + 5
      expect(result.total).toBeLessThanOrEqual(25) // 20 + 5
    })

    test('validation throws on invalid input', () => {
      const rollWithValidation = createGameRoll<{ value: number }, number>({
        validate: input => {
          if (input.value < 0) {
            throw new ValidationError('value must be positive')
          }
        },
        toRollOptions: () => ({ sides: 6, quantity: 1 }),
        interpretResult: (_input, total) => total
      })

      expect(() => rollWithValidation({ value: -1 })).toThrow(ValidationError)
    })
  })

  describe('with array of RollOptions', () => {
    test('handles multiple roll options', () => {
      const multiRoll = createGameRoll({
        validate: () => undefined,
        toRollOptions: () => [
          { sides: 20, quantity: 1 },
          { sides: 6, quantity: 2 }
        ],
        interpretResult: (_input, total) => total
      })

      const result = multiRoll({})

      // 1d20 (1-20) + 2d6 (2-12) = 3-32
      expect(result.total).toBeGreaterThanOrEqual(3)
      expect(result.total).toBeLessThanOrEqual(32)
      expect(result.rolls).toHaveLength(2)
    })
  })

  describe('interpretResult', () => {
    test('receives total and rolls', () => {
      const captured: { total?: number; rolls?: unknown[] } = {}

      const rollWithCapture = createGameRoll({
        validate: () => undefined,
        toRollOptions: () => ({ sides: 6, quantity: 2 }),
        interpretResult: (_input, total, rolls) => {
          captured.total = total
          captured.rolls = rolls
          return 'captured'
        }
      })

      const result = rollWithCapture({})

      expect(captured.total).toBe(result.total)
      expect(captured.rolls).toEqual(result.rolls)
      expect(result.result).toBe('captured')
    })

    test('can transform result type', () => {
      type Outcome = 'success' | 'failure'

      const passFailRoll = createGameRoll<{ dc: number }, Outcome>({
        validate: () => undefined,
        toRollOptions: () => ({ sides: 20, quantity: 1 }),
        interpretResult: (input, total) => (total >= input.dc ? 'success' : 'failure')
      })

      // Roll against DC 1 should always succeed
      const easyResult = passFailRoll({ dc: 1 })
      expect(easyResult.result).toBe('success')

      // Roll against DC 21 should always fail
      const hardResult = passFailRoll({ dc: 21 })
      expect(hardResult.result).toBe('failure')
    })
  })
})

describe('createMultiRollGameRoll', () => {
  describe('basic functionality', () => {
    test('creates a working multi-roll function', () => {
      const multiRoll = createMultiRollGameRoll({
        validate: () => undefined,
        toRollOptions: () => [
          { sides: 12, quantity: 1, key: 'hope' },
          { sides: 12, quantity: 1, key: 'fear' }
        ],
        interpretResult: (_input, _rollResult, rollsByKey) => {
          const hope = rollsByKey.get('hope')
          const fear = rollsByKey.get('fear')
          return {
            result: hope && fear ? 'both' : 'missing'
          }
        }
      })

      const result = multiRoll({})

      expect(result.result).toBe('both')
      expect(result.rolls).toHaveLength(2)
    })

    test('builds rollsByKey map correctly', () => {
      const captured: { map?: Map<string, unknown> } = {}

      const rollWithKeys = createMultiRollGameRoll({
        validate: () => undefined,
        toRollOptions: () => [
          { sides: 6, quantity: 1, key: 'attack' },
          { sides: 8, quantity: 1, key: 'damage' },
          { sides: 4, quantity: 1, key: 'bonus' }
        ],
        interpretResult: (_input, _rollResult, rollsByKey) => {
          captured.map = rollsByKey
          return { result: 'done' }
        }
      })

      rollWithKeys({})

      expect(captured.map?.size).toBe(3)
      expect(captured.map?.has('attack')).toBe(true)
      expect(captured.map?.has('damage')).toBe(true)
      expect(captured.map?.has('bonus')).toBe(true)
    })

    test('rolls get auto-generated keys when not explicitly provided', () => {
      const captured: { map?: Map<string, unknown> } = {}

      const mixedRoll = createMultiRollGameRoll({
        validate: () => undefined,
        toRollOptions: () => [
          { sides: 6, quantity: 1, key: 'explicit-key' },
          { sides: 6, quantity: 1 } // will get auto-generated key
        ],
        interpretResult: (_input, _rollResult, rollsByKey) => {
          captured.map = rollsByKey
          return { result: 'done' }
        }
      })

      mixedRoll({})

      // Both rolls have keys (explicit and auto-generated)
      expect(captured.map?.size).toBe(2)
      expect(captured.map?.has('explicit-key')).toBe(true)
    })
  })

  describe('custom total', () => {
    test('uses interpreted total when provided', () => {
      const customTotalRoll = createMultiRollGameRoll({
        validate: () => undefined,
        toRollOptions: () => [{ sides: 6, quantity: 2 }],
        interpretResult: () => ({
          result: 'fixed',
          total: 42
        })
      })

      const result = customTotalRoll({})

      expect(result.total).toBe(42)
    })

    test('uses roll total when interpreted total is undefined', () => {
      const defaultTotalRoll = createMultiRollGameRoll({
        validate: () => undefined,
        toRollOptions: () => [{ sides: 6, quantity: 1 }],
        interpretResult: () => ({
          result: 'default'
        })
      })

      const result = defaultTotalRoll({})

      expect(result.total).toBeGreaterThanOrEqual(1)
      expect(result.total).toBeLessThanOrEqual(6)
    })
  })

  describe('details', () => {
    test('includes details when provided', () => {
      interface Details {
        critical: boolean
        margin: number
      }

      const rollWithDetails = createMultiRollGameRoll<unknown, string, Details>({
        validate: () => undefined,
        toRollOptions: () => [{ sides: 20, quantity: 1 }],
        interpretResult: (_input, rollResult) => ({
          result: 'hit',
          details: {
            critical: rollResult.total >= 20,
            margin: rollResult.total - 10
          }
        })
      })

      const result = rollWithDetails({})

      expect(result.details).toBeDefined()
      expect(typeof result.details?.critical).toBe('boolean')
      expect(typeof result.details?.margin).toBe('number')
    })

    test('omits details when undefined', () => {
      const rollWithoutDetails = createMultiRollGameRoll({
        validate: () => undefined,
        toRollOptions: () => [{ sides: 6, quantity: 1 }],
        interpretResult: () => ({
          result: 'simple'
        })
      })

      const result = rollWithoutDetails({})

      expect(result.details).toBeUndefined()
    })
  })

  describe('validation', () => {
    test('throws on invalid input', () => {
      const validatedRoll = createMultiRollGameRoll<{ count: number }, string>({
        validate: input => {
          if (input.count < 1) {
            throw new ValidationError('count must be at least 1')
          }
        },
        toRollOptions: input =>
          Array.from({ length: input.count }, (_, i) => ({
            sides: 6,
            quantity: 1,
            key: `die${i}`
          })),
        interpretResult: () => ({ result: 'ok' })
      })

      expect(() => validatedRoll({ count: 0 })).toThrow(ValidationError)
    })
  })
})
