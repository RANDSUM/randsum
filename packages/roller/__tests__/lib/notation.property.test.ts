import { describe, test } from 'bun:test'
import fc from 'fast-check'
import { isDiceNotation } from '../../src'

const validNotationArb = fc
  .tuple(fc.integer({ min: 1, max: 20 }), fc.integer({ min: 2, max: 100 }))
  .map(([qty, sides]) => `${qty}d${sides}`)

const validNotationWithModifiersArb = fc
  .tuple(
    fc.integer({ min: 1, max: 10 }),
    fc.integer({ min: 2, max: 100 }),
    fc.constantFrom('', 'L', 'H', 'LH', '!', 'U')
  )
  .map(([qty, sides, modifier]) => `${qty}d${sides}${modifier}`)

const validNotationWithArithmeticArb = fc
  .tuple(
    fc.integer({ min: 1, max: 10 }),
    fc.integer({ min: 2, max: 20 }),
    fc.constantFrom('+', '-'),
    fc.integer({ min: 1, max: 10 })
  )
  .map(([qty, sides, op, bonus]) => `${qty}d${sides}${op}${bonus}`)

describe('notation property tests', () => {
  test('generated simple notation is always valid', () => {
    fc.assert(
      fc.property(validNotationArb, notation => {
        return isDiceNotation(notation)
      })
    )
  })

  test('generated notation with modifiers is always valid', () => {
    fc.assert(
      fc.property(validNotationWithModifiersArb, notation => {
        return isDiceNotation(notation)
      })
    )
  })

  test('generated notation with arithmetic is always valid', () => {
    fc.assert(
      fc.property(validNotationWithArithmeticArb, notation => {
        return isDiceNotation(notation)
      })
    )
  })

  test('random strings are not valid notation', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !s.toLowerCase().includes('d') || !/\d/.test(s)),
        randomStr => {
          return !isDiceNotation(randomStr)
        }
      )
    )
  })
})
