import { describe, expect, spyOn, test } from 'bun:test'

import { CustomSidesDie, StandardDie } from '../src/Die'
import generateResult from '../src/roll/generate-result'
import { InvalidUniqueError } from '../src/roll/generate-result/apply-modifiers'
import * as GenerateRawRolls from '../src/roll/generate-result/generate-raw-rolls'
import { RollParameters } from '../src/types/parameters'
import { DicePoolType } from '../src/types/primitives'

describe('generateResult', () => {
  const testRollSet = [1, 2, 3, 4]

  const mockStandardDie = {
    roll: () => 200
  } as unknown as StandardDie

  const mockCustomSidesDie = {
    roll: () => '+'
  } as unknown as CustomSidesDie

  describe('when given roll total with no modifiers', () => {
    const coreParameters: RollParameters = {
      dicePools: {
        'test-roll-id': {
          argument: undefined,
          options: { sides: 6, quantity: testRollSet.length },
          die: mockStandardDie
        }
      }
    }

    test('it returns the sum total of the quantity and the roll total', () => {
      const rawRolls = {
        'test-roll-id': testRollSet
      }

      spyOn(GenerateRawRolls, 'default').mockReturnValueOnce(rawRolls)

      expect(generateResult(coreParameters)).toMatchObject({
        ...coreParameters,
        rawRolls,
        type: DicePoolType.standard,
        total: 10,
        result: [[1, 2, 3, 4]]
      })
    })
  })

  describe('when given roll total with a "unique" modifier', () => {
    const uniqueRolls = [1, 1, 2, 3]

    const uniqueParameters = {
      dicePools: {
        'test-roll-id': {
          die: mockStandardDie,
          argument: undefined,
          options: {
            sides: 4,
            quantity: uniqueRolls.length,
            modifiers: { unique: true }
          }
        }
      }
    }

    test('it re-rolls non-unique modifiers', () => {
      const rawRolls = {
        'test-roll-id': uniqueRolls
      }
      spyOn(GenerateRawRolls, 'default').mockReturnValueOnce(rawRolls)

      expect(generateResult(uniqueParameters)).toMatchObject({
        ...uniqueParameters,
        rawRolls,
        modifiedRolls: {
          'test-roll-id': {
            rolls: [1, 200, 2, 3],
            total: 206
          }
        },
        type: DicePoolType.standard,
        total: 206,
        result: [[1, 200, 2, 3]]
      })
    })

    describe('when given a "notUnique" array', () => {
      const notUniqueParameters = {
        dicePools: {
          'test-roll-id': {
            die: mockStandardDie,
            argument: undefined,
            type: DicePoolType.standard,
            options: {
              sides: 4,
              quantity: uniqueRolls.length,
              modifiers: { unique: { notUnique: [1] } }
            }
          }
        }
      }

      test('it disregards any numbers in that array and makes the rest unique', () => {
        const rawRolls = {
          'test-roll-id': uniqueRolls
        }
        spyOn(GenerateRawRolls, 'default').mockReturnValueOnce(rawRolls)

        expect(generateResult(notUniqueParameters)).toMatchObject({
          ...notUniqueParameters,
          rawRolls,
          modifiedRolls: {
            'test-roll-id': {
              rolls: [1, 1, 2, 3],
              total: 7
            }
          },
          type: DicePoolType.standard,
          total: 7,
          result: [[1, 1, 2, 3]]
        })
      })
    })

    describe('and the # of quantity is greater than the sides of the die', () => {
      const overflowRollTotals = [1, 1, 1, 2, 3, 4, 3, 3]

      const overflowParameters = {
        dicePools: {
          'test-roll-id': {
            die: mockStandardDie,
            argument: undefined,
            type: DicePoolType.standard,
            options: {
              sides: 6,
              quantity: overflowRollTotals.length,
              modifiers: { unique: true }
            }
          }
        }
      }

      test('it throws an error', () => {
        const rawRolls = {
          'test-roll-id': overflowRollTotals
        }
        spyOn(GenerateRawRolls, 'default').mockReturnValueOnce(rawRolls)

        expect(() => generateResult(overflowParameters)).toThrow(
          new InvalidUniqueError()
        )
      })
    })
  })

  describe('when given custom sides', () => {
    const faces = ['r', 'a', 'n', 'd', 's', 'u', 'm']
    const customSidesRoll = ['r', 'a', 'n', 'd']

    const customSidesParameters: RollParameters = {
      dicePools: {
        'test-roll-id': {
          die: mockCustomSidesDie,
          argument: undefined,
          options: {
            sides: faces,
            quantity: 4
          }
        }
      }
    }

    test('it returns the expected result as a string', () => {
      const rawRolls = {
        'test-roll-id': customSidesRoll
      }
      spyOn(GenerateRawRolls, 'default').mockReturnValueOnce(rawRolls)

      expect(generateResult(customSidesParameters)).toMatchObject({
        ...customSidesParameters,
        rawRolls,
        modifiedRolls: {
          'test-roll-id': {
            rolls: customSidesRoll,
            total: 0
          }
        },
        total: 0,
        type: DicePoolType.custom,
        result: [customSidesRoll]
      })
    })
  })

  describe('when given roll total with a "drop" modifier', () => {
    const longerRollTotals = [1, 2, 3, 4, 5, 6, 7, 8, 9]

    const dropParameters: RollParameters = {
      dicePools: {
        'test-roll-id': {
          argument: undefined,
          die: mockStandardDie,
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
        }
      }
    }

    test('it returns the total without the provided values', () => {
      const rawRolls = {
        'test-roll-id': longerRollTotals
      }
      spyOn(GenerateRawRolls, 'default').mockReturnValueOnce(rawRolls)

      expect(generateResult(dropParameters)).toMatchObject({
        ...dropParameters,
        rawRolls,
        modifiedRolls: {
          'test-roll-id': {
            rolls: [4, 6, 7],
            total: 17
          }
        },
        type: DicePoolType.standard,
        total: 17,
        result: [[4, 6, 7]]
      })
    })
  })

  describe('when given roll total with a "replace" modifier', () => {
    describe('that is a single replace modifiers', () => {
      const dropParameters: RollParameters = {
        dicePools: {
          'test-roll-id': {
            argument: undefined,
            die: mockStandardDie,
            options: {
              sides: 10,
              quantity: testRollSet.length,
              modifiers: { replace: { from: 1, to: 2 } }
            }
          }
        }
      }

      test('it returns the total with all values replaced according to the provided rules', () => {
        const rawRolls = {
          'test-roll-id': testRollSet
        }
        spyOn(GenerateRawRolls, 'default').mockReturnValueOnce(rawRolls)

        expect(generateResult(dropParameters)).toMatchObject({
          ...dropParameters,
          rawRolls,
          type: DicePoolType.standard,
          modifiedRolls: {
            'test-roll-id': {
              rolls: [2, 2, 3, 4],
              total: 11
            }
          },
          total: 11,
          result: [[2, 2, 3, 4]]
        })
      })
    })

    describe('that is an array of replace modifiers', () => {
      const dropParameters: RollParameters = {
        dicePools: {
          'test-roll-id': {
            argument: undefined,
            die: mockStandardDie,
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
          }
        }
      }

      test('it returns the total with all values replaced according to the provided rules', () => {
        const rawRolls = {
          'test-roll-id': testRollSet
        }
        spyOn(GenerateRawRolls, 'default').mockReturnValueOnce(rawRolls)

        expect(generateResult(dropParameters)).toMatchObject({
          ...dropParameters,
          type: DicePoolType.standard,
          rawRolls,
          modifiedRolls: {
            'test-roll-id': {
              rolls: [2, 2, 3, 6],
              total: 13
            }
          },
          total: 13,
          result: [[2, 2, 3, 6]]
        })
      })
    })
  })

  describe('when given roll total with an "explode" modifier', () => {
    const explodeRollTotals = [1, 2, 3, 6]

    const explodeParameters: RollParameters = {
      dicePools: {
        'test-roll-id': {
          argument: undefined,
          die: mockStandardDie,
          options: {
            sides: 6,
            quantity: explodeRollTotals.length,
            modifiers: { explode: true }
          }
        }
      }
    }

    test('it returns the total with all values matching the queries rerolled', () => {
      const rawRolls = {
        'test-roll-id': explodeRollTotals
      }
      spyOn(GenerateRawRolls, 'default').mockReturnValueOnce(rawRolls)

      expect(generateResult(explodeParameters)).toMatchObject({
        ...explodeParameters,
        rawRolls,
        type: DicePoolType.standard,
        modifiedRolls: {
          'test-roll-id': {
            rolls: [1, 2, 3, 6, 200],
            total: 212
          }
        },
        total: 212,
        result: [[1, 2, 3, 6, 200]]
      })
    })
  })

  describe('when given roll total with a "reroll" modifier', () => {
    describe('when given an impossible roll', () => {
      const rerollParameters: RollParameters = {
        dicePools: {
          'test-roll-id': {
            argument: undefined,
            options: {
              sides: 6,
              quantity: testRollSet.length,
              modifiers: { reroll: { greaterThan: 3 } }
            },
            die: mockStandardDie
          }
        }
      }

      test('it stops at 99 rerolls and returns the total with all values matching the queries rerolled', () => {
        const rawRolls = {
          'test-roll-id': testRollSet
        }

        spyOn(GenerateRawRolls, 'default').mockReturnValueOnce(rawRolls)
        expect(generateResult(rerollParameters)).toMatchObject({
          ...rerollParameters,
          rawRolls,
          modifiedRolls: {
            'test-roll-id': {
              rolls: [1, 2, 3, 200],
              total: 206
            }
          },
          type: DicePoolType.standard,
          total: 206,
          result: [[1, 2, 3, 200]]
        })
      })
    })

    describe('that is a single reroll modifier', () => {
      const rerollParameters: RollParameters = {
        dicePools: {
          'test-roll-id': {
            argument: undefined,
            options: {
              sides: 6,
              quantity: testRollSet.length,
              modifiers: { reroll: { greaterThan: 3, exact: 2, maxReroll: 2 } }
            },
            die: mockStandardDie
          }
        }
      }

      test('it returns the total with all values matching the queries rerolled', () => {
        const rawRolls = {
          'test-roll-id': testRollSet
        }

        spyOn(GenerateRawRolls, 'default').mockReturnValueOnce(rawRolls)
        expect(generateResult(rerollParameters)).toMatchObject({
          ...rerollParameters,
          rawRolls,
          modifiedRolls: {
            'test-roll-id': {
              rolls: [1, 200, 3, 200],
              total: 404
            }
          },
          total: 404,
          type: DicePoolType.standard,
          result: [[1, 200, 3, 200]]
        })
      })
    })

    describe('that is an array of reroll modifiers', () => {
      const rerollParameters: RollParameters = {
        dicePools: {
          'test-roll-id': {
            argument: undefined,
            options: {
              sides: 6,
              quantity: testRollSet.length,
              modifiers: {
                reroll: [{ lessThan: 2, maxReroll: 2 }, { exact: [3] }]
              }
            },
            die: mockStandardDie
          }
        }
      }

      test('it returns the total with all values matching the queries rerolled', () => {
        const rawRolls = {
          'test-roll-id': testRollSet
        }

        spyOn(GenerateRawRolls, 'default').mockReturnValueOnce(rawRolls)
        expect(generateResult(rerollParameters)).toMatchObject({
          ...rerollParameters,
          rawRolls,
          modifiedRolls: {
            'test-roll-id': {
              rolls: [200, 2, 200, 4],
              total: 406
            }
          },
          type: DicePoolType.standard,
          total: 406,
          result: [[200, 2, 200, 4]]
        })
      })
    })
  })

  describe('when given roll total with a "cap" modifier', () => {
    const dropParameters: RollParameters = {
      dicePools: {
        'test-roll-id': {
          argument: undefined,
          options: {
            sides: 6,
            quantity: testRollSet.length,
            modifiers: { cap: { greaterThan: 3, lessThan: 2 } }
          },
          die: mockStandardDie
        }
      }
    }

    test('it returns the total with all values greaterThan greaterThan and lessThan lessThan replaced with their respective comparitor and the roll total', () => {
      const rawRolls = {
        'test-roll-id': testRollSet
      }

      spyOn(GenerateRawRolls, 'default').mockReturnValueOnce(rawRolls)
      expect(generateResult(dropParameters)).toMatchObject({
        ...dropParameters,
        rawRolls,
        modifiedRolls: {
          'test-roll-id': {
            rolls: [2, 2, 3, 3],
            total: 10
          }
        },
        type: DicePoolType.standard,
        total: 10,
        result: [[2, 2, 3, 3]]
      })
    })
  })

  describe('when given roll total with a "plus" modifier', () => {
    const dropParameters: RollParameters = {
      dicePools: {
        'test-roll-id': {
          argument: undefined,
          options: {
            sides: 6,
            quantity: testRollSet.length,
            modifiers: { plus: 2 }
          },
          die: mockStandardDie
        }
      }
    }

    test('it returns the total plus the "plus" modifier, and the roll total', () => {
      const rawRolls = {
        'test-roll-id': testRollSet
      }

      spyOn(GenerateRawRolls, 'default').mockReturnValueOnce(rawRolls)

      expect(generateResult(dropParameters)).toMatchObject({
        ...dropParameters,
        rawRolls,
        modifiedRolls: {
          'test-roll-id': {
            rolls: [1, 2, 3, 4],
            total: 12
          }
        },
        total: 12,
        result: [[1, 2, 3, 4]]
      })
    })
  })

  describe('when given roll total with a "minus" modifier', () => {
    const dropParameters: RollParameters = {
      dicePools: {
        'test-roll-id': {
          argument: undefined,
          options: {
            sides: 6,
            quantity: testRollSet.length,
            modifiers: { minus: 2 }
          },
          die: mockStandardDie
        }
      }
    }

    test('it returns the total minus the "minus" modifier, and the roll total', () => {
      const rawRolls = {
        'test-roll-id': testRollSet
      }

      spyOn(GenerateRawRolls, 'default').mockReturnValueOnce(rawRolls)
      expect(generateResult(dropParameters)).toMatchObject({
        ...dropParameters,
        rawRolls,
        modifiedRolls: {
          'test-roll-id': {
            rolls: [1, 2, 3, 4],
            total: 8
          }
        },
        total: 8,
        result: [[1, 2, 3, 4]]
      })
    })
  })

  describe('when given an roll total with an unrecognized modifier', () => {
    const dropParameters: RollParameters = {
      dicePools: {
        'test-roll-id': {
          argument: undefined,
          options: {
            sides: 6,
            quantity: testRollSet.length,
            modifiers: { foo: 2 }
          },
          die: mockStandardDie
        }
      }
    } as unknown as RollParameters

    test('Throws an error', () => {
      expect(() => generateResult(dropParameters)).toThrow(
        'Unknown modifier: foo'
      )
    })
  })
})
