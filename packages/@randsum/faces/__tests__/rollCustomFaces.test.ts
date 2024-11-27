import { describe, expect, test } from 'bun:test'
import { CustomFacesD, rollCustomFaces } from '../src'

const loops = 9999

describe('roll', () => {
  describe('Stress Test', () => {
    describe('custom dice and numerical dice mixed', () => {
      const dummyArray = Array.from(
        { length: loops },
        () =>
          rollCustomFaces(
            20,
            { sides: 20 },
            new CustomFacesD(['H', 'T']),
            '2d20'
          ).result
      )

      test('returns an array of strings', () => {
        dummyArray.forEach((individualRolls) => {
          expect(individualRolls).toHaveLength(5)
          individualRolls.flat().forEach((individualRoll) => {
            expect(individualRoll).toSatisfy(
              (value) => typeof value === 'string'
            )
          })
        })
      })
    })
  })
})
