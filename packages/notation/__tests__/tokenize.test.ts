import { describe, expect, test } from 'bun:test'
import { tokenize } from '@randsum/notation/tokenize'

describe('tokenize', () => {
  test('returns empty array for empty string', () => {
    expect(tokenize('')).toEqual([])
  })

  test('tokenizes basic notation as core', () => {
    const tokens = tokenize('2d6')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]?.type).toBe('core')
    expect(tokens[0]?.text).toBe('2d6')
    expect(tokens[0]?.start).toBe(0)
    expect(tokens[0]?.end).toBe(3)
  })

  test('tokenizes drop lowest', () => {
    const tokens = tokenize('4d6L')
    expect(tokens).toHaveLength(2)
    expect(tokens[0]?.type).toBe('core')
    expect(tokens[1]?.type).toBe('dropLowest')
    expect(tokens[1]?.text).toBe('L')
  })

  test('tokenizes drop highest', () => {
    const tokens = tokenize('2d20H')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.type).toBe('dropHighest')
    expect(tokens[1]?.text).toBe('H')
  })

  test('tokenizes explode', () => {
    const tokens = tokenize('3d6!')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.type).toBe('explode')
    expect(tokens[1]?.text).toBe('!')
  })

  test('tokenizes compound', () => {
    const tokens = tokenize('3d6!!')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.type).toBe('compound')
    expect(tokens[1]?.text).toBe('!!')
  })

  test('tokenizes penetrate', () => {
    const tokens = tokenize('3d6!p')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.type).toBe('penetrate')
    expect(tokens[1]?.text).toBe('!p')
  })

  test('tokenizes plus modifier', () => {
    const tokens = tokenize('1d20+5')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.type).toBe('plus')
    expect(tokens[1]?.text).toBe('+5')
  })

  test('tokenizes minus modifier', () => {
    const tokens = tokenize('2d8-2')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.type).toBe('minus')
    expect(tokens[1]?.text).toBe('-2')
  })

  test('tokenizes reroll', () => {
    const tokens = tokenize('4d6R{1}')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.type).toBe('reroll')
    expect(tokens[1]?.text).toBe('R{1}')
  })

  test('tokenizes cap', () => {
    const tokens = tokenize('4d20C{>18}')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.type).toBe('cap')
    expect(tokens[1]?.text).toBe('C{>18}')
  })

  test('tokenizes replace', () => {
    const tokens = tokenize('3d6V{1=6}')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.type).toBe('replace')
    expect(tokens[1]?.text).toBe('V{1=6}')
  })

  test('tokenizes unique', () => {
    const tokens = tokenize('5d20U')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.type).toBe('unique')
    expect(tokens[1]?.text).toBe('U')
  })

  test('tokenizes keep highest', () => {
    const tokens = tokenize('4d6K3')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.type).toBe('keepHighest')
    expect(tokens[1]?.text).toBe('K3')
  })

  test('tokenizes keep lowest', () => {
    const tokens = tokenize('4d6kl2')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.type).toBe('keepLowest')
    expect(tokens[1]?.text).toBe('kl2')
  })

  test('tokenizes multiply', () => {
    const tokens = tokenize('2d6*3')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.type).toBe('multiply')
    expect(tokens[1]?.text).toBe('*3')
  })

  test('tokenizes multiplyTotal', () => {
    const tokens = tokenize('2d6**3')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.type).toBe('multiplyTotal')
    expect(tokens[1]?.text).toBe('**3')
  })

  test('tokenizes countSuccesses', () => {
    const tokens = tokenize('4d6S{5}')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.type).toBe('countSuccesses')
    expect(tokens[1]?.text).toBe('S{5}')
  })

  test('tokenizes multiple modifiers', () => {
    const tokens = tokenize('4d6LR{1}!+3')
    expect(tokens.length).toBeGreaterThanOrEqual(4)
    const types = tokens.map(t => t.type)
    expect(types).toContain('core')
    expect(types).toContain('dropLowest')
    expect(types).toContain('reroll')
    expect(types).toContain('explode')
    expect(types).toContain('plus')
  })

  test('handles unknown characters', () => {
    const tokens = tokenize('2d6@')
    const unknownToken = tokens.find(t => t.type === 'unknown')
    expect(unknownToken).toBeDefined()
    expect(unknownToken?.text).toBe('@')
  })

  test('merges consecutive unknown characters', () => {
    const tokens = tokenize('2d6@@')
    const unknownTokens = tokens.filter(t => t.type === 'unknown')
    expect(unknownTokens).toHaveLength(1)
    expect(unknownTokens[0]?.text).toBe('@@')
  })

  test('tokenizes multi-dice notation with + prefix', () => {
    const tokens = tokenize('1d20+2d6')
    const coreTokens = tokens.filter(t => t.type === 'core')
    expect(coreTokens).toHaveLength(2)
  })

  test('tokenizes multi-dice notation with - prefix', () => {
    const tokens = tokenize('1d20-1d4')
    const coreTokens = tokens.filter(t => t.type === 'core')
    expect(coreTokens).toHaveLength(2)
  })

  test('includes description for core token', () => {
    const tokens = tokenize('2d6')
    expect(tokens[0]?.description).toContain('Roll 2 6-sided dice')
  })

  test('includes description for modifier tokens', () => {
    const tokens = tokenize('4d6L')
    const dropToken = tokens.find(t => t.type === 'dropLowest')
    expect(dropToken?.description).toBeTruthy()
  })

  test('handles no core match at start', () => {
    const tokens = tokenize('L')
    expect(tokens.length).toBeGreaterThanOrEqual(1)
  })

  test('tokenizes compound with depth', () => {
    const tokens = tokenize('2d6!!3')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.type).toBe('compound')
    expect(tokens[1]?.text).toBe('!!3')
  })

  test('tokenizes penetrate with depth', () => {
    const tokens = tokenize('2d6!p3')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.type).toBe('penetrate')
    expect(tokens[1]?.text).toBe('!p3')
  })

  test('tokenizes drop with count', () => {
    const tokens = tokenize('5d6L2')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.type).toBe('dropLowest')
    expect(tokens[1]?.text).toBe('L2')
  })

  test('tokenizes unique with exceptions', () => {
    const tokens = tokenize('5d6U{1,6}')
    expect(tokens).toHaveLength(2)
    expect(tokens[1]?.type).toBe('unique')
    expect(tokens[1]?.text).toBe('U{1,6}')
  })
})
