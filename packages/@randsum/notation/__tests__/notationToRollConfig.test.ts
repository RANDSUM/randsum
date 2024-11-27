import { describe, expect, it } from 'bun:test'
import type { DiceNotation } from '@randsum/core'
import { notationToRollConfig } from '../src'

describe('notationToRollConfig', () => {
  it('converts the notation to a roll config', () => {
    const notation1 = `200d20C{<1,>199}HL5D{3,<2,>199}V{1=20}R{3,>10}2!uU{1,2,3}+2-5`
    const config1 = notationToRollConfig(notation1)

    expect(config1).toEqual({
      quantity: 200,
      sides: 20,
      modifiers: {
        add: 2,
        subtract: 5,
        drop: {
          greaterThan: 199,
          lessThan: 2,
          highest: 1,
          lowest: 5,
          exact: [3]
        },
        replace: [{ from: 1, to: 20 }],
        reroll: { greaterThan: 10, maxReroll: 2, exact: [3] },
        unique: { notUnique: [1, 2, 3] },
        cap: { lessThan: 1, greaterThan: 199 },
        explode: true
      }
    })

    const notation2 = `20d200u{1}UR{<2}3V{>2=1}V{<2=1}`
    const config2 = notationToRollConfig(notation2)

    expect(config2).toEqual({
      quantity: 20,
      sides: 200,
      modifiers: {
        unique: { notUnique: [1] },
        reroll: {
          lessThan: 2,
          maxReroll: 3
        },
        replace: [
          {
            from: {
              greaterThan: 2
            },
            to: 1
          },
          {
            from: {
              lessThan: 2
            },
            to: 1
          }
        ]
      }
    })
  })

  const notation3: DiceNotation = `10d20 H2 L V{1=2,>2=6} D{<2,>5,2,4} C{<2,>18} R{5,2}3 U{5}  R{<6} ! +2 -5 +3`
  const config3 = notationToRollConfig(notation3)

  expect(config3).toEqual({
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
      add: 5,
      subtract: 5
    }
  })
})
