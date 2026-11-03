import { describe, expect, test } from 'bun:test'
import { roll } from '../../src'
import { traceRoll } from '../../src/trace'

// A description lists each step in the order the roll applies it, so it reads
// the same way as the trace and the canonical notation.
describe('description order', () => {
  test('Drop describes conditions, then lowest, then highest, as it applies them', () => {
    const { rolls } = roll({
      sides: 6,
      quantity: 6,
      modifiers: { drop: { highest: 1, lowest: 1, exact: [3] } }
    })
    const [record] = rolls
    expect(record?.description).toEqual([
      'Roll 6 6-sided dice',
      'Drop 3',
      'Drop lowest',
      'Drop highest'
    ])
    expect(record?.notation).toBe('6d6D{3}LH')
  })

  test('written H before L still reads lowest first, like the trace', () => {
    const [record] = roll('4d6HL').rolls
    expect(record?.description).toEqual(['Roll 4 6-sided dice', 'Drop lowest', 'Drop highest'])
    const labels =
      record === undefined
        ? []
        : traceRoll(record).flatMap(step =>
            step.kind === 'rolls' && step.label.startsWith('Drop') ? [step.label] : []
          )
    expect(labels).toEqual(['Drop Lowest 1', 'Drop Highest 1'])
  })

  test('Cap describes upper bounds before lower bounds', () => {
    const [record] = roll('4d6C{<2,4}').rolls
    expect(record?.description).toEqual([
      'Roll 4 6-sided dice',
      'No Rolls Greater Than 4',
      'No Rolls less than 2'
    ])
  })

  test('modifiers follow execution order, not written order', () => {
    const [record] = roll('4d6L!+2').rolls
    expect(record?.description).toEqual([
      'Roll 4 6-sided dice',
      'Exploding Dice',
      'Drop lowest',
      'Add 2'
    ])
  })
})
