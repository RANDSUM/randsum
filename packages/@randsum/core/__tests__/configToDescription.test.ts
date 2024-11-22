import { describe, expect, test } from 'bun:test'
import { createRollConfig } from './support/fixtures'
import { configToDescription } from '../src/utils/configToDescription'

describe('configToDescription', () => {
  test('returns an array strings matching the constraints', () => {
    expect(
      configToDescription(createRollConfig({ quantity: 1, sides: 100 }))
    ).toEqual(['Roll 1 100-sided die'])

    expect(
      configToDescription(
        createRollConfig({
          quantity: 2,
          sides: 20,
          modifiers: { add: 5, drop: { highest: 1 } }
        })
      )
    ).toEqual(['Roll 2 20-sided dice', 'Drop highest', 'Add 5'])

    expect(
      configToDescription(
        createRollConfig({
          quantity: 200,
          sides: 20,
          modifiers: {
            add: 2,
            minus: 5,
            drop: { highest: 1, lowest: 5 },
            replace: { from: 1, to: 20 },
            reroll: { greaterThan: 10, maxReroll: 2 },
            unique: { notUnique: [1, 2, 3] }
          }
        })
      )
    ).toEqual([
      'Roll 200 20-sided dice',
      'Drop highest',
      'Drop lowest 5',
      'Replace [1] with [20]',
      'Reroll greater than [10] (up to 2 times)',
      'No Duplicates (except [1] [2] and [3])',
      'Add 2',
      'Subtract 5'
    ])

    expect(
      configToDescription(createRollConfig({ quantity: 2, sides: 10 }))
    ).toEqual(['Roll 2 10-sided dice'])

    expect(
      configToDescription(createRollConfig({ quantity: 2, sides: 10 }))
    ).toEqual(['Roll 2 10-sided dice'])
  })
})
