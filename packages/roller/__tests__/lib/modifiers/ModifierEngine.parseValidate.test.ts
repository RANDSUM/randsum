import { describe, expect, test } from 'bun:test'
import { validateModifiers } from '../../../src/modifiers/registry'
import { parseModifiers } from '../../../src/notation/parse/parseModifiers'

describe('parseModifiers', () => {
  test('parses plus modifier from notation', () => {
    const result = parseModifiers('2d6+5')
    expect(result.plus).toBe(5)
  })

  test('parses minus modifier from notation', () => {
    const result = parseModifiers('2d6-3')
    expect(result.minus).toBe(3)
  })

  test('parses drop lowest from notation', () => {
    const result = parseModifiers('4d6L')
    expect(result.drop).toEqual({ lowest: 1 })
  })

  test('parses drop highest from notation', () => {
    const result = parseModifiers('2d20H')
    expect(result.drop).toEqual({ highest: 1 })
  })

  test('parses keep highest from notation', () => {
    const result = parseModifiers('2d20K')
    expect(result.keep).toEqual({ highest: 1 })
  })

  test('parses explode from notation', () => {
    const result = parseModifiers('3d6!')
    expect(result.explode).toBe(true)
  })

  test('parses unique from notation', () => {
    const result = parseModifiers('4d6U')
    expect(result.unique).toBe(true)
  })

  test('parses reroll from notation', () => {
    const result = parseModifiers('4d6R{1}')
    expect(result.reroll).toEqual({ exact: [1] })
  })

  test('parses cap from notation', () => {
    const result = parseModifiers('3d6C{>5}')
    expect(result.cap).toEqual({ greaterThan: 5 })
  })

  test('parses replace from notation', () => {
    const result = parseModifiers('4d6V{1=6}')
    // Replace modifier returns an array of rules
    expect(result.replace).toEqual([{ from: 1, to: 6 }])
  })

  test('parses compound from notation', () => {
    const result = parseModifiers('3d6!!')
    expect(result.compound).toBe(true)
  })

  test('parses penetrate from notation', () => {
    const result = parseModifiers('3d6!p')
    expect(result.penetrate).toBe(true)
  })

  test('parses multiply from notation', () => {
    const result = parseModifiers('2d6*2')
    expect(result.multiply).toBe(2)
  })

  test('parses multiplyTotal from notation', () => {
    const result = parseModifiers('2d6**3')
    expect(result.multiplyTotal).toBe(3)
  })

  test('parses count from notation (#{} syntax)', () => {
    const result = parseModifiers('5d10#{>=7}')
    expect(result.count).toEqual({ greaterThanOrEqual: 7 })
  })

  test('parses count with deduct from notation', () => {
    const result = parseModifiers('5d10#{>=7,<=1}')
    expect(result.count).toEqual({ greaterThanOrEqual: 7, lessThanOrEqual: 1, deduct: true })
  })

  test('parses multiple modifiers from notation', () => {
    const result = parseModifiers('4d6L+5')
    expect(result.drop).toEqual({ lowest: 1 })
    expect(result.plus).toBe(5)
  })

  test('returns empty object for notation without modifiers', () => {
    const result = parseModifiers('2d6')
    expect(Object.keys(result).length).toBe(0)
  })
})

describe('validateModifiers', () => {
  test('validates drop modifier - throws when dropping all dice', () => {
    expect(() => {
      validateModifiers({ drop: { lowest: 4 } }, { sides: 6, quantity: 4 })
    }).toThrow('Cannot drop 4 dice from a pool of 4')
  })

  test('validates drop modifier - throws when dropping more than available', () => {
    expect(() => {
      validateModifiers({ drop: { highest: 3, lowest: 2 } }, { sides: 6, quantity: 4 })
    }).toThrow('Cannot drop 5 dice from a pool of 4')
  })

  test('validates drop modifier - passes for valid drop count', () => {
    expect(() => {
      validateModifiers({ drop: { lowest: 1 } }, { sides: 6, quantity: 4 })
    }).not.toThrow()
  })

  test('validates unique modifier - throws when quantity exceeds sides', () => {
    expect(() => {
      validateModifiers({ unique: true }, { sides: 4, quantity: 5 })
    }).toThrow('Cannot have 5 unique values with only 4 sides')
  })

  test('validates unique modifier - passes when quantity equals sides', () => {
    expect(() => {
      validateModifiers({ unique: true }, { sides: 6, quantity: 6 })
    }).not.toThrow()
  })

  test('validates unique modifier - passes when quantity less than sides', () => {
    expect(() => {
      validateModifiers({ unique: true }, { sides: 6, quantity: 4 })
    }).not.toThrow()
  })

  test('validates keep modifier - throws when keeping more highest than available', () => {
    expect(() => {
      validateModifiers({ keep: { highest: 5 } }, { sides: 6, quantity: 4 })
    }).toThrow('Cannot keep 5 highest dice from a pool of 4')
  })

  test('validates keep modifier - throws when keeping less than 1 highest', () => {
    expect(() => {
      validateModifiers({ keep: { highest: 0 } }, { sides: 6, quantity: 4 })
    }).toThrow('Cannot keep 0 highest dice from a pool of 4')
  })

  test('validates keep modifier - throws when keeping more lowest than available', () => {
    expect(() => {
      validateModifiers({ keep: { lowest: 5 } }, { sides: 6, quantity: 4 })
    }).toThrow('Cannot keep 5 lowest dice from a pool of 4')
  })

  test('validates keep modifier - throws when keeping less than 1 lowest', () => {
    expect(() => {
      validateModifiers({ keep: { lowest: 0 } }, { sides: 6, quantity: 4 })
    }).toThrow('Cannot keep 0 lowest dice from a pool of 4')
  })

  test('validates keep modifier - passes for valid keep count', () => {
    expect(() => {
      validateModifiers({ keep: { highest: 3 } }, { sides: 6, quantity: 4 })
    }).not.toThrow()
  })

  test('validates multiple modifiers together', () => {
    expect(() => {
      validateModifiers({ drop: { lowest: 1 }, unique: true }, { sides: 6, quantity: 4 })
    }).not.toThrow()
  })

  test('handles modifiers without validate function', () => {
    expect(() => {
      validateModifiers({ plus: 5, minus: 3 }, { sides: 6, quantity: 2 })
    }).not.toThrow()
  })
})
