import { describe, expect, test } from 'bun:test'
import { ArgumentsModel } from '~models'

import { D } from '~src/D'
import type { DicePools, Notation, RollParameters } from '~types'

const extractDicePoolValues = (params: DicePools): RollParameters[] => {
  const pools = Object.entries(params.dicePools)
  return pools.map(([, value]) => value)
}

describe('ArgumentModel.parameterize', () => {
  describe('given a number', () => {
    const argument = 2

    test('returns a RollParameter matching the argument', () => {
      const params = ArgumentsModel.parameterize(argument)

      expect(params).toMatchObject({
        argument,
        options: { quantity: 1, sides: argument },
        die: new D(argument),
        notation: '1d2',
        description: ['Roll 1 2-sided die']
      })
    })
  })

  describe('given custom sides', () => {
    const argument = ['h', 't']

    test('returns a RollParameter matching the argument', () => {
      const params = ArgumentsModel.parameterize(argument)

      expect(params).toMatchObject({
        argument,
        options: { quantity: 1, sides: argument },
        die: new D(argument),
        notation: '1d{ht}',
        description: ['Roll 1 die with the following sides: (h,t)']
      })
    })
  })

  describe('given Roll Options', () => {
    describe('simple', () => {
      const argument = {
        quantity: 4,
        sides: 6
      }

      test('returns a RollParameter matching the argument', () => {
        const params = ArgumentsModel.parameterize(argument)

        expect(params).toMatchObject({
          argument,
          options: argument,
          die: new D(argument.sides),
          notation: '4d6',
          description: ['Roll 4 6-sided dice']
        })
      })
    })

    describe('simple with modifiers', () => {
      const argument = {
        quantity: 4,
        sides: 6,
        modifiers: {
          reroll: {
            exact: [2, 1, 4],
            maxReroll: 3
          },
          replace: { from: { greaterThan: 5 }, to: 1 },
          unique: true
        }
      }

      test('returns a RollParameter matching the argument', () => {
        const params = ArgumentsModel.parameterize(argument)

        expect(params).toMatchObject({
          argument,
          options: argument,
          die: new D(argument.sides),
          notation: '4d6V{>5=1}R{2,1,4}3U',
          description: [
            'Roll 4 6-sided dice',
            'Replace greater than [5] with [1]',
            'Reroll [2] [1] and [4] (up to 3 times)',
            'No Duplicate Rolls'
          ]
        })
      })
    })

    describe('custom sides', () => {
      const argument = {
        quantity: 4,
        sides: ['r', 'a', 'n', 'd', 's', 'u', 'm']
      }

      test('returns a RollParameter matching the argument', () => {
        const params = ArgumentsModel.parameterize(argument)

        expect(params).toMatchObject({
          argument,
          options: argument,
          die: new D(argument.sides),
          notation: '4d{randsum}',
          description: ['Roll 4 dice with the following sides: (r,a,n,d,s,u,m)']
        })
      })
    })

    describe('complex', () => {
      const argument = {
        quantity: 4,
        sides: 6,
        modifiers: {
          plus: 2,
          minus: 1,
          drop: {
            highest: undefined,
            greaterThan: 2,
            lessThan: 6,
            lowest: 1,
            exact: [2, 3]
          },
          reroll: { exact: undefined },
          cap: { greaterThan: 2, lessThan: 1 },
          replace: { from: 6, to: 1 },
          unique: { notUnique: [1, 2] },
          explode: true
        }
      }

      test('returns a RollParameter matching the argument', () => {
        const params = ArgumentsModel.parameterize(argument)

        expect(params).toMatchObject({
          argument,
          options: argument,
          die: new D(argument.sides),
          notation: '4d6C{>2,<1}LD{>2,<6,2,3}V{6=1}!U{1,2}+2-1',
          description: [
            'Roll 4 6-sided dice',
            'No Rolls greater than [2]',
            'No Rolls less than [1]',
            'Drop lowest',
            'Drop [2] and [3]',
            'Drop greater than [2]',
            'Drop less than [6]',
            'Replace [6] with [1]',
            'Exploding Dice',
            'No Duplicates (except [1] and [2])',
            'Add 2',
            'Subtract 1'
          ]
        })
      })
    })
  })

  describe('Given a D() object', () => {
    describe('simple', () => {
      const argument = new D(6)

      test('returns a RollParameter matching the argument', () => {
        const params = ArgumentsModel.parameterize(argument)

        expect(params).toMatchObject({
          argument,
          options: {
            sides: argument.sides,
            quantity: 1
          },
          die: argument,
          notation: '1d6',
          description: ['Roll 1 6-sided die']
        })
      })
    })

    describe('custom sides', () => {
      const argument = new D(['r', 'a', 'n', 'd', 's', 'u', 'm'])

      test('returns a RollParameter matching the argument', () => {
        const params = ArgumentsModel.parameterize(argument)

        expect(params).toMatchObject({
          argument,
          options: {
            sides: argument.faces,
            quantity: 1
          },
          die: argument,
          notation: '1d{randsum}',
          description: ['Roll 1 die with the following sides: (r,a,n,d,s,u,m)']
        })
      })
    })
  })

  describe('given Notation', () => {
    const coreTestString: Notation = '4d6'
    const coreDicePools = { sides: 6, quantity: 4 }

    describe('given a basic notation', () => {
      const argument = coreTestString

      test('returns a RollParameter matching the notation', () => {
        const params = ArgumentsModel.parameterize(argument)

        expect(params).toMatchObject({
          argument,
          options: coreDicePools,
          die: new D(coreDicePools.sides),
          notation: '4d6',
          description: ['Roll 4 6-sided dice']
        })
      })
    })

    describe('given a notation that uses custom faces', () => {
      describe('with a simple notation', () => {
        const argument: Notation = '4d{++--  }'
        const customSides = ['+', '+', '-', '-', ' ', ' ']

        test('returns a RollParameter matching the notation', () => {
          const params = ArgumentsModel.parameterize(argument)

          expect(params).toMatchObject({
            argument,
            options: { quantity: 4, sides: customSides },
            die: new D(customSides),
            notation: '4d{++--  }',
            description: ['Roll 4 dice with the following sides: (+,+,-,-, , )']
          })
        })
      })
    })

    describe('given a notation that contains a drop highest modifier', () => {
      describe('with a simple notation', () => {
        const argument: Notation = `${coreTestString}H`

        test('returns a RollParameter matching the notation', () => {
          const params = ArgumentsModel.parameterize(argument)

          expect(params).toMatchObject({
            argument,
            options: {
              ...coreDicePools,
              modifiers: { drop: { highest: 1 } }
            },
            die: new D(coreDicePools.sides),
            notation: '4d6H',
            description: ['Roll 4 6-sided dice', 'Drop highest']
          })
        })
      })

      describe('with a complex notation', () => {
        const argument: Notation = `${coreTestString}H2`

        test('returns a RollParameter matching the notation', () => {
          const params = ArgumentsModel.parameterize(argument)

          expect(params).toMatchObject({
            argument,
            options: {
              ...coreDicePools,
              modifiers: { drop: { highest: 2 } }
            },
            die: new D(coreDicePools.sides),
            notation: '4d6H2',
            description: ['Roll 4 6-sided dice', 'Drop highest 2']
          })
        })
      })
    })

    describe('given a notation that contains a drop lowest modifier', () => {
      describe('with a simple notation', () => {
        const argument: Notation = `${coreTestString}L`

        test('returns a RollParameter matching the notation', () => {
          const params = ArgumentsModel.parameterize(argument)

          expect(params).toMatchObject({
            argument,
            options: {
              ...coreDicePools,
              modifiers: { drop: { lowest: 1 } }
            },
            die: new D(coreDicePools.sides),
            notation: '4d6L',
            description: ['Roll 4 6-sided dice', 'Drop lowest']
          })
        })
      })

      describe('with a complex notation', () => {
        const argument: Notation = `${coreTestString}L2`

        test('returns a RollParameter matching the notation', () => {
          const params = ArgumentsModel.parameterize(argument)

          expect(params).toMatchObject({
            argument,
            options: {
              ...coreDicePools,
              modifiers: { drop: { lowest: 2 } }
            },
            die: new D(coreDicePools.sides),
            notation: '4d6L2',
            description: ['Roll 4 6-sided dice', 'Drop lowest 2']
          })
        })
      })
    })

    describe('given a notation that contains a drop less than, greater than, and exact', () => {
      const argument: Notation = `${coreTestString}D{<2,>5,2,4}`

      test('returns a RollParameter matching the notation', () => {
        const params = ArgumentsModel.parameterize(argument)

        expect(params).toMatchObject({
          argument,
          options: {
            ...coreDicePools,
            modifiers: {
              drop: { greaterThan: 5, lessThan: 2, exact: [2, 4] }
            }
          },
          die: new D(coreDicePools.sides),
          notation: '4d6D{>5,<2,2,4}',
          description: [
            'Roll 4 6-sided dice',
            'Drop [2] and [4]',
            'Drop greater than [5]',
            'Drop less than [2]'
          ]
        })
      })
    })

    describe('given a notation that contains a cap before and lessThan', () => {
      const argument: Notation = `${coreTestString}C{<2,>5}`

      test('returns a RollParameter matching the notation', () => {
        const params = ArgumentsModel.parameterize(argument)

        expect(params).toMatchObject({
          argument,
          options: {
            ...coreDicePools,
            modifiers: { cap: { lessThan: 2, greaterThan: 5 } }
          },
          die: new D(coreDicePools.sides),

          notation: '4d6C{>5,<2}',
          description: [
            'Roll 4 6-sided dice',
            'No Rolls greater than [5]',
            'No Rolls less than [2]'
          ]
        })
      })
    })

    describe('given a notation that contains a minus modifier', () => {
      const argument: Notation = `${coreTestString}-2`

      test('returns a RollParameter matching the notation', () => {
        const params = ArgumentsModel.parameterize(argument)

        expect(params).toMatchObject({
          argument,
          options: {
            ...coreDicePools,
            modifiers: { minus: 2 }
          },
          die: new D(coreDicePools.sides),
          notation: '4d6-2',
          description: ['Roll 4 6-sided dice', 'Subtract 2']
        })
      })
    })

    describe('given a notation that contains a plus modifier', () => {
      const argument: Notation = `${coreTestString}+2`

      test('returns a RollParameter matching the notation', () => {
        const params = ArgumentsModel.parameterize(argument)

        expect(params).toMatchObject({
          argument,
          options: {
            ...coreDicePools,
            modifiers: { plus: 2 }
          },
          die: new D(coreDicePools.sides),
          notation: '4d6+2',
          description: ['Roll 4 6-sided dice', 'Add 2']
        })
      })
    })

    describe('given a notation that contains a reroll modifier', () => {
      const argument: Notation = `${coreTestString}R{5,20,<6,>2}3`

      test('returns a RollParameter matching the notation', () => {
        const params = ArgumentsModel.parameterize(argument)

        expect(params).toMatchObject({
          argument,
          options: {
            ...coreDicePools,
            modifiers: {
              reroll: {
                exact: [5, 20],
                lessThan: 6,
                greaterThan: 2,
                maxReroll: 3
              }
            }
          },
          die: new D(coreDicePools.sides),
          notation: '4d6R{5,20,>2,<6}3',
          description: [
            'Roll 4 6-sided dice',
            'Reroll [5] and [20], greater than [2] and less than [6] (up to 3 times)'
          ]
        })
      })
    })

    describe('given a notation that contains a unique notation', () => {
      describe('with a unique notation', () => {
        const argument: Notation = `${coreTestString}U{5,6}`

        test('returns a RollParameter matching the notation', () => {
          const params = ArgumentsModel.parameterize(argument)

          expect(params).toMatchObject({
            argument,
            options: {
              ...coreDicePools,
              modifiers: { unique: { notUnique: [5, 6] } }
            },
            die: new D(coreDicePools.sides),
            notation: '4d6U{5,6}',
            description: [
              'Roll 4 6-sided dice',
              'No Duplicates (except [5] and [6])'
            ]
          })
        })
      })

      describe('with a simple unique notation', () => {
        const argument: Notation = `${coreTestString}U`

        test('returns a RollParameter matching the notation', () => {
          const params = ArgumentsModel.parameterize(argument)

          expect(params).toMatchObject({
            argument,
            options: {
              ...coreDicePools,
              modifiers: { unique: true }
            },
            die: new D(coreDicePools.sides),
            notation: '4d6U',
            description: ['Roll 4 6-sided dice', 'No Duplicate Rolls']
          })
        })
      })
    })

    describe('given a notation that contains an explode modifier', () => {
      const argument: Notation = `${coreTestString}!`

      test('returns a RollParameter matching the notation', () => {
        const params = ArgumentsModel.parameterize(argument)

        expect(params).toMatchObject({
          argument,
          options: {
            ...coreDicePools,
            modifiers: { explode: true }
          },
          die: new D(coreDicePools.sides),
          notation: '4d6!',
          description: ['Roll 4 6-sided dice', 'Exploding Dice']
        })
      })
    })

    describe('given a notation that contains a replace modifier', () => {
      describe('with multiple replacements', () => {
        const argument: Notation = `${coreTestString}V{1=2,>2=6}`

        test('returns a RollParameter matching the notation', () => {
          const params = ArgumentsModel.parameterize(argument)

          expect(params).toMatchObject({
            argument,
            options: {
              ...coreDicePools,
              modifiers: {
                replace: [
                  { from: 1, to: 2 },
                  { from: { greaterThan: 2 }, to: 6 }
                ]
              }
            },
            die: new D(coreDicePools.sides),

            notation: '4d6V{1=2,>2=6}',
            description: [
              'Roll 4 6-sided dice',
              'Replace [1] with [2]',
              'Replace greater than [2] with [6]'
            ]
          })
        })
      })

      describe('with a single replacement', () => {
        const argument: Notation = `${coreTestString}V{<2=6}`

        test('returns a RollParameter matching the notation', () => {
          const params = ArgumentsModel.parameterize(argument)

          expect(params).toMatchObject({
            argument,
            options: {
              ...coreDicePools,
              modifiers: { replace: [{ from: { lessThan: 2 }, to: 6 }] }
            },
            die: new D(coreDicePools.sides),

            notation: '4d6V{<2=6}',
            description: [
              'Roll 4 6-sided dice',
              'Replace less than [2] with [6]'
            ]
          })
        })
      })
    })

    describe('With a corner case dice notation', () => {
      describe('like an ordered dice notation', () => {
        test('it produces proper organized parameters', () => {
          const explodeFirstString: Notation = '4d6!H'
          const explodeParams = ArgumentsModel.parameterize(explodeFirstString)

          expect(explodeParams).toMatchObject({
            argument: explodeFirstString,
            options: {
              ...coreDicePools,
              modifiers: { explode: true, drop: { highest: 1 } }
            },
            die: new D(coreDicePools.sides),
            notation: '4d6H!',
            description: [
              'Roll 4 6-sided dice',
              'Drop highest',
              'Exploding Dice'
            ]
          })

          const dropFirstString: Notation = '4d6H!'
          const dropFirstParams = ArgumentsModel.parameterize(dropFirstString)

          expect(dropFirstParams).toMatchObject({
            argument: dropFirstString,
            options: {
              ...coreDicePools,
              modifiers: { drop: { highest: 1 }, explode: true }
            },
            die: new D(coreDicePools.sides),

            notation: '4d6H!',
            description: [
              'Roll 4 6-sided dice',
              'Drop highest',
              'Exploding Dice'
            ]
          })
        })
      })

      describe('like a complicated dice notation', () => {
        const argument: Notation = `10d20 H2 L V{1=2,>2=6} D{<2,>5,2,4} C{<2,>18} R{5,2}3 U{5}  R{<6} ! +2 -5 +3`

        test('returns a RollParameter matching the notation', () => {
          const params = ArgumentsModel.parameterize(argument)

          expect(params).toMatchObject({
            argument,
            options: {
              quantity: 10,
              sides: 20,
              modifiers: {
                drop: {
                  highest: 2,
                  lowest: 1,
                  exact: [2, 4],
                  greaterThan: 5,
                  lessThan: 2
                },
                replace: [
                  { from: 1, to: 2 },
                  { from: { greaterThan: 2 }, to: 6 }
                ],
                cap: { greaterThan: 18, lessThan: 2 },
                reroll: { exact: [5, 2], lessThan: 6, maxReroll: 3 },
                unique: { notUnique: [5] },
                explode: true,
                plus: 5,
                minus: 5
              }
            },
            die: new D(20),
            notation:
              '10d20C{>18,<2}H2LD{>5,<2,2,4}V{1=2,>2=6}R{5,2,<6}3!U{5}+5-5',
            description: [
              'Roll 10 20-sided dice',
              'No Rolls greater than [18]',
              'No Rolls less than [2]',
              'Drop highest 2',
              'Drop lowest',
              'Drop [2] and [4]',
              'Drop greater than [5]',
              'Drop less than [2]',
              'Replace [1] with [2]',
              'Replace greater than [2] with [6]',
              'Reroll [5] and [2], less than [6] (up to 3 times)',
              'Exploding Dice',
              'No Duplicates (except [5])',
              'Add 5',
              'Subtract 5'
            ]
          })
        })
      })
    })
  })
})

describe('ArgumentsModel.formDicePools', () => {
  describe('given a single argument', () => {
    const argument = 20

    test('returns DicePools with one key', () => {
      const params = ArgumentsModel.formDicePools([argument])
      const dicePools = extractDicePoolValues(params)

      expect(dicePools.length).toBe(1)
      expect(dicePools[0].argument).toBe(argument)
    })
  })

  describe('given an array of arguments', () => {
    const argument: [number, Notation, string[]] = [2, '4d6', ['h', 't']]

    test('returns a DicePools matching the argument', () => {
      const params = ArgumentsModel.formDicePools(argument)
      const dicePools = extractDicePoolValues(params)

      expect(dicePools.length).toBe(3)

      expect(dicePools[0].argument).toBe(argument[0])
      expect(dicePools[1].argument).toBe(argument[1])
      expect(dicePools[2].argument).toBe(argument[2])
    })
  })
})
