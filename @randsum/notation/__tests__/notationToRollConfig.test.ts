import { describe, expect, it } from 'bun:test'
import { notationToRollConfig } from '../src'

describe('notationToRollConfig', () => {
  it('converts the notation to a roll config', () => {
    const notation = `10d20 H2 L V{1=2,>2=6} D{<2,>5,2,4} C{<2,>18} R{5,2}3 U{5}  R{<6} ! +2 -5 +3`

    const config = notationToRollConfig(notation)

    expect(config).toEqual({
      modifiers: {
        cap: {
          greaterThan: 18,
          lessThan: 2
        },
        drop: {
          exact: [2, 4],
          greaterThan: 5,
          highest: 2,
          lessThan: 2,
          lowest: 1
        },
        explode: true,
        subtract: 5,
        add: 5,
        replace: [
          {
            from: 1,
            to: 2
          },
          {
            from: {
              greaterThan: 2
            },
            to: 6
          }
        ],
        reroll: {
          exact: [5, 2],
          lessThan: 6,
          maxReroll: 3
        },
        unique: {
          notUnique: [5]
        }
      },
      quantity: 10,
      sides: 20
    })
  })
})
