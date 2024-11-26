import { describe, expect, test } from 'bun:test'
import { rollDicePools, type DicePoolLike } from '../src'

describe('rollDicePools', () => {
  test('rolls the provided dice a number of times equal to the quantity', () => {
    const dicePools: DicePoolLike<number> = {
      '1': {
        die: {
          rollMany: (quantity: number) =>
            Array.from({ length: quantity }).map(() => 1)
        },
        config: { quantity: 1 }
      },
      '2': {
        die: {
          rollMany: (quantity: number) =>
            Array.from({ length: quantity }).map(() => 2)
        },
        config: { quantity: 2 }
      },
      '3': {
        die: {
          rollMany: (quantity: number) =>
            Array.from({ length: quantity }).map(() => 3)
        },
        config: { quantity: 3 }
      }
    }
    const result = rollDicePools(dicePools)

    expect(result).toEqual({ '1': [1], '2': [2, 2], '3': [3, 3, 3] })
  })
})
