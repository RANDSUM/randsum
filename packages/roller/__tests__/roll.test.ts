import { describe, expect, test } from 'bun:test'
import { D } from '../src/Dice'

import { roll } from '../src/roll'

const loops = 9999

describe(roll, () => {
  describe('Stress Test', () => {
    describe('numeric dice', () => {
      describe('numeric args', () => {
        const arg = 20
        test('it never goes outside of the bounds of the roll', () => {
          const dummyArray = Array.from(
            { length: loops },
            () => roll(arg).total
          )
          dummyArray.forEach((individualRoll) => {
            expect(individualRoll).toBeLessThanOrEqual(20)
            expect(individualRoll).toBeGreaterThan(0)
          })
        })
      })

      describe('object args', () => {
        const arg = { sides: 20 }
        test('it never goes outside of the bounds of the roll', () => {
          const dummyArray = Array.from(
            { length: loops },
            () => roll(arg).total
          )
          dummyArray.forEach((individualRoll) => {
            expect(individualRoll).toBeLessThanOrEqual(20)
            expect(individualRoll).toBeGreaterThan(0)
          })
        })
      })

      describe('die args', () => {
        const arg = D(20)
        test('it never goes outside of the bounds of the roll', () => {
          const dummyArray = Array.from(
            { length: loops },
            () => roll(arg).total
          )
          dummyArray.forEach((individualRoll) => {
            expect(individualRoll).toBeLessThanOrEqual(20)
            expect(individualRoll).toBeGreaterThan(0)
          })
        })
      })

      describe('notation args', () => {
        const arg = '1d20'
        test('it never goes outside of the bounds of the roll', () => {
          const dummyArray = Array.from(
            { length: loops },
            () => roll(arg).total
          )
          dummyArray.forEach((individualRoll) => {
            expect(individualRoll).toBeLessThanOrEqual(20)
            expect(individualRoll).toBeGreaterThan(0)
          })
        })
      })
    })

    describe.only('custom dice', () => {
      describe('array args', () => {
        const arg = ['h', 't']
        test('it never goes outside of the bounds of the roll', () => {
          const dummyArray = Array.from(
            { length: loops },
            () => roll(arg).total
          )
          dummyArray.forEach((individualRoll) => {
            expect(['h', 't']).toContain(individualRoll)
          })
        })
      })

      describe('object args', () => {
        const arg = { sides: ['h', 't'] }
        test('it never goes outside of the bounds of the roll', () => {
          const dummyArray = Array.from(
            { length: loops },
            () => roll(arg).total
          )
          dummyArray.forEach((individualRoll) => {
            expect(['h', 't']).toContain(individualRoll)
          })
        })
      })

      describe('die args', () => {
        const arg = D(['h', 't'])
        test('it never goes outside of the bounds of the roll', () => {
          const dummyArray = Array.from(
            { length: loops },
            () => roll(arg).total
          )
          dummyArray.forEach((individualRoll) => {
            expect(['h', 't']).toContain(individualRoll)
          })
        })
      })

      describe('notation args', () => {
        const arg = '1d{ht}'
        test('it never goes outside of the bounds of the roll', () => {
          const dummyArray = Array.from(
            { length: loops },
            () => roll(arg).total
          )
          dummyArray.forEach((individualRoll) => {
            expect(['h', 't']).toContain(individualRoll)
          })
        })
      })
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
