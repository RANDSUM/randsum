import {
  afterAll,
  beforeAll,
  describe,
  expect,
  mock,
  spyOn,
  test
} from 'bun:test'

import { D } from '../src/D'
import type { RollParams } from '../src/types'
import * as CoreRandom from '../src/utils/coreRandom'
import * as CoreSpreadRolls from '../src/utils/coreSpreadRolls'
import { rollResultFromDicePools } from '../src/utils/rollResultFromDicePools'

function createRollParameters(overrides: Partial<RollParams> = {}): RollParams {
  return {
    die: new D(4),
    argument: 1,
    notation: '1d4',
    description: ['Roll 1d4'],
    options: {
      sides: 4,
      quantity: 1,
      ...overrides.options
    },
    ...overrides
  } as RollParams
}

describe(rollResultFromDicePools, () => {
  beforeAll(() => {
    spyOn(CoreRandom, 'coreRandom').mockReturnValue(200)
  })

  afterAll(() => {
    mock.restore()
  })

  const testRollSet = [1, 2, 3, 4]
  const testCustomRollSet = ['+', '-', ' ']
  const coreRawRolls = {
    'test-roll-id': testRollSet
  }

  describe('when given roll total with no modifiers', () => {
    const coreParameters = {
      dicePools: {
        'test-roll-id': createRollParameters()
      }
    }

    test('it returns the sum total of the quantity and the roll total', () => {
      spyOn(CoreSpreadRolls, 'coreSpreadRolls').mockReturnValueOnce(testRollSet)
      expect(rollResultFromDicePools(coreParameters)).toMatchObject({
        ...coreParameters,
        rawRolls: coreRawRolls,
        total: 10,
        rawResult: testRollSet,
        result: testRollSet,
        type: 'numerical'
      })
    })
  })

  describe('when given roll total with a "unique" modifier', () => {
    const uniqueRolls = [1, 1, 2, 3]

    const uniqueParameters = {
      dicePools: {
        'test-roll-id': createRollParameters({
          options: {
            sides: 4,
            quantity: uniqueRolls.length,
            modifiers: { unique: true }
          }
        })
      }
    }

    test('it re-rolls non-unique modifiers', () => {
      const rawRolls = {
        'test-roll-id': uniqueRolls
      }

      spyOn(CoreSpreadRolls, 'coreSpreadRolls').mockReturnValueOnce(uniqueRolls)
      expect(rollResultFromDicePools(uniqueParameters)).toMatchObject({
        ...uniqueParameters,
        rawRolls,
        modifiedRolls: {
          'test-roll-id': {
            rolls: [1, 200, 2, 3],
            total: 206
          }
        },
        total: 206,
        result: [1, 200, 2, 3],
        rawResult: [1, 1, 2, 3],
        type: 'numerical'
      })
    })

    describe('when given a "notUnique" array', () => {
      const notUniqueParameters = {
        dicePools: {
          'test-roll-id': createRollParameters({
            options: {
              sides: 4,
              quantity: uniqueRolls.length,
              modifiers: { unique: { notUnique: [1] } }
            }
          })
        }
      }

      test('it disregards any numbers in that array and makes the rest unique', () => {
        const rawRolls = {
          'test-roll-id': uniqueRolls
        }

        spyOn(CoreSpreadRolls, 'coreSpreadRolls').mockReturnValueOnce(
          uniqueRolls
        )
        expect(rollResultFromDicePools(notUniqueParameters)).toMatchObject({
          ...notUniqueParameters,
          rawRolls,
          modifiedRolls: {
            'test-roll-id': {
              rolls: [1, 1, 2, 3],
              total: 7
            }
          },
          total: 7,
          result: [1, 1, 2, 3],
          rawResult: uniqueRolls,
          type: 'numerical'
        })
      })
    })

    describe('and the # of quantity is greater than the sides of the die', () => {
      const overflowRollTotals = [1, 1, 1, 2, 3, 4, 3, 3]

      const overflowParameters = {
        dicePools: {
          'test-roll-id': createRollParameters({
            options: {
              sides: 6,
              quantity: overflowRollTotals.length,
              modifiers: { unique: true }
            }
          })
        }
      }

      test('it throws an error', () => {
        spyOn(CoreSpreadRolls, 'coreSpreadRolls').mockReturnValueOnce(
          overflowRollTotals
        )
        expect(() => rollResultFromDicePools(overflowParameters)).toThrow()
      })
    })
  })

  describe('when given custom sides', () => {
    const faces = ['r', 'a', 'n', 'd', 's', 'u', 'm']
    const customSidesRoll = ['r', 'a', 'n', 'd']

    const customSidesParameters = {
      dicePools: {
        'test-roll-id': createRollParameters({
          options: {
            sides: faces,
            quantity: 4
          }
        })
      }
    }

    test('it returns the expected result as a string', () => {
      const rawRolls = {
        'test-roll-id': customSidesRoll
      }
      spyOn(CoreSpreadRolls, 'coreSpreadRolls').mockReturnValueOnce(
        customSidesRoll
      )

      expect(rollResultFromDicePools(customSidesParameters)).toMatchObject({
        ...customSidesParameters,
        rawRolls,
        modifiedRolls: {
          'test-roll-id': {
            rolls: customSidesRoll,
            total: 'r, a, n, d'
          }
        },
        total: 'r, a, n, d',
        rawResult: customSidesRoll,
        result: customSidesRoll,
        type: 'custom'
      })
    })
  })

  describe('when given roll total with a "drop" modifier', () => {
    const longerRollTotals = [1, 2, 3, 4, 5, 6, 7, 8, 9]

    const dropParameters = {
      dicePools: {
        'test-roll-id': createRollParameters({
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
      }
    }

    test('it returns the total without the provided values', () => {
      const rawRolls = {
        'test-roll-id': longerRollTotals
      }

      spyOn(CoreSpreadRolls, 'coreSpreadRolls').mockReturnValueOnce(
        longerRollTotals
      )

      expect(rollResultFromDicePools(dropParameters)).toMatchObject({
        ...dropParameters,
        rawRolls,
        modifiedRolls: {
          'test-roll-id': {
            rolls: [4, 6, 7],
            total: 17
          }
        },
        total: 17,
        rawResult: longerRollTotals,
        result: [4, 6, 7],
        type: 'numerical'
      })
    })
  })

  describe('when given roll total with a "replace" modifier', () => {
    describe('that is a single replace modifier', () => {
      const dropParameters = {
        dicePools: {
          'test-roll-id': createRollParameters({
            options: {
              sides: 10,
              quantity: testRollSet.length,
              modifiers: { replace: { from: 1, to: 2 } }
            }
          })
        }
      }

      test('it returns the total with all values replaced according to the provided rules', () => {
        spyOn(CoreSpreadRolls, 'coreSpreadRolls').mockReturnValueOnce(
          testRollSet
        )
        expect(rollResultFromDicePools(dropParameters)).toMatchObject({
          ...dropParameters,
          rawRolls: coreRawRolls,
          modifiedRolls: {
            'test-roll-id': {
              rolls: [2, 2, 3, 4],
              total: 11
            }
          },
          total: 11,
          rawResult: testRollSet,
          result: [2, 2, 3, 4],
          type: 'numerical'
        })
      })
    })

    describe('that is an array of replace modifiers', () => {
      const dropParameters = {
        dicePools: {
          'test-roll-id': createRollParameters({
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
        }
      }

      test('it returns the total with all values replaced according to the provided rules', () => {
        spyOn(CoreSpreadRolls, 'coreSpreadRolls').mockReturnValueOnce(
          testRollSet
        )
        expect(rollResultFromDicePools(dropParameters)).toMatchObject({
          ...dropParameters,
          rawRolls: coreRawRolls,
          modifiedRolls: {
            'test-roll-id': {
              rolls: [2, 2, 3, 6],
              total: 13
            }
          },
          total: 13,
          rawResult: testRollSet,
          result: [2, 2, 3, 6],
          type: 'numerical'
        })
      })
    })
  })

  describe('when given roll total with an "explode" modifier', () => {
    const explodeRollTotals = [1, 2, 3, 6]

    const explodeParameters = {
      dicePools: {
        'test-roll-id': createRollParameters({
          options: {
            sides: 6,
            quantity: explodeRollTotals.length,
            modifiers: { explode: true }
          }
        })
      }
    }

    test('it returns the total with all values matching the queries rerolled', () => {
      const rawRolls = {
        'test-roll-id': explodeRollTotals
      }
      spyOn(CoreSpreadRolls, 'coreSpreadRolls').mockReturnValueOnce(
        explodeRollTotals
      )

      expect(rollResultFromDicePools(explodeParameters)).toMatchObject({
        ...explodeParameters,
        rawRolls,
        modifiedRolls: {
          'test-roll-id': {
            rolls: [1, 2, 3, 6, 200],
            total: 212
          }
        },
        total: 212,
        rawResult: explodeRollTotals,
        result: [1, 2, 3, 6, 200],
        type: 'numerical'
      })
    })
  })

  describe('when given roll total with a "reroll" modifier', () => {
    describe('when given an impossible roll', () => {
      const reDicePools = {
        dicePools: {
          'test-roll-id': createRollParameters({
            options: {
              sides: 6,
              quantity: testRollSet.length,
              modifiers: { reroll: { greaterThan: 3 } }
            },
            die: new D(4)
          })
        }
      }

      test('it stops at 99 rerolls and returns the total with all values matching the queries rerolled', () => {
        spyOn(CoreSpreadRolls, 'coreSpreadRolls').mockReturnValueOnce(
          testRollSet
        )
        expect(rollResultFromDicePools(reDicePools)).toMatchObject({
          ...reDicePools,
          rawRolls: coreRawRolls,
          modifiedRolls: {
            'test-roll-id': {
              rolls: [1, 2, 3, 200],
              total: 206
            }
          },
          total: 206,
          rawResult: testRollSet,
          result: [1, 2, 3, 200],
          type: 'numerical'
        })
      })
    })

    describe('that is a single reroll modifier in an array', () => {
      const reDicePools = {
        dicePools: {
          'test-roll-id': createRollParameters({
            options: {
              sides: 6,
              quantity: testRollSet.length,
              modifiers: {
                reroll: { greaterThan: 3, exact: [2], max: 2 }
              }
            }
          })
        }
      }

      test('it returns the total with all values matching the queries rerolled', () => {
        spyOn(CoreSpreadRolls, 'coreSpreadRolls').mockReturnValueOnce(
          testRollSet
        )
        expect(rollResultFromDicePools(reDicePools)).toMatchObject({
          ...reDicePools,
          rawRolls: coreRawRolls,
          modifiedRolls: {
            'test-roll-id': {
              rolls: [1, 200, 3, 200],
              total: 404
            }
          },
          total: 404,
          rawResult: testRollSet,
          result: [1, 200, 3, 200],
          type: 'numerical'
        })
      })
    })

    describe('that is an array of reroll modifiers', () => {
      const reDicePools = {
        dicePools: {
          'test-roll-id': createRollParameters({
            options: {
              sides: 6,
              quantity: testRollSet.length,
              modifiers: {
                reroll: { lessThan: 2, max: 2, exact: [3] }
              }
            }
          })
        }
      }

      test('it returns the total with all values matching the queries rerolled', () => {
        spyOn(CoreSpreadRolls, 'coreSpreadRolls').mockReturnValueOnce(
          testRollSet
        )
        expect(rollResultFromDicePools(reDicePools)).toMatchObject({
          ...reDicePools,
          rawRolls: coreRawRolls,
          modifiedRolls: {
            'test-roll-id': {
              rolls: [200, 2, 200, 4],
              total: 406
            }
          },
          total: 406,
          rawResult: testRollSet,
          result: [200, 2, 200, 4],
          type: 'numerical'
        })
      })
    })
  })

  describe('when given roll total with a "cap" modifier', () => {
    const dropParameters = {
      dicePools: {
        'test-roll-id': createRollParameters({
          options: {
            sides: 6,
            quantity: testRollSet.length,
            modifiers: { cap: { greaterThan: 3, lessThan: 2 } }
          }
        })
      }
    }

    test('it returns the total with all values greaterThan greaterThan and lessThan lessThan replaced with their respective comparitor and the roll total', () => {
      spyOn(CoreSpreadRolls, 'coreSpreadRolls').mockReturnValueOnce(testRollSet)
      expect(rollResultFromDicePools(dropParameters)).toMatchObject({
        ...dropParameters,
        rawRolls: coreRawRolls,
        modifiedRolls: {
          'test-roll-id': {
            rolls: [2, 2, 3, 3],
            total: 10
          }
        },
        total: 10,
        rawResult: testRollSet,
        result: [2, 2, 3, 3],
        type: 'numerical'
      })
    })
  })

  describe('when given roll total with a "plus" modifier', () => {
    const dropParameters = {
      dicePools: {
        'test-roll-id': createRollParameters({
          options: {
            sides: 6,
            quantity: testRollSet.length,
            modifiers: { plus: 2 }
          }
        })
      }
    }

    test('it returns the total plus the "plus" modifier, and the roll total', () => {
      spyOn(CoreSpreadRolls, 'coreSpreadRolls').mockReturnValueOnce(testRollSet)
      expect(rollResultFromDicePools(dropParameters)).toMatchObject({
        ...dropParameters,
        rawRolls: coreRawRolls,
        modifiedRolls: {
          'test-roll-id': {
            rolls: testRollSet,
            total: 12
          }
        },
        total: 12,
        rawResult: testRollSet,
        result: testRollSet,
        type: 'numerical'
      })
    })
  })

  describe('when given roll total with a "minus" modifier', () => {
    const dropParameters = {
      dicePools: {
        'test-roll-id': createRollParameters({
          options: {
            sides: 6,
            quantity: testRollSet.length,
            modifiers: { minus: 2 }
          }
        })
      }
    }

    test('it returns the total minus the "minus" modifier, and the roll total', () => {
      spyOn(CoreSpreadRolls, 'coreSpreadRolls').mockReturnValueOnce(testRollSet)
      expect(rollResultFromDicePools(dropParameters)).toMatchObject({
        ...dropParameters,
        rawRolls: coreRawRolls,
        modifiedRolls: {
          'test-roll-id': {
            rolls: testRollSet,
            total: 8
          }
        },
        total: 8,
        rawResult: testRollSet,
        result: testRollSet,
        type: 'numerical'
      })
    })
  })

  describe('when given multiple dice pools', () => {
    const parameters = {
      dicePools: {
        'test-roll-id': createRollParameters(),
        'test-roll-id-2': createRollParameters()
      }
    }

    test('it returns the combined total', () => {
      const rawRolls = {
        'test-roll-id': testRollSet,
        'test-roll-id-2': testRollSet
      }
      spyOn(CoreSpreadRolls, 'coreSpreadRolls').mockReturnValueOnce(testRollSet)
      spyOn(CoreSpreadRolls, 'coreSpreadRolls').mockReturnValueOnce(testRollSet)

      expect(rollResultFromDicePools(parameters)).toMatchObject({
        ...parameters,
        rawRolls,
        modifiedRolls: {
          'test-roll-id': {
            rolls: testRollSet,
            total: 10
          },
          'test-roll-id-2': {
            rolls: testRollSet,
            total: 10
          }
        },
        total: 20,
        rawResult: [1, 2, 3, 4, 1, 2, 3, 4],
        result: [1, 2, 3, 4, 1, 2, 3, 4],
        type: 'numerical'
      })
    })
  })

  describe('Given multiple dice pools of different dice types', () => {
    const parameters = {
      dicePools: {
        'test-roll-id': createRollParameters({
          options: { sides: 6, quantity: testRollSet.length }
        }),
        'test-roll-id-2': createRollParameters({
          options: {
            sides: ['+', '+', '-', '-', ' ', ' '],
            quantity: testCustomRollSet.length
          }
        })
      }
    }
    test('it returns the combined total', () => {
      const rawRolls = {
        'test-roll-id': testRollSet,
        'test-roll-id-2': testCustomRollSet
      }
      spyOn(CoreSpreadRolls, 'coreSpreadRolls').mockReturnValueOnce(testRollSet)
      spyOn(CoreSpreadRolls, 'coreSpreadRolls').mockReturnValueOnce(
        testCustomRollSet
      )

      expect(rollResultFromDicePools(parameters)).toMatchObject({
        ...parameters,
        rawRolls,
        modifiedRolls: {
          'test-roll-id': {
            rolls: testRollSet,
            total: 10
          },
          'test-roll-id-2': {
            rolls: ['+', '-', ' '],
            total: '+, -,  '
          }
        },
        total: '10, +, -,  ',
        rawResult: [1, 2, 3, 4, '+', '-', ' '],
        result: [1, 2, 3, 4, '+', '-', ' '],
        type: 'mixed'
      })
    })
  })
})
