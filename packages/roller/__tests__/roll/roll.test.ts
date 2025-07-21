import { describe, expect, test } from 'bun:test'

import { roll } from '../../src/roll'

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

      describe('multiple object args with arithmetic modifiers', () => {
        test('it never goes outside of the bounds of the roll', () => {
          const dummyArray = Array.from({ length: loops }, () =>
            roll(
              { sides: 1, arithmetic: 'add' },
              { sides: 100, arithmetic: 'subtract' }
            )
          )
          dummyArray.forEach(({ total }) => {
            expect(total).toBeLessThanOrEqual(0)
            expect(total).toBeGreaterThan(-100)
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

        const negArg = '-1d20'
        test('it never goes outside of the bounds of the roll', () => {
          const dummyArray = Array.from({ length: loops }, () => roll(negArg))
          dummyArray.forEach(({ total }) => {
            expect(total).toBeGreaterThanOrEqual(-20)
            expect(total).toBeLessThan(0)
          })
        })
      })

      describe('notation args with whitespace', () => {
        const arg = '  1d20  '
        test('it never goes outside of the bounds of the roll', () => {
          const dummyArray = Array.from({ length: loops }, () => roll(arg))
          dummyArray.forEach(({ total }) => {
            expect(total).toBeLessThanOrEqual(20)
            expect(total).toBeGreaterThan(0)
          })
        })
      })

      describe('with custom faces', () => {
        const arg = {
          sides: 20,
          faces: ['a', 'b', 'c', 'd', 'e', 'f'],
          quantity: 2
        }

        test('never goes outside of the bounds of the roll (counting sides of faces, ignoring sides)', () => {
          const dummyArray = Array.from({ length: loops }, () => roll(arg))
          dummyArray.forEach(({ total }) => {
            expect(total).toBeLessThanOrEqual(12)
            expect(total).toBeGreaterThan(1)
          })
        })

        test('returns a results array of the custom faces', () => {
          const dummyArray = Array.from({ length: loops }, () => roll(arg))
          dummyArray.forEach(({ result }) => {
            expect(arg.faces).toContain(result[0])
            expect(arg.faces).toContain(result[1])
          })
        })
      })

      describe('mixed args', () => {
        const argOne = 20
        const argTwo = { sides: 20 }
        const argThree = '1d20'
        const argFour = '1d20+1d20'
        test('it never goes outside of the bounds of the roll', () => {
          const dummyArray = Array.from({ length: loops }, () =>
            roll(argOne, argTwo, argThree, argFour)
          )
          dummyArray.forEach(({ total, rolls }) => {
            expect(total).toBeLessThanOrEqual(100)
            expect(total).toBeGreaterThanOrEqual(5)
            expect(rolls).toHaveLength(5)
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
