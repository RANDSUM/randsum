import { describe, expect, test } from 'bun:test'
import { buildNotationPattern, parseModifiers } from '../../src/notation/parse/parseModifiers'
import { singleNotationToOptions } from '../../src/notation/parse/singleNotationToOptions'

describe('parseModifiers', () => {
  test('parses empty string', () => {
    expect(parseModifiers('')).toEqual({})
  })

  test('parses single modifier', () => {
    expect(parseModifiers('L')).toEqual({ drop: { lowest: 1 } })
  })

  test('parses multiple modifiers combined', () => {
    const result = parseModifiers('LR{1}!+3')
    expect(result.drop).toEqual({ lowest: 1 })
    expect(result.reroll).toEqual({ exact: [1] })
    expect(result.explode).toBe(true)
    expect(result.plus).toBe(3)
  })

  test('parses keep modifier', () => {
    expect(parseModifiers('K')).toEqual({ keep: { highest: 1 } })
  })

  test('parses cap modifier', () => {
    expect(parseModifiers('C{>5}')).toEqual({ cap: { greaterThan: 5 } })
  })

  test('parses compound modifier', () => {
    expect(parseModifiers('!!')).toEqual({ compound: true })
  })

  test('parses penetrate modifier', () => {
    expect(parseModifiers('!p')).toEqual({ penetrate: true })
  })

  test('parses unique modifier', () => {
    expect(parseModifiers('U')).toEqual({ unique: true })
  })

  test('parses replace modifier', () => {
    expect(parseModifiers('V{1=6}')).toEqual({
      replace: [{ from: 1, to: 6 }]
    })
  })

  test('parses minus modifier', () => {
    expect(parseModifiers('-3')).toEqual({ minus: 3 })
  })

  test('parses multiply modifier', () => {
    expect(parseModifiers('*3')).toEqual({ multiply: 3 })
  })

  test('parses multiplyTotal modifier', () => {
    expect(parseModifiers('**3')).toEqual({ multiplyTotal: 3 })
  })

  test('parses countSuccesses modifier (desugars to count)', () => {
    expect(parseModifiers('S{5}')).toEqual({
      count: { greaterThanOrEqual: 5 }
    })
  })
})

describe('buildNotationPattern', () => {
  test('returns a RegExp', () => {
    const pattern = buildNotationPattern()
    expect(pattern).toBeInstanceOf(RegExp)
  })

  test('pattern has global flag', () => {
    const pattern = buildNotationPattern()
    expect(pattern.flags).toContain('g')
  })

  test('matches modifier notations', () => {
    const pattern = buildNotationPattern()
    expect('L'.match(pattern)).not.toBeNull()
    expect('+5'.match(pattern)).not.toBeNull()
    expect('!!'.match(pattern)).not.toBeNull()
  })
})

describe('singleNotationToOptions', () => {
  test('parses basic notation', () => {
    const result = singleNotationToOptions('2d6')
    expect(result.quantity).toBe(2)
    expect(result.sides).toBe(6)
    expect(result.arithmetic).toBe('add')
    expect(result.modifiers).toBeUndefined()
  })

  test('parses 1d20', () => {
    const result = singleNotationToOptions('1d20')
    expect(result.quantity).toBe(1)
    expect(result.sides).toBe(20)
  })

  test('parses with drop lowest modifier', () => {
    const result = singleNotationToOptions('4d6L')
    expect(result.quantity).toBe(4)
    expect(result.sides).toBe(6)
    expect(result.modifiers?.drop).toEqual({ lowest: 1 })
  })

  test('parses with plus modifier', () => {
    const result = singleNotationToOptions('1d20+5')
    expect(result.quantity).toBe(1)
    expect(result.sides).toBe(20)
    expect(result.modifiers?.plus).toBe(5)
  })

  test('parses negative (subtract) notation', () => {
    const result = singleNotationToOptions('-1d6')
    expect(result.quantity).toBe(1)
    expect(result.sides).toBe(6)
    expect(result.arithmetic).toBe('subtract')
  })

  test('parses with multiple modifiers', () => {
    const result = singleNotationToOptions('4d6L+3')
    expect(result.quantity).toBe(4)
    expect(result.sides).toBe(6)
    expect(result.modifiers?.drop).toEqual({ lowest: 1 })
    expect(result.modifiers?.plus).toBe(3)
  })

  test('parses with keep highest modifier', () => {
    const result = singleNotationToOptions('2d20K')
    expect(result.quantity).toBe(2)
    expect(result.sides).toBe(20)
    expect(result.modifiers?.keep).toEqual({ highest: 1 })
  })

  test('parses with explode modifier', () => {
    const result = singleNotationToOptions('2d6!')
    expect(result.quantity).toBe(2)
    expect(result.sides).toBe(6)
    expect(result.modifiers?.explode).toBe(true)
  })

  test('parses with reroll modifier', () => {
    const result = singleNotationToOptions('2d6R{1}')
    expect(result.quantity).toBe(2)
    expect(result.sides).toBe(6)
    expect(result.modifiers?.reroll).toEqual({ exact: [1] })
  })

  test('parses with unique modifier', () => {
    const result = singleNotationToOptions('6d6U')
    expect(result.quantity).toBe(6)
    expect(result.sides).toBe(6)
    expect(result.modifiers?.unique).toBe(true)
  })

  test('trims whitespace', () => {
    const result = singleNotationToOptions('  2d6  ')
    expect(result.quantity).toBe(2)
    expect(result.sides).toBe(6)
  })

  test('parses uppercase D', () => {
    const result = singleNotationToOptions('2D6')
    expect(result.quantity).toBe(2)
    expect(result.sides).toBe(6)
  })
})
