import {
  afterAll,
  beforeAll,
  describe,
  expect,
  mock,
  spyOn,
  test
} from 'bun:test'

import type { RollParams } from '../src/types'
import * as CoreRandom from '../src/lib'
import * as CoreSpreadRolls from '../src/lib'
import { generateRollResult } from '../src/roll/generateRollResult'

function createRollParameters(overrides: Partial<RollParams> = {}): RollParams {
  return {
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

describe(generateRollResult, () => {
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
      expect(generateRollResult(coreParameters)).toMatchObject({
        parameters: coreParameters,
        total: 10,
        history: {
          initialRolls: testRollSet,
          logs: [],
          modifiedRolls: testRollSet,
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
      const initialRolls = uniqueRolls

      spyOn(CoreSpreadRolls, 'coreSpreadRolls').mockReturnValueOnce(uniqueRolls)
      expect(generateRollResult(uniqueParameters)).toMatchObject({
        parameters: uniqueParameters,
        history: {
          initialRolls,
          modifiedRolls: [1, 200, 2, 3],
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
        rolls: [1, 1, 2, 3],
        total: 206
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
        expect(generateRollResult(notUniqueParameters)).toMatchObject({
          parameters: notUniqueParameters,
          description: ['Roll 1d4'],
          history: {
            modifiedRolls: uniqueRolls,
            total: 7,
            initialRolls: uniqueRolls,
            logs: [
              {
                added: [],
                modifier: 'unique',
                options: { notUnique: [1] },
                removed: []
              }
            ]
          },
          rolls: uniqueRolls,
          total: 7
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
        expect(() => generateRollResult(overflowParameters)).toThrow()
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

      expect(generateRollResult(dropParameters)).toMatchObject({
        parameters: dropParameters,
        description: ['Roll 1d4'],
        history: {
          initialRolls: longerRollTotals,
          modifiedRolls: [4, 6, 7],
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
        rolls: [4, 6, 7],
        total: 17
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
        expect(generateRollResult(dropParameters)).toMatchObject({
          parameters: dropParameters,
          description: ['Roll 1d4'],
          history: {
            initialRolls: testRollSet,
            modifiedRolls: [2, 2, 3, 4],
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
          rolls: [2, 2, 3, 4],
          total: 11
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
        expect(generateRollResult(dropParameters)).toMatchObject({
          parameters: dropParameters,
          description: ['Roll 1d4'],
          history: {
            modifiedRolls: [2, 2, 3, 6],
            initialRolls: testRollSet,
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
          rolls: [2, 2, 3, 6],
          total: 13
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

      expect(generateRollResult(explodeParameters)).toMatchObject({
        parameters: explodeParameters,
        description: ['Roll 1d4'],
        history: {
          modifiedRolls: [1, 2, 3, 6, 200],
          total: 212,
          initialRolls: explodeRollTotals,
          logs: [
            {
              added: [200],
              modifier: 'explode',
              options: true,
              removed: []
            }
          ]
        },
        rolls: [1, 2, 3, 6, 200],
        total: 212
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
        }
      })

      test('it stops at 99 rerolls and returns the total with all values matching the queries rerolled', () => {
        spyOn(CoreSpreadRolls, 'coreSpreadRolls').mockReturnValueOnce(
          testRollSet
        )
        expect(generateRollResult(reDicePools)).toMatchObject({
          parameters: reDicePools,
          description: ['Roll 1d4'],
          history: {
            modifiedRolls: [1, 2, 3, 200],
            total: 206,
            initialRolls: testRollSet,
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
          rolls: [1, 2, 3, 200],
          total: 206
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
        expect(generateRollResult(reDicePools)).toMatchObject({
          parameters: reDicePools,
          description: ['Roll 1d4'],
          history: {
            modifiedRolls: [1, 200, 3, 200],
            initialRolls: testRollSet,
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
          rolls: [1, 200, 3, 200],
          total: 404
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
        expect(generateRollResult(reDicePools)).toMatchObject({
          parameters: reDicePools,
          description: ['Roll 1d4'],
          history: {
            initialRolls: [1, 2, 3, 4],
            logs: [
              {
                added: [200, 200],
                modifier: 'reroll',
                options: {
                  exact: [3],
                  lessThan: 2,
                  max: 2
                },
                removed: [1, 3]
              }
            ],
            modifiedRolls: [200, 2, 200, 4],
            total: 406
          },
          rolls: [200, 2, 200, 4],
          total: 406
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
      expect(generateRollResult(dropParameters)).toMatchObject({
        parameters: dropParameters,
        description: ['Roll 1d4'],
        history: {
          modifiedRolls: [2, 2, 3, 3],
          total: 10,
          initialRolls: [1, 2, 3, 4],
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
        rolls: [2, 2, 3, 3],
        total: 10
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
      expect(generateRollResult(dropParameters)).toMatchObject({
        parameters: dropParameters,
        description: ['Roll 1d4'],
        history: {
          modifiedRolls: testRollSet,
          initialRolls: testRollSet,
          total: 12,
          logs: []
        },
        total: 12,
        rolls: [1, 2, 3, 4]
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
      expect(generateRollResult(dropParameters)).toMatchObject({
        parameters: dropParameters,
        description: ['Roll 1d4'],
        history: {
          modifiedRolls: testRollSet,
          total: 8,
          initialRolls: testRollSet,
          logs: []
        },
        rolls: [1, 2, 3, 4],
        total: 8
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

      const result = generateRollResult(parametersWithZeroModifier)

      expect(result).toMatchObject({
        parameters: parametersWithZeroModifier,
        description: ['Roll 1d4'],
        history: {
          modifiedRolls: testRollSet,
          initialRolls: testRollSet,
          total: 10,
          logs: []
        },
        rolls: [1, 2, 3, 4],
        total: 10
      })
    })
  })
})
