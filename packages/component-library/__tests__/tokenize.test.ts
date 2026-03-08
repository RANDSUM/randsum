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

describe('tokenize — bare drop/keep suffixes (no number)', () => {
  test('H alone → dropHighest with "Drop highest" description', () => {
    const tokens = tokenize('1d6H')
    const t = tokens.find(t => t.type === 'dropHighest')
    expect(t).toBeDefined()
    expect(t?.description).toBe('Drop highest')
    expect(t?.text).toBe('H')
  })

  test('KL alone → keepLowest with "Drop lowest, Keep lowest" description', () => {
    const tokens = tokenize('1d6KL')
    const t = tokens.find(t => t.type === 'keepLowest')
    expect(t).toBeDefined()
    expect(t?.description).toBe('Drop lowest, Keep lowest')
    expect(t?.text).toBe('KL')
  })

  test('K alone → keepHighest with "Keep highest" description', () => {
    const tokens = tokenize('1d6K')
    const t = tokens.find(t => t.type === 'keepHighest')
    expect(t).toBeDefined()
    expect(t?.description).toBe('Keep highest')
    expect(t?.text).toBe('K')
  })
})

describe('tokenize — reroll inner condition extraction', () => {
  test('R{<3} → description is "Reroll <3"', () => {
    const tokens = tokenize('1d6R{<3}')
    const t = tokens.find(t => t.type === 'reroll')
    expect(t).toBeDefined()
    expect(t?.description).toBe('Reroll less than [3]')
  })

  test('R{1,2} → description is "Reroll 1,2"', () => {
    const tokens = tokenize('1d6R{1,2}')
    const t = tokens.find(t => t.type === 'reroll')
    expect(t?.description).toBe('Reroll [1] and [2]')
  })
})

describe('tokenize — unknown tokens and appendUnknown', () => {
  test('unrecognized char after core becomes unknown token', () => {
    const tokens = tokenize('1d6@')
    const t = tokens.find(t => t.type === 'unknown')
    expect(t).toBeDefined()
    expect(t?.text).toBe('@')
  })

  test('consecutive unknown chars after core are merged into one token', () => {
    const tokens = tokenize('1d6@@')
    const unknowns = tokens.filter(t => t.type === 'unknown')
    expect(unknowns).toHaveLength(1)
    expect(unknowns[0]?.text).toBe('@@')
  })

  test('notation with no core token: all chars become one merged unknown token', () => {
    const tokens = tokenize('@@@@')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]?.type).toBe('unknown')
    expect(tokens[0]?.text).toBe('@@@@')
  })
})
