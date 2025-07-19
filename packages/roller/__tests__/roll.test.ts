import { describe, expect, test } from 'bun:test'

import { roll } from '../src/roll'

const loops = 9999

describe(roll, () => {
  describe('Stress Test', () => {
    describe('numeric dice', () => {
      describe('numeric args', () => {
        const arg = 20
        test('it never goes outside of the bounds of the roll', () => {
          const dummyArray = Array.from({ length: loops }, () => roll(arg))
          dummyArray.forEach(({ total }) => {
            expect(total).toBeLessThanOrEqual(20)
            expect(total).toBeGreaterThan(0)
          })
        })
      })

      describe('object args', () => {
        const arg = { sides: 20 }
        test('it never goes outside of the bounds of the roll', () => {
          const dummyArray = Array.from({ length: loops }, () => roll(arg))
          dummyArray.forEach(({ total }) => {
            expect(total).toBeLessThanOrEqual(20)
            expect(total).toBeGreaterThan(0)
          })
        })
      })

      describe('notation args', () => {
        const arg = '1d20'
        test('it never goes outside of the bounds of the roll', () => {
          const dummyArray = Array.from({ length: loops }, () => roll(arg))
          dummyArray.forEach(({ total }) => {
            expect(total).toBeLessThanOrEqual(20)
            expect(total).toBeGreaterThan(0)
          })
        })
      })

      describe('mixed args', () => {
        const argOne = 20
        const argTwo = { sides: 20 }
        const argThree = '1d20'
        test('it never goes outside of the bounds of the roll', () => {
          const dummyArray = Array.from({ length: loops }, () =>
            roll(argOne, argTwo, argThree)
          )
          dummyArray.forEach(({ total, rolls }) => {
            expect(total).toBeLessThanOrEqual(60)
            expect(total).toBeGreaterThanOrEqual(3)
            expect(rolls).toHaveLength(3)
            rolls.forEach((roll) => {
              expect(roll.total).toBeLessThanOrEqual(20)
              expect(roll.total).toBeGreaterThanOrEqual(1)
            })
          })
        })
      })

      describe('mixed args', () => {
        const argOne = 20
        const argTwo = { sides: 20 }
        const argThree = '1d20'
        test('it never goes outside of the bounds of the roll', () => {
          const dummyArray = Array.from({ length: loops }, () =>
            roll(argOne, argTwo, argThree)
          )
          dummyArray.forEach(({ total, rolls }) => {
            expect(total).toBeLessThanOrEqual(60)
            expect(total).toBeGreaterThanOrEqual(3)
            expect(rolls).toHaveLength(3)
            rolls.forEach((roll) => {
              expect(roll.total).toBeLessThanOrEqual(20)
              expect(roll.total).toBeGreaterThanOrEqual(1)
            })
          })
        })
      })
    })
  })
})
