import { describe, expect, test } from 'bun:test'
import { checkNotation, describe as describeLines, rollNotation } from '../src/core/check'

describe('checkNotation', () => {
  test('empty notation is empty, not invalid', () => {
    expect(checkNotation('')).toEqual({ kind: 'empty' })
    expect(checkNotation('   ')).toEqual({ kind: 'empty' })
  })

  test('valid notation carries its English description', () => {
    expect(checkNotation('4d6L+2')).toEqual({
      kind: 'valid',
      description: 'Roll 4 6-sided dice, Drop lowest, Add 2'
    })
  })

  test('invalid notation names the character the parser stopped at', () => {
    expect(checkNotation('4d6Lq+2')).toEqual({
      kind: 'invalid',
      message: 'Can’t read “q” at character 5.',
      position: 4
    })
  })

  test('notation that parses but cannot roll says why', () => {
    expect(checkNotation('1d20L')).toEqual({
      kind: 'invalid',
      message: 'Cannot drop 1 dice from a pool of 1'
    })
  })
})

describe('describe', () => {
  test('joins clauses with commas and pools with a plus', () => {
    expect(describeLines([['Roll 1 20-sided die', 'Add 5'], ['Roll 1 8-sided die']])).toBe(
      'Roll 1 20-sided die, Add 5 + Roll 1 8-sided die'
    )
  })
})

describe('rollNotation', () => {
  test('rolls valid notation and refuses the rest', () => {
    const result = rollNotation('2d6+3')
    expect(result?.notation).toBe('2d6+3')
    expect(result?.total).toBeGreaterThanOrEqual(5)
    expect(result?.total).toBeLessThanOrEqual(15)
    expect(rollNotation('zzz')).toBeNull()
  })
})
