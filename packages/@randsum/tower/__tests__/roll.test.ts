import { describe, expect, test } from 'bun:test'

import { roll } from '../src'
import { D } from '@randsum/dice'

const loops = 9999

describe('roll', () => {
  describe('Stress Test', () => {
    describe('numerical dice', () => {
      const dummyArray = Array.from(
        { length: loops },
        () => roll(20, { sides: 20 }, new D(20), '1d20').result
      )

      test('it never goes outside of the bounds of the roll', () => {
        dummyArray.forEach((individualRoll) => {
          expect(individualRoll).toBeLessThanOrEqual(80)
          expect(individualRoll).toBeGreaterThan(0)
        })
      })
    })
  })
})
