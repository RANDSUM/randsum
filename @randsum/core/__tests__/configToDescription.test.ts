import { describe, expect, test } from 'bun:test'
import { configToDescription } from '../src/utils/configToDescription'

describe('configToDescription', () => {
  test('returns an array strings matching the constraints', () => {
    expect(configToDescription({ quantity: 1, sides: 100 })).toEqual([
      'Roll 1 100-sided die'
    ])

    expect(
      configToDescription({
        quantity: 2,
        sides: 20,
        modifiers: { add: 5, drop: { highest: 1 } }
      })
    ).toEqual(['Roll 2 20-sided dice', 'Drop highest', 'Add 5'])

    expect(
      configToDescription({
        quantity: 200,
        sides: 20,
        modifiers: {
          add: 2,
          subtract: 5,
          drop: { highest: 1, lowest: 5, exact: [3] },
          replace: { from: 1, to: 20 },
          reroll: { greaterThan: 10, maxReroll: 2, exact: [3] },
          unique: { notUnique: [1, 2, 3] },
          cap: { lessThan: 1 },
          explode: true
        }
      })
    ).toEqual([
      'Roll 200 20-sided dice',
      'No Rolls less than [1]',
      'Drop highest',
      'Drop lowest 5',
      'Drop [3]',
      'Replace [1] with [20]',
      'Reroll [3], greater than [10] (up to 2 times)',
      'Exploding Dice',
      'No Duplicates (except [1] [2] and [3])',
      'Add 2',
      'Subtract 5'
    ])
  })
})
