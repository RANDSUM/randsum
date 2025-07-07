import {
  afterAll,
  beforeAll,
  describe,
  expect,
  mock,
  spyOn,
  test
} from 'bun:test'

import { D } from '../src/Dice'
import type { RollParams } from '../src/types'
import * as CoreRandom from '../src/lib'
import * as CoreSpreadRolls from '../src/lib'
import { generateRoll } from '../src/roll/generateRoll'

function createRollParameters(overrides: Partial<RollParams> = {}): RollParams {
  return {
    die: D(4),
    argument: 1,
    notation: '1d4',
    description: ['Roll 1d4'],
    options: {
      sides: 4,
      quantity: 1
    },
    ...overrides
  } as RollParams
}

describe(generateRoll, () => {
  beforeAll(() => {
    spyOn(CoreRandom, 'coreRandom').mockReturnValue(200)
  })

  afterAll(() => {
    mock.restore()
  })

  const testRollSet = [1, 2, 3, 4]
  describe('when given roll total with no modifiers', () => {
    const coreParameters = createRollParameters()

    test('it returns the sum total of the quantity and the roll total', () => {
      spyOn(CoreSpreadRolls, 'coreSpreadRolls').mockReturnValueOnce(testRollSet)
      expect(generateRoll(coreParameters)).toMatchObject({
        parameters: coreParameters,
        rawRolls: testRollSet,
        total: 10,
        rawResult: 10,
        type: 'numeric',
        modifiedRolls: {
          logs: [],
          rolls: testRollSet,
          total: 10
        }
      })
    })
  })

  describe('when given roll total with a "unique" modifier', () => {
    const uniqueRolls = [1, 1, 2, 3]

    const uniqueParameters = createRollParameters({
      options: {
        sides: 4,
        quantity: uniqueRolls.length,
        modifiers: { unique: true }
      }
    })

    test('it re-rolls non-unique modifiers', () => {
      const rawRolls = uniqueRolls

      spyOn(CoreSpreadRolls, 'coreSpreadRolls').mockReturnValueOnce(uniqueRolls)
      expect(generateRoll(uniqueParameters)).toMatchObject({
        parameters: uniqueParameters,
        rawRolls,
        modifiedRolls: {
          rolls: [1, 200, 2, 3],
          total: 206,
          logs: [
            {
              added: [200],
              modifier: 'unique',
              options: true,
              removed: [1]
            }
          ]
        },
        total: 206,
        rawResult: 7,
        type: 'numeric'
      })
    })

    describe('when given a "notUnique" array', () => {
      const notUniqueParameters = createRollParameters({
        options: {
          sides: 4,
          quantity: uniqueRolls.length,
          modifiers: { unique: { notUnique: [1] } }
        }
      })

      test('it disregards any numbers in that array and makes the rest unique', () => {
        spyOn(CoreSpreadRolls, 'coreSpreadRolls').mockReturnValueOnce(
          uniqueRolls
        )
        expect(generateRoll(notUniqueParameters)).toMatchObject({
          parameters: notUniqueParameters,
          modifiedRolls: {
            rolls: uniqueRolls,
            total: 7,
            logs: [
              {
                added: [],
                modifier: 'unique',
                options: { notUnique: [1] },
                removed: []
              }
            ]
          },
          total: 7,
          rawResult: 7,
          rawRolls: uniqueRolls,
          type: 'numeric'
        })
      })
    })

    describe('and the # of quantity is greater than the sides of the die', () => {
      const overflowRollTotals = [1, 1, 1, 2, 3, 4, 3, 3]

      const overflowParameters = createRollParameters({
        options: {
          sides: 6,
          quantity: overflowRollTotals.length,
          modifiers: { unique: true }
        }
      })

      test('it throws an error', () => {
        spyOn(CoreSpreadRolls, 'coreSpreadRolls').mockReturnValueOnce(
          overflowRollTotals
        )
        expect(() => generateRoll(overflowParameters)).toThrow()
      })
    })
  })

  describe('when given custom sides', () => {
    const faces = ['r', 'a', 'n', 'd', 's', 'u', 'm']
    const customSidesRoll = ['r', 'a', 'n', 'd']

    const customSidesParameters = createRollParameters({
      options: {
        sides: faces,
        quantity: 4
      }
    })

    test('it returns the expected result as a string', () => {
      spyOn(CoreSpreadRolls, 'coreSpreadRolls').mockReturnValueOnce(
        customSidesRoll
      )

      expect(generateRoll(customSidesParameters)).toMatchObject({
        parameters: customSidesParameters,
        rawRolls: customSidesRoll,
        modifiedRolls: {
          rolls: customSidesRoll,
          total: 'r, a, n, d',
          logs: []
        },
        total: 'r, a, n, d',
        rawResult: 'r, a, n, d',
        type: 'custom'
      })
    })
  })

  describe('when given roll total with a "drop" modifier', () => {
    const longerRollTotals = [1, 2, 3, 4, 5, 6, 7, 8, 9]

    const dropParameters = createRollParameters({
      options: {
        sides: 10,
        quantity: longerRollTotals.length,
        modifiers: {
          drop: {
            highest: 1,
            lowest: 2,
            greaterThan: 8,
            lessThan: 2,
            exact: [5]
          }
        }
      }
    })

    test('it returns the total without the provided values', () => {
      spyOn(CoreSpreadRolls, 'coreSpreadRolls').mockReturnValueOnce(
        longerRollTotals
      )

      expect(generateRoll(dropParameters)).toMatchObject({
        parameters: dropParameters,
        rawRolls: longerRollTotals,
        modifiedRolls: {
          rolls: [4, 6, 7],
          total: 17,
          logs: [
            {
              added: [],
              modifier: 'drop',
              options: {
                exact: [5],
                greaterThan: 8,
                highest: 1,
                lessThan: 2,
                lowest: 2
              },
              removed: [1, 2, 3, 5, 8, 9]
            }
          ]
        },
        total: 17,
        rawResult: 45,
        type: 'numeric'
      })
    })
  })

  describe('when given roll total with a "replace" modifier', () => {
    describe('that is a single replace modifier', () => {
      const dropParameters = createRollParameters({
        options: {
          sides: 10,
          quantity: testRollSet.length,
          modifiers: { replace: { from: 1, to: 2 } }
        }
      })

      test('it returns the total with all values replaced according to the provided rules', () => {
        spyOn(CoreSpreadRolls, 'coreSpreadRolls').mockReturnValueOnce(
          testRollSet
        )
        expect(generateRoll(dropParameters)).toMatchObject({
          parameters: dropParameters,
          rawRolls: testRollSet,
          modifiedRolls: {
            rolls: [2, 2, 3, 4],
            total: 11,
            logs: [
              {
                added: [2],
                modifier: 'replace',
                options: {
                  from: 1,
                  to: 2
                },
                removed: [1]
              }
            ]
          },
          total: 11,
          rawResult: 10,
          type: 'numeric'
        })
      })
    })

    describe('that is an array of replace modifiers', () => {
      const dropParameters = createRollParameters({
        options: {
          sides: 10,
          quantity: testRollSet.length,
          modifiers: {
            replace: [
              { from: 1, to: 2 },
              { from: { greaterThan: 3 }, to: 6 }
            ]
          }
        }
      })

      test('it returns the total with all values replaced according to the provided rules', () => {
        spyOn(CoreSpreadRolls, 'coreSpreadRolls').mockReturnValueOnce(
          testRollSet
        )
        expect(generateRoll(dropParameters)).toMatchObject({
          parameters: dropParameters,
          rawRolls: testRollSet,
          modifiedRolls: {
            rolls: [2, 2, 3, 6],
            total: 13,
            logs: [
              {
                added: [2, 6],
                modifier: 'replace',
                options: [
                  {
                    from: 1,
                    to: 2
                  },
                  {
                    from: {
                      greaterThan: 3
                    },
                    to: 6
                  }
                ],
                removed: [1, 4]
              }
            ]
          },
          total: 13,
          rawResult: 10,
          type: 'numeric'
        })
      })
    })
  })

  describe('when given roll total with an "explode" modifier', () => {
    const explodeRollTotals = [1, 2, 3, 6]

    const explodeParameters = createRollParameters({
      options: {
        sides: 6,
        quantity: explodeRollTotals.length,
        modifiers: { explode: true }
      }
    })

    test('it returns the total with all values matching the queries rerolled', () => {
      spyOn(CoreSpreadRolls, 'coreSpreadRolls').mockReturnValueOnce(
        explodeRollTotals
      )

      expect(generateRoll(explodeParameters)).toMatchObject({
        parameters: explodeParameters,
        modifiedRolls: {
          rolls: [1, 2, 3, 6, 200],
          total: 212,
          logs: [
            {
              added: [200],
              modifier: 'explode',
              options: true,
              removed: []
            }
          ]
        },
        total: 212,
        rawResult: 12,
        rawRolls: explodeRollTotals,
        type: 'numeric'
      })
    })
  })

  describe('when given roll total with a "reroll" modifier', () => {
    describe('when given an impossible roll', () => {
      const reDicePools = createRollParameters({
        options: {
          sides: 6,
          quantity: testRollSet.length,
          modifiers: { reroll: { greaterThan: 3 } }
        },
        die: D(4)
      })

      test('it stops at 99 rerolls and returns the total with all values matching the queries rerolled', () => {
        spyOn(CoreSpreadRolls, 'coreSpreadRolls').mockReturnValueOnce(
          testRollSet
        )
        expect(generateRoll(reDicePools)).toMatchObject({
          parameters: reDicePools,
          rawRolls: testRollSet,
          modifiedRolls: {
            rolls: [1, 2, 3, 200],
            total: 206,
            logs: [
              {
                added: [200],
                modifier: 'reroll',
                options: {
                  greaterThan: 3
                },
                removed: [4]
              }
            ]
          },
          total: 206,
          rawResult: 10,
          type: 'numeric'
        })
      })
    })

    describe('that is a single reroll modifier in an array', () => {
      const reDicePools = createRollParameters({
        options: {
          sides: 6,
          quantity: testRollSet.length,
          modifiers: {
            reroll: { greaterThan: 3, exact: [2], max: 2 }
          }
        }
      })

      test('it returns the total with all values matching the queries rerolled', () => {
        spyOn(CoreSpreadRolls, 'coreSpreadRolls').mockReturnValueOnce(
          testRollSet
        )
        expect(generateRoll(reDicePools)).toMatchObject({
          parameters: reDicePools,
          rawRolls: testRollSet,
          modifiedRolls: {
            rolls: [1, 200, 3, 200],
            total: 404,
            logs: [
              {
                added: [200, 200],
                modifier: 'reroll',
                options: {
                  exact: [2],
                  greaterThan: 3,
                  max: 2
                },
                removed: [2, 4]
              }
            ]
          },
          total: 404,
          rawResult: 10,
          type: 'numeric'
        })
      })
    })

    describe('that is an array of reroll modifiers', () => {
      const reDicePools = createRollParameters({
        options: {
          sides: 6,
          quantity: testRollSet.length,
          modifiers: {
            reroll: { lessThan: 2, max: 2, exact: [3] }
          }
        }
      })

      test('it returns the total with all values matching the queries rerolled', () => {
        spyOn(CoreSpreadRolls, 'coreSpreadRolls').mockReturnValueOnce(
          testRollSet
        )
        expect(generateRoll(reDicePools)).toMatchObject({
          parameters: reDicePools,
          modifiedRolls: {
            rolls: [200, 2, 200, 4],
            total: 406
          },
          total: 406,
          type: 'numeric'
        })
      })
    })
  })

  describe('when given roll total with a "cap" modifier', () => {
    const dropParameters = createRollParameters({
      options: {
        sides: 6,
        quantity: testRollSet.length,
        modifiers: { cap: { greaterThan: 3, lessThan: 2 } }
      }
    })

    test('it returns the total with all values greaterThan greaterThan and lessThan lessThan replaced with their respective comparitor and the roll total', () => {
      spyOn(CoreSpreadRolls, 'coreSpreadRolls').mockReturnValueOnce(testRollSet)
      expect(generateRoll(dropParameters)).toMatchObject({
        parameters: dropParameters,
        modifiedRolls: {
          rolls: [2, 2, 3, 3],
          total: 10,
          logs: [
            {
              added: [2, 3],
              modifier: 'cap',
              options: {
                greaterThan: 3,
                lessThan: 2
              },
              removed: [1, 4]
            }
          ]
        },
        total: 10,
        rawResult: 10,
        rawRolls: [1, 2, 3, 4],
        type: 'numeric'
      })
    })
  })

  describe('when given roll total with a "plus" modifier', () => {
    const dropParameters = createRollParameters({
      options: {
        sides: 6,
        quantity: testRollSet.length,
        modifiers: { plus: 2 }
      }
    })

    test('it returns the total plus the "plus" modifier, and the roll total', () => {
      spyOn(CoreSpreadRolls, 'coreSpreadRolls').mockReturnValueOnce(testRollSet)
      expect(generateRoll(dropParameters)).toMatchObject({
        parameters: dropParameters,
        modifiedRolls: {
          rolls: testRollSet,
          total: 12,
          logs: []
        },
        total: 12,
        rawResult: 10,
        type: 'numeric'
      })
    })
  })

  describe('when given roll total with a "minus" modifier', () => {
    const dropParameters = createRollParameters({
      options: {
        sides: 6,
        quantity: testRollSet.length,
        modifiers: { minus: 2 }
      }
    })

    test('it returns the total minus the "minus" modifier, and the roll total', () => {
      spyOn(CoreSpreadRolls, 'coreSpreadRolls').mockReturnValueOnce(testRollSet)
      expect(generateRoll(dropParameters)).toMatchObject({
        parameters: dropParameters,
        modifiedRolls: {
          rolls: testRollSet,
          total: 8,
          logs: []
        },
        total: 8,
        rawResult: 10,
        rawRolls: testRollSet,
        type: 'numeric'
      })
    })
  })

  describe('edge cases', () => {
    test('handles zero value modifiers', () => {
      const parametersWithZeroModifier = createRollParameters({
        options: {
          sides: 6,
          quantity: testRollSet.length,
          modifiers: { plus: 0 }
        }
      })

      spyOn(CoreSpreadRolls, 'coreSpreadRolls').mockReturnValueOnce(testRollSet)

      const result = generateRoll(parametersWithZeroModifier)

      expect(result).toMatchObject({
        parameters: parametersWithZeroModifier,
        rawRolls: testRollSet,
        modifiedRolls: {
          rolls: testRollSet,
          total: 10,
          logs: []
        },
        rawResult: 10,
        total: 10,
        type: 'numeric'
      })
    })
  })
})
