import { describe, expect, test } from 'bun:test'
import { integerDivideSchema } from '../../src/notation/definitions/integerDivide'
import { moduloSchema } from '../../src/notation/definitions/modulo'
import { isDiceNotation } from '../../src/notation/isDiceNotation'
import { notationToOptions } from '../../src/notation/parse/notationToOptions'
import {
  modifiersToDescription,
  modifiersToNotation
} from '../../src/notation/transformers/modifiersToStrings'
import { tokenize } from '../../src/notation/tokenize'

describe('integerDivideSchema', () => {
  describe('parse', () => {
    test('parses //3', () => {
      expect(integerDivideSchema.parse('//3')).toEqual({ integerDivide: 3 })
    })

    test('parses //10', () => {
      expect(integerDivideSchema.parse('//10')).toEqual({ integerDivide: 10 })
    })

    test('returns empty object for no match', () => {
      expect(integerDivideSchema.parse('no match')).toEqual({})
    })

    test('does not match single / (not integer divide)', () => {
      expect(integerDivideSchema.parse('/3')).toEqual({})
    })
  })

  describe('toNotation', () => {
    test('formats integer divide', () => {
      expect(integerDivideSchema.toNotation(3)).toBe('//3')
    })

    test('formats integer divide by 10', () => {
      expect(integerDivideSchema.toNotation(10)).toBe('//10')
    })
  })

  describe('toDescription', () => {
    test('describes integer divide', () => {
      expect(integerDivideSchema.toDescription(3)).toEqual(['Integer divide by 3'])
    })
  })

  describe('schema properties', () => {
    test('has name "integerDivide"', () => {
      expect(integerDivideSchema.name).toBe('integerDivide')
    })

    test('has priority 93', () => {
      expect(integerDivideSchema.priority).toBe(93)
    })
  })
})

describe('moduloSchema', () => {
  describe('parse', () => {
    test('parses %3', () => {
      expect(moduloSchema.parse('%3')).toEqual({ modulo: 3 })
    })

    test('parses %10', () => {
      expect(moduloSchema.parse('%10')).toEqual({ modulo: 10 })
    })

    test('returns empty object for no match', () => {
      expect(moduloSchema.parse('no match')).toEqual({})
    })
  })

  describe('toNotation', () => {
    test('formats modulo', () => {
      expect(moduloSchema.toNotation(3)).toBe('%3')
    })

    test('formats modulo 10', () => {
      expect(moduloSchema.toNotation(10)).toBe('%10')
    })
  })

  describe('toDescription', () => {
    test('describes modulo', () => {
      expect(moduloSchema.toDescription(3)).toEqual(['Modulo 3'])
    })
  })

  describe('schema properties', () => {
    test('has name "modulo"', () => {
      expect(moduloSchema.name).toBe('modulo')
    })

    test('has priority 94', () => {
      expect(moduloSchema.priority).toBe(94)
    })
  })
})

describe('isDiceNotation with integer divide and modulo', () => {
  test('validates 2d6//3', () => {
    expect(isDiceNotation('2d6//3')).toBe(true)
  })

  test('validates 1d20%5', () => {
    expect(isDiceNotation('1d20%5')).toBe(true)
  })

  test('validates combined with other modifiers', () => {
    expect(isDiceNotation('4d6L//2')).toBe(true)
  })

  test('validates modulo with other modifiers', () => {
    expect(isDiceNotation('4d6L%3')).toBe(true)
  })
})

describe('notationToOptions with integer divide and modulo', () => {
  test('parses 2d6//3', () => {
    const [result] = notationToOptions('2d6//3')
    expect(result?.modifiers?.integerDivide).toBe(3)
  })

  test('parses 1d20%5', () => {
    const [result] = notationToOptions('1d20%5')
    expect(result?.modifiers?.modulo).toBe(5)
  })

  test('parses combined notation 4d6L//2+1', () => {
    const [result] = notationToOptions('4d6L//2+1')
    expect(result?.modifiers?.drop?.lowest).toBe(1)
    expect(result?.modifiers?.integerDivide).toBe(2)
    expect(result?.modifiers?.plus).toBe(1)
  })
})

describe('modifiersToNotation with integer divide and modulo', () => {
  test('formats integerDivide', () => {
    const result = modifiersToNotation({ integerDivide: 3 })
    expect(result).toBe('//3')
  })

  test('formats modulo', () => {
    const result = modifiersToNotation({ modulo: 5 })
    expect(result).toBe('%5')
  })
})

describe('modifiersToDescription with integer divide and modulo', () => {
  test('describes integerDivide', () => {
    const result = modifiersToDescription({ integerDivide: 3 })
    expect(result).toEqual(['Integer divide by 3'])
  })

  test('describes modulo', () => {
    const result = modifiersToDescription({ modulo: 5 })
    expect(result).toEqual(['Modulo 5'])
  })
})

describe('tokenize with integer divide and modulo', () => {
  test('tokenizes //N as integerDivide', () => {
    const tokens = tokenize('2d6//3')
    const divToken = tokens.find(t => t.category === 'Scale')
    expect(divToken).toBeDefined()
    expect(divToken?.text).toBe('//3')
  })

  test('tokenizes %N as modulo', () => {
    const tokens = tokenize('1d20%5')
    const modToken = tokens.find(t => t.category === 'Scale')
    expect(modToken).toBeDefined()
    expect(modToken?.text).toBe('%5')
  })
})
