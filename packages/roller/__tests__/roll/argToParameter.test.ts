import { describe, expect, test } from 'bun:test'

import { argToParameter } from '../../src/roll/argToParameter'

describe(argToParameter, () => {
  describe('given a number', () => {
    const argument = 2

    test('returns a RollParameter matching the argument', () => {
      const [params] = argToParameter(argument, 1)

      expect(params).toMatchObject({
        argument,
        quantity: 1,
        sides: argument,
        notation: '1d2',
        description: ['Roll 1 2-sided die']
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
        const [params] = argToParameter(argument, 1)

        expect(params).toMatchObject({
          argument,
          ...argument,
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
            max: 3
          },
          replace: { from: { greaterThan: 5 }, to: 1 },
          unique: true
        }
      }

      test('returns a RollParameter matching the argument', () => {
        const [params] = argToParameter(argument, 1)

        expect(params).toMatchObject({
          argument,
          ...argument,
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

    describe('complex', () => {
      const argument = {
        quantity: 4,
        sides: 6,
        modifiers: {
          plus: 2,
          minus: 1,
          drop: {
            greaterThan: 2,
            lessThan: 6,
            lowest: 1,
            exact: [2, 3]
          },
          reroll: { exact: [] },
          cap: { greaterThan: 2, lessThan: 1 },
          replace: { from: 6, to: 1 },
          unique: { notUnique: [1, 2] },
          explode: true
        }
      }

      test('returns a RollParameter matching the argument', () => {
        const [params] = argToParameter(argument, 1)

        expect(params).toMatchObject({
          argument,
          ...argument,
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

  describe('given DiceNotation', () => {
    const coreTestString = '4d6'
    const coreDicePools = { sides: 6, quantity: 4 }

    describe('given a basic notation', () => {
      const argument = coreTestString

      test('returns a RollParameter matching the notation', () => {
        const [params] = argToParameter(argument, 1)

        expect(params).toMatchObject({
          argument,
          ...coreDicePools,
          notation: '4d6',
          description: ['Roll 4 6-sided dice']
        })
      })
    })

    describe('given a basic negative notation', () => {
      const argument = `-${coreTestString}`

      test('returns a RollParameter matching the notation', () => {
        const [params] = argToParameter(argument, 1)

        expect(params).toMatchObject({
          argument,
          ...coreDicePools,
          arithmetic: 'subtract',
          notation: '-4d6',
          description: ['Roll 4 6-sided dice', 'and Subtract the result']
        })
      })
    })

    describe('given a notation that contains a drop highest modifier', () => {
      describe('with a simple notation', () => {
        const argument = `${coreTestString}H`

        test('returns a RollParameter matching the notation', () => {
          const [params] = argToParameter(argument, 1)

          expect(params).toMatchObject({
            argument,
            ...coreDicePools,
            modifiers: { drop: { highest: 1 } },
            notation: '4d6H',
            description: ['Roll 4 6-sided dice', 'Drop highest']
          })
        })
      })

      describe('with a complex notation', () => {
        const argument = `${coreTestString}H2`

        test('returns a RollParameter matching the notation', () => {
          const [params] = argToParameter(argument, 1)

          expect(params).toMatchObject({
            argument,
            ...coreDicePools,
            modifiers: { drop: { highest: 2 } },
            notation: '4d6H2',
            description: ['Roll 4 6-sided dice', 'Drop highest 2']
          })
        })
      })
    })

    describe('given a notation that contains a drop lowest modifier', () => {
      describe('with a simple notation', () => {
        const argument = `${coreTestString}L`

        test('returns a RollParameter matching the notation', () => {
          const [params] = argToParameter(argument, 1)

          expect(params).toMatchObject({
            argument,
            ...coreDicePools,
            modifiers: { drop: { lowest: 1 } },
            notation: '4d6L',
            description: ['Roll 4 6-sided dice', 'Drop lowest']
          })
        })
      })

      describe('with a complex notation', () => {
        const argument = `${coreTestString}L2`

        test('returns a RollParameter matching the notation', () => {
          const [params] = argToParameter(argument, 1)

          expect(params).toMatchObject({
            argument,
            ...coreDicePools,
            modifiers: { drop: { lowest: 2 } },
            notation: '4d6L2',
            description: ['Roll 4 6-sided dice', 'Drop lowest 2']
          })
        })
      })
    })

    describe('given a notation that contains a drop less than, greater than, and exact', () => {
      const argument = `${coreTestString}D{<2,>5,2,4}`

      test('returns a RollParameter matching the notation', () => {
        const [params] = argToParameter(argument, 1)

        expect(params).toMatchObject({
          argument,
          ...coreDicePools,
          modifiers: {
            drop: { greaterThan: 5, lessThan: 2, exact: [2, 4] }
          },
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
      const argument = `${coreTestString}C{<2,>5}`

      test('returns a RollParameter matching the notation', () => {
        const [params] = argToParameter(argument, 1)

        expect(params).toMatchObject({
          argument,
          ...coreDicePools,
          modifiers: { cap: { lessThan: 2, greaterThan: 5 } },
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
      const argument = `${coreTestString}-2`

      test('returns a RollParameter matching the notation', () => {
        const [params] = argToParameter(argument, 1)

        expect(params).toMatchObject({
          argument,
          ...coreDicePools,
          modifiers: { minus: 2 },
          notation: '4d6-2',
          description: ['Roll 4 6-sided dice', 'Subtract 2']
        })
      })
    })

    describe('given a notation that contains a plus modifier', () => {
      const argument = `${coreTestString}+2`

      test('returns a RollParameter matching the notation', () => {
        const [params] = argToParameter(argument, 1)

        expect(params).toMatchObject({
          argument,
          ...coreDicePools,
          modifiers: { plus: 2 },
          notation: '4d6+2',
          description: ['Roll 4 6-sided dice', 'Add 2']
        })
      })
    })

    describe('given a notation that contains a reroll modifier', () => {
      const argument = `${coreTestString}R{5,<6,>2}`

      test('returns a RollParameter matching the notation', () => {
        const [params] = argToParameter(argument, 1)

        expect(params).toMatchObject({
          argument,
          ...coreDicePools,
          modifiers: {
            reroll: {
              exact: [5],
              lessThan: 6,
              greaterThan: 2
            }
          },
          notation: '4d6R{5,>2,<6}',
          description: ['Roll 4 6-sided dice', 'Reroll [5], greater than [2] and less than [6]']
        })
      })
      describe('with a max modifier', () => {
        const argument = `${coreTestString}R{5,20,<6,>2}3`

        test('returns a RollParameter matching the notation', () => {
          const [params] = argToParameter(argument, 1)

          expect(params).toMatchObject({
            argument,
            ...coreDicePools,
            modifiers: {
              reroll: {
                exact: [5, 20],
                lessThan: 6,
                greaterThan: 2,
                max: 3
              }
            },
            notation: '4d6R{5,20,>2,<6}3',
            description: [
              'Roll 4 6-sided dice',
              'Reroll [5] and [20], greater than [2] and less than [6] (up to 3 times)'
            ]
          })
        })
      })
    })

    describe('given a notation that contains a unique notation', () => {
      describe('with a unique notation', () => {
        const argument = `${coreTestString}U{5,6}`

        test('returns a RollParameter matching the notation', () => {
          const [params] = argToParameter(argument, 1)

          expect(params).toMatchObject({
            argument,
            ...coreDicePools,
            modifiers: { unique: { notUnique: [5, 6] } },
            notation: '4d6U{5,6}',
            description: ['Roll 4 6-sided dice', 'No Duplicates (except [5] and [6])']
          })
        })
      })

      describe('with a repeat unique notation', () => {
        const argument = `${coreTestString}U{5,6}U`

        test('returns a RollParameter matching the notation', () => {
          const [params] = argToParameter(argument, 1)

          expect(params).toMatchObject({
            argument,
            ...coreDicePools,
            modifiers: { unique: { notUnique: [5, 6] } },
            notation: '4d6U{5,6}',
            description: ['Roll 4 6-sided dice', 'No Duplicates (except [5] and [6])']
          })
        })
      })

      describe('with a simple unique notation', () => {
        const argument = `${coreTestString}U`

        test('returns a RollParameter matching the notation', () => {
          const [params] = argToParameter(argument, 1)

          expect(params).toMatchObject({
            argument,
            ...coreDicePools,
            modifiers: { unique: true },
            notation: '4d6U',
            description: ['Roll 4 6-sided dice', 'No Duplicate Rolls']
          })
        })
      })
    })

    describe('given a notation that contains an explode modifier', () => {
      const argument = `${coreTestString}!`

      test('returns a RollParameter matching the notation', () => {
        const [params] = argToParameter(argument, 1)

        expect(params).toMatchObject({
          argument,
          ...coreDicePools,
          modifiers: { explode: true },
          notation: '4d6!',
          description: ['Roll 4 6-sided dice', 'Exploding Dice']
        })
      })
    })

    describe('given a notation that contains a replace modifier', () => {
      describe('with multiple replacements', () => {
        const argument = `${coreTestString}V{1=2,>2=6}`

        test('returns a RollParameter matching the notation', () => {
          const [params] = argToParameter(argument, 1)

          expect(params).toMatchObject({
            argument,
            ...coreDicePools,
            modifiers: {
              replace: [
                { from: 1, to: 2 },
                { from: { greaterThan: 2 }, to: 6 }
              ]
            },
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
        const argument = `${coreTestString}V{<2=6}`

        test('returns a RollParameter matching the notation', () => {
          const [params] = argToParameter(argument, 1)

          expect(params).toMatchObject({
            argument,
            ...coreDicePools,
            modifiers: { replace: [{ from: { lessThan: 2 }, to: 6 }] },
            notation: '4d6V{<2=6}',
            description: ['Roll 4 6-sided dice', 'Replace less than [2] with [6]']
          })
        })
      })
    })

    describe('With a corner case dice notation', () => {
      describe('like an ordered dice notation', () => {
        test('it produces proper organized parameters', () => {
          const explodeFirstString = '4d6!H'
          const [explodeParams] = argToParameter(explodeFirstString, 1)

          expect(explodeParams).toMatchObject({
            argument: explodeFirstString,
            ...coreDicePools,
            modifiers: { explode: true, drop: { highest: 1 } },
            notation: '4d6H!',
            description: ['Roll 4 6-sided dice', 'Drop highest', 'Exploding Dice']
          })

          const dropFirstString = '4d6H!'
          const [dropFirstParams] = argToParameter(dropFirstString, 1)

          expect(dropFirstParams).toMatchObject({
            argument: dropFirstString,
            ...coreDicePools,
            modifiers: { drop: { highest: 1 }, explode: true },
            notation: '4d6H!',
            description: ['Roll 4 6-sided dice', 'Drop highest', 'Exploding Dice']
          })
        })
      })

      describe('like a complicated dice notation', () => {
        const argument = `10d20 H2 L V{1=2,>2=6} D{<2,>5,2,4} C{<2,>18} R{5,2}3 U{5}  R{<6} ! +2 -5 +3`

        test('returns a RollParameter matching the notation', () => {
          const [params] = argToParameter(argument, 1)

          expect(params).toMatchObject({
            argument,
            quantity: 10,
            sides: 20,
            key: 'Roll 1',
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
              reroll: { exact: [5, 2], lessThan: 6, max: 3 },
              unique: { notUnique: [5] },
              explode: true,
              plus: 5,
              minus: 5
            },
            notation: '10d20C{>18,<2}H2LD{>5,<2,2,4}V{1=2,>2=6}R{5,2,<6}3!U{5}+5-5',
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

  describe('given Single-String Multi Dice Notation', () => {
    const argument = '1d20+2d6-1d8'

    test('returns a RollParameter matching the notation', () => {
      const params = argToParameter(argument, 1)

      expect(params).toMatchObject([
        {
          argument,
          quantity: 1,
          sides: 20,
          notation: '1d20',
          description: ['Roll 1 20-sided die'],
          arithmetic: 'add'
        },
        {
          argument,
          quantity: 2,
          sides: 6,
          notation: '2d6',
          description: ['Roll 2 6-sided dice'],
          arithmetic: 'add'
        },
        {
          argument,
          quantity: 1,
          sides: 8,
          notation: '-1d8',
          description: ['Roll 1 8-sided die', 'and Subtract the result'],
          arithmetic: 'subtract'
        }
      ])
    })
  })

  describe('given custom faces', () => {
    const argument = {
      sides: ['a', 'b', 'c', 'd', 'e', 'f']
    }

    test('returns a RollParameter matching the argument', () => {
      const [params] = argToParameter(argument, 1)

      expect(params).toMatchObject({
        argument,
        quantity: 1,
        sides: 6,
        notation: '1d6',
        faces: ['a', 'b', 'c', 'd', 'e', 'f'],
        description: ['Roll 1 Dice with the following sides: a, b, c, d, e, f']
      })
    })
  })
})
