import { describe, expect, test } from 'bun:test'
import { D } from '../src/D'

import { roll } from '../src/roll'

const loops = 9999

describe(roll, () => {
  describe('Stress Test', () => {
    describe('numerical dice', () => {
      const dummyArray = Array.from(
        { length: loops },
        () => roll(20, { sides: 20 }, D(20), '1d20').total
      )

      test('it never goes outside of the bounds of the roll', () => {
        dummyArray.forEach((individualRoll) => {
          expect(individualRoll).toBeLessThanOrEqual(80)
          expect(individualRoll).toBeGreaterThan(0)
        })
      })
    })

    describe('numerical dice simple', () => {
      const dummyArray = Array.from({ length: loops }, () => roll(20).total)

      test('it never goes outside of the bounds of the roll', () => {
        dummyArray.forEach((individualRoll) => {
          expect(individualRoll).toBeLessThanOrEqual(20)
          expect(individualRoll).toBeGreaterThan(0)
        })
      })
    })

    describe('custom dice', () => {
      const dummyArray = Array.from(
        { length: loops },
        () =>
          roll(['h', 't'], { sides: ['h', 't'] }, D(['h', 't']), '1d{ht}')
            .result
      )

      test('it never goes outside of the bounds of the roll', () => {
        dummyArray.forEach((individualRoll) => {
          expect(individualRoll).toHaveLength(4)
          const uniqueRolls = individualRoll
            .flat()
            .filter((value, index, array) => array.indexOf(value) === index)

          expect(uniqueRolls.length).toBeLessThan(3)
          expect(uniqueRolls.length).toBeGreaterThan(0)
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
