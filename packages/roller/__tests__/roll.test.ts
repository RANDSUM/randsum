import { describe, expect, test } from 'bun:test'
import { D } from '../src/Dice'

import { roll } from '../src/roll'
import type { CustomRollArgument } from '../src'

const loops = 9999

describe(roll, () => {
  describe('Stress Test', () => {
    describe('numeric dice', () => {
      test.each([20, { sides: 20 }, D(20), '1d20'] as const)(
        'it never goes outside of the bounds of the roll',
        (arg) => {
          const dummyArray = Array.from(
            { length: loops },
            () => roll(arg).total
          )
          dummyArray.forEach((individualRoll) => {
            expect(individualRoll).toBeLessThanOrEqual(20)
            expect(individualRoll).toBeGreaterThan(0)
          })
        }
      )
    })

    describe.only('custom dice', () => {
      test.each([
        // ['h', 't'],
        // { sides: ['h', 't'] },
        // D(['h', 't']),
        // '1d{ht}'
      ] as CustomRollArgument[])(
        'it never goes outside of the bounds of the roll',
        (arg) => {
          const dummyArray = Array.from(
            { length: loops },
            () => roll(arg).total
          )
          dummyArray.forEach((individualRoll) => {
            expect(['h', 't']).toContain(individualRoll)
          })
        }
      )
    })
  })

  describe('corner cases', () => {
    test('ordered options remain the same', () => {
      const argsOne = {
        sides: 1,
        quantity: 2,
        modifiers: {
          plus: 5,
          drop: { lowest: 1 }
        }
      }
      const argsTwo = {
        sides: 1,
        quantity: 2,
        modifiers: {
          drop: { lowest: 1 },
          plus: 5
        }
      }

      expect(roll(argsOne).total).toEqual(roll(argsTwo).total)
    })
  })
})
