import { describe, expect, test } from 'bun:test'
import { formDicePools } from '../src'

describe('formDicePools', () => {
  test('returns an object with each argument transformed into a standalone key', () => {
    const args = [1, 2, 3, 4, 5]
    const transformer = (arg: number) => arg * 2
    const result = formDicePools(args, transformer)

    expect(Object.keys(result)).toHaveLength(args.length)
    expect(Object.values(result)).toEqual([2, 4, 6, 8, 10])
  })
})
