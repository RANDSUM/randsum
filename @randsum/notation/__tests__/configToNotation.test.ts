import { describe, expect, test } from 'bun:test'
import { configToNotation } from '../src/utils/configToNotation/configToNotation'

describe('configToNotation', () => {
  test('returns a string matching the constraints', () => {
    expect(configToNotation({ quantity: 1, sides: 100 })).toEqual('1d100')

    expect(
      configToNotation({
        quantity: 2,
        sides: 20,
        modifiers: { add: 5, drop: { highest: 1 } }
      })
    ).toEqual('2d20H+5')

    expect(
      configToNotation({
        quantity: 200,
        sides: 20,
        modifiers: {
          add: 2,
          subtract: 5,
          drop: { highest: 1, lowest: 5 },
          replace: { from: 1, to: 20 },
          reroll: { greaterThan: 10, maxReroll: 2 },
          unique: { notUnique: [1, 2, 3] }
        }
      })
    ).toEqual('200d20HL5V{1=20}R{>10}2U{1,2,3}+2-5')
  })
})
