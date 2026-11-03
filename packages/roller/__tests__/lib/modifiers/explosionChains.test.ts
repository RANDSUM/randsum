import { describe, expect, test } from 'bun:test'
import { roll } from '../../../src'
import type { DiceNotation } from '../../../src'
import { traceRoll } from '../../../src/trace'

/** A randomFn that rolls these faces, in order, on dice of `sides` */
function faces(sides: number, values: readonly number[]): () => number {
  const queue = [...values]
  return () => {
    const next = queue.shift()
    if (next === undefined) throw new Error('ran out of faces')
    return (next - 1 + 0.5) / sides
  }
}

function logOf(notation: DiceNotation, sides: number, values: readonly number[], modifier: string) {
  const [record] = roll(notation, { randomFn: faces(sides, values) }).rolls
  return record?.modifierLogs.find(log => log.modifier === modifier)
}

describe('explosion chains in the modifier log', () => {
  test('explode records which die started which chain, in order', () => {
    // 3d6! rolls 6, 2, 6; the first 6 chains 6 then 1, the second rolls a 4
    const log = logOf('3d6!', 6, [6, 2, 6, 6, 1, 4], 'explode')
    expect(log?.explosions).toEqual([
      { from: 6, rolls: [6, 1] },
      { from: 6, rolls: [4] }
    ])
    expect([...(log?.added ?? [])].sort()).toEqual([1, 4, 6])
  })

  test('a roll that does not explode has no explosions', () => {
    const log = logOf('3d6!', 6, [1, 2, 3], 'explode')
    expect(log?.explosions).toBeUndefined()
  })

  test('a conditional explode chains on its condition', () => {
    const log = logOf('2d6!{>4}', 6, [5, 1, 6, 2], 'explode')
    expect(log?.explosions).toEqual([{ from: 5, rolls: [6, 2] }])
  })

  test('compound folds the chain into one die', () => {
    const log = logOf('1d6!!', 6, [6, 6, 3], 'compound')
    expect(log?.explosions).toEqual([{ from: 6, rolls: [6, 3], to: 15 }])
  })

  test('penetrate folds the chain, less one per extra die', () => {
    const log = logOf('1d6!p', 6, [6, 6, 3], 'penetrate')
    expect(log?.explosions).toEqual([{ from: 6, rolls: [6, 3], to: 13 }])
  })

  test('explode sequence records the dice of each size', () => {
    // 1d6!s{6,8}: a 6 rolls a d6 (6, max), then a d8 (2)
    const queue = [6, 6, 2]
    const sizes = [6, 6, 8]
    const randomFn = (): number => {
      const value = queue.shift() ?? 1
      const size = sizes.shift() ?? 6
      return (value - 1 + 0.5) / size
    }
    const [record] = roll('1d6!s{6,8}', { randomFn }).rolls
    const log = record?.modifierLogs.find(l => l.modifier === 'explodeSequence')
    expect(log?.explosions).toEqual([{ from: 6, rolls: [6, 2] }])
  })

  test('the wild die records its compounding chain', () => {
    const log = logOf('3d6W', 6, [2, 4, 6, 6, 1], 'wildDie')
    expect(log?.explosions).toEqual([{ from: 6, rolls: [6, 1], to: 13 }])
  })

  test('traceRoll carries the chains onto the step', () => {
    const [record] = roll('2d6!', { randomFn: faces(6, [6, 3, 6, 2]) }).rolls
    if (record === undefined) throw new Error('no record')
    const step = traceRoll(record).find(s => s.kind === 'rolls' && s.label === 'Explode')
    expect(step).toMatchObject({ explosions: [{ from: 6, rolls: [6, 2] }] })
  })
})
