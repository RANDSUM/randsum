import { afterEach, describe, expect, test } from 'bun:test'
import { roll } from '@randsum/roller/roll'
import { notation as toNotation } from '@randsum/roller/validate'
import { lanesOr, renderLanes } from '../../../src/commands/lib/lanes'

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
    expect(lanesFor('2d6!', [6, 3, 2])).toBe(
      [
        '```',
        '• 6     3',
        '! 6→ 2  │',
        '───────────────',
        'R 6  2  3  = 11',
        '```',
        '-# `!` Explode'
      ].join('\n')
    )
  })

  test('a removed die runs a dashed line down to the step that takes it', () => {
    const text = lanesFor('3d6R{1}L', [1, 2, 5, 4])
    expect(text).toContain('• 1  2  5\nR 4  ╎  │\nL │  2  │\n')
    expect(text).toContain('R 4     5  = 9')
    expect(text).toContain('-# `R` Reroll Exactly 1  ·  `L` Drop Lowest 1')
  })

  test('an unchanged roll is just its dice, with no Result row or key', () => {
    expect(lanesFor('2d6', [4, 1])).toBe('```\n• 4  1\n```')
  })

  test('a grid wider than a phone gets no lanes', () => {
    rigD6(Array.from({ length: 30 }, () => 3))
    const record = roll(toNotation('30d6')).rolls[0]
    expect(record).toBeDefined()
    expect(record === undefined ? undefined : renderLanes(record)).toBeUndefined()
  })

  test('a game roll gets lanes only when a step changed its dice', () => {
    rigD6([2, 5, 4])
    const kept = roll(toNotation('3d6L')).rolls
    expect(lanesOr({ rolls: kept }, ['fallback']).join('\n')).toContain('-# `L` Drop Lowest 1')
    rigD6([2, 5])
    const plain = roll(toNotation('2d6')).rolls
    expect(lanesOr({ rolls: plain }, ['fallback'])).toEqual(['fallback'])
    expect(lanesOr({ rolls: [...kept, ...plain] }, ['fallback'])).toEqual(['fallback'])
  })
})
