import { describe, expect, test } from 'bun:test'
import { notationToOptions } from '../../src/notation/parse/notationToOptions'
import { modifiersOf } from '../support/modifiersOf'

describe('modifier parsing', () => {
  test('a pool without modifiers parses to no modifiers', () => {
    expect(modifiersOf('1d6')).toEqual({})
  })

  test('parses single modifier', () => {
    expect(modifiersOf('1d6L')).toEqual({ drop: { lowest: 1 } })
  })

  test('parses multiple modifiers combined', () => {
    const result = modifiersOf('1d6LR{1}!+3')
    expect(result.drop).toEqual({ lowest: 1 })
    expect(result.reroll).toEqual({ exact: [1] })
    expect(result.explode).toBe(true)
    expect(result.plus).toBe(3)
  })

  test('parses keep modifier', () => {
    expect(modifiersOf('1d6K')).toEqual({ keep: { highest: 1 } })
  })

  test('parses cap modifier', () => {
    expect(modifiersOf('1d6C{>5}')).toEqual({ cap: { greaterThan: 5 } })
  })

  test('parses compound modifier', () => {
    expect(modifiersOf('1d6!!')).toEqual({ compound: true })
  })

  test('parses penetrate modifier', () => {
    expect(modifiersOf('1d6!p')).toEqual({ penetrate: true })
  })

  test('parses unique modifier', () => {
    expect(modifiersOf('1d6U')).toEqual({ unique: true })
  })

  test('parses replace modifier', () => {
    expect(modifiersOf('1d6V{1=6}')).toEqual({
      replace: [{ from: 1, to: 6 }]
    })
  })

  test('parses minus modifier', () => {
    expect(modifiersOf('1d6-3')).toEqual({ minus: 3 })
  })

  test('parses multiply modifier', () => {
    expect(modifiersOf('1d6*3')).toEqual({ multiply: 3 })
  })

  test('parses multiplyTotal modifier', () => {
    expect(modifiersOf('1d6**3')).toEqual({ multiplyTotal: 3 })
  })

  test('parses countSuccesses modifier (desugars to count)', () => {
    expect(modifiersOf('1d6S{5}')).toEqual({
      count: { greaterThanOrEqual: 5 }
    })
  })
})

describe('single-pool notationToOptions', () => {
  test('parses basic notation', () => {
    const [result] = notationToOptions('2d6')
    expect(result?.quantity).toBe(2)
    expect(result?.sides).toBe(6)
    expect(result?.arithmetic).toBe('add')
    expect(result?.modifiers).toBeUndefined()
  })

  test('parses 1d20', () => {
    const [result] = notationToOptions('1d20')
    expect(result?.quantity).toBe(1)
    expect(result?.sides).toBe(20)
  })

  test('parses with drop lowest modifier', () => {
    const [result] = notationToOptions('4d6L')
    expect(result?.quantity).toBe(4)
    expect(result?.sides).toBe(6)
    expect(result?.modifiers?.drop).toEqual({ lowest: 1 })
  })

  test('parses with plus modifier', () => {
    const [result] = notationToOptions('1d20+5')
    expect(result?.quantity).toBe(1)
    expect(result?.sides).toBe(20)
    expect(result?.modifiers?.plus).toBe(5)
  })

  test('parses negative (subtract) notation', () => {
    const [result] = notationToOptions('-1d6')
    expect(result?.quantity).toBe(1)
    expect(result?.sides).toBe(6)
    expect(result?.arithmetic).toBe('subtract')
  })

  test('parses with multiple modifiers', () => {
    const [result] = notationToOptions('4d6L+3')
    expect(result?.quantity).toBe(4)
    expect(result?.sides).toBe(6)
    expect(result?.modifiers?.drop).toEqual({ lowest: 1 })
    expect(result?.modifiers?.plus).toBe(3)
  })

  test('parses with keep highest modifier', () => {
    const [result] = notationToOptions('2d20K')
    expect(result?.quantity).toBe(2)
    expect(result?.sides).toBe(20)
    expect(result?.modifiers?.keep).toEqual({ highest: 1 })
  })

  test('parses with explode modifier', () => {
    const [result] = notationToOptions('2d6!')
    expect(result?.quantity).toBe(2)
    expect(result?.sides).toBe(6)
    expect(result?.modifiers?.explode).toBe(true)
  })

  test('parses with reroll modifier', () => {
    const [result] = notationToOptions('2d6R{1}')
    expect(result?.quantity).toBe(2)
    expect(result?.sides).toBe(6)
    expect(result?.modifiers?.reroll).toEqual({ exact: [1] })
  })

  test('parses with unique modifier', () => {
    const [result] = notationToOptions('6d6U')
    expect(result?.quantity).toBe(6)
    expect(result?.sides).toBe(6)
    expect(result?.modifiers?.unique).toBe(true)
  })

  test('trims whitespace', () => {
    const [result] = notationToOptions('  2d6  ')
    expect(result?.quantity).toBe(2)
    expect(result?.sides).toBe(6)
  })

  test('parses uppercase D', () => {
    const [result] = notationToOptions('2D6')
    expect(result?.quantity).toBe(2)
    expect(result?.sides).toBe(6)
  })
})
