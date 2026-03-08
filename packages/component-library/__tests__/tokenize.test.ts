import { describe, expect, test } from 'bun:test'
import { tokenize } from '../src/components/RollerPlayground/tokenize'

describe('tokenize — compound notation', () => {
  test('1d6+1d20 produces two core tokens', () => {
    const tokens = tokenize('1d6+1d20')
    expect(tokens).toHaveLength(2)
    expect(tokens[0]).toMatchObject({ type: 'core', text: '1d6', start: 0, end: 3 })
    expect(tokens[1]).toMatchObject({ type: 'core', text: '+1d20', start: 3, end: 8 })
  })

  test('1d6+5 still treats +5 as arithmetic (not a pool)', () => {
    const tokens = tokenize('1d6+5')
    expect(tokens).toHaveLength(2)
    expect(tokens[0]).toMatchObject({ type: 'core', text: '1d6' })
    expect(tokens[1]).toMatchObject({ type: 'plus', text: '+5' })
  })

  test('1d6+1d20L produces core, core, dropLowest', () => {
    const tokens = tokenize('1d6+1d20L')
    expect(tokens).toHaveLength(3)
    expect(tokens[0]).toMatchObject({ type: 'core', text: '1d6', start: 0, end: 3 })
    expect(tokens[1]).toMatchObject({ type: 'core', text: '+1d20', start: 3, end: 8 })
    expect(tokens[2]).toMatchObject({ type: 'dropLowest', text: 'L', start: 8, end: 9 })
  })

  test('second core description is english', () => {
    const tokens = tokenize('1d6+1d20')
    expect(tokens[1]?.description).toBe('Roll 1 20-sided die')
  })
})
