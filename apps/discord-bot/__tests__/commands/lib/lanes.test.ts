import { afterEach, describe, expect, test } from 'bun:test'
import { roll } from '@randsum/roller/roll'
import { notation as toNotation } from '@randsum/roller/validate'
import { renderLanes } from '../../../src/commands/lib/lanes'

const realRandom = Math.random

/** Makes the next d6 rolls come up as `faces`, in order. */
function rigD6(faces: readonly number[]): void {
  const queue = [...faces]
  Math.random = () => ((queue.shift() ?? 1) - 0.5) / 6
}

function lanesFor(notation: string, faces: readonly number[]): string {
  rigD6(faces)
  const record = roll(toNotation(notation)).rolls[0]
  if (record === undefined) throw new Error('no pool')
  return (renderLanes(record) ?? []).join('\n')
}

afterEach(() => {
  Math.random = realRandom
})

describe('renderLanes', () => {
  test('an explosion joins its dice with a plain arrow in the next lane', () => {
    const text = lanesFor('2d6!', [6, 3, 2])
    expect(text).toContain('6       3  Initial Rolls')
    expect(text).toContain('6 → 2   │  Explode')
    expect(text).toContain('6   2   3  Result')
  })

  test('a removed die runs a dashed line down to the step that takes it', () => {
    const text = lanesFor('3d6R{1}L', [1, 2, 5, 4])
    expect(text).toContain('1   2   5  Initial Rolls')
    expect(text).toContain('4   ╎   │  Reroll Exactly 1')
    expect(text).toContain('│   2   │  Drop Lowest 1')
    expect(text).toContain('4       5  Result')
  })

  test('an unchanged roll is just its dice, with no Result row', () => {
    expect(lanesFor('2d6', [4, 1])).toBe('```\n4   1  Initial Rolls\n```')
  })

  test('a grid wider than a phone gets no lanes', () => {
    rigD6(Array.from({ length: 30 }, () => 3))
    const record = roll(toNotation('30d6')).rolls[0]
    expect(record).toBeDefined()
    expect(record === undefined ? undefined : renderLanes(record)).toBeUndefined()
  })
})
