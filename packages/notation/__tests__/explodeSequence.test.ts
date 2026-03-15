import { describe, expect, test } from 'bun:test'
import { explodeSequenceSchema } from '../src/definitions/explodeSequence'
import { isDiceNotation } from '../src/isDiceNotation'
import { notationToOptions } from '../src/parse/notationToOptions'
import { modifiersToDescription, modifiersToNotation } from '../src/transformers/modifiersToStrings'
import { TTRPG_STANDARD_DIE_SET } from '../src/constants'

describe('TTRPG_STANDARD_DIE_SET', () => {
  test('contains the standard TTRPG die sizes in order', () => {
    expect(TTRPG_STANDARD_DIE_SET).toEqual([4, 6, 8, 10, 12, 20, 100])
  })

  test('is frozen', () => {
    expect(Object.isFrozen(TTRPG_STANDARD_DIE_SET)).toBe(true)
  })
})

describe('explodeSequenceSchema', () => {
  describe('parse', () => {
    test('parses !s{4,6,8} to explodeSequence array', () => {
      expect(explodeSequenceSchema.parse('!s{4,6,8}')).toEqual({
        explodeSequence: [4, 6, 8]
      })
    })

    test('parses !S{4,6,8} (case-insensitive)', () => {
      expect(explodeSequenceSchema.parse('!S{4,6,8}')).toEqual({
        explodeSequence: [4, 6, 8]
      })
    })

    test('parses !s{4,6,8,10,12,20,100} (full TTRPG set)', () => {
      expect(explodeSequenceSchema.parse('!s{4,6,8,10,12,20,100}')).toEqual({
        explodeSequence: [4, 6, 8, 10, 12, 20, 100]
      })
    })

    test('parses single element sequence !s{6}', () => {
      expect(explodeSequenceSchema.parse('!s{6}')).toEqual({
        explodeSequence: [6]
      })
    })

    test('returns empty object for no match', () => {
      expect(explodeSequenceSchema.parse('no match')).toEqual({})
    })

    test('returns empty object for plain explode !', () => {
      expect(explodeSequenceSchema.parse('!')).toEqual({})
    })
  })

  describe('toNotation', () => {
    test('formats array as !s{4,6,8}', () => {
      expect(explodeSequenceSchema.toNotation([4, 6, 8])).toBe('!s{4,6,8}')
    })

    test('formats single element as !s{6}', () => {
      expect(explodeSequenceSchema.toNotation([6])).toBe('!s{6}')
    })

    test('returns undefined for empty array', () => {
      expect(explodeSequenceSchema.toNotation([])).toBeUndefined()
    })
  })

  describe('toDescription', () => {
    test('describes sequence', () => {
      expect(explodeSequenceSchema.toDescription([4, 6, 8])).toEqual([
        'Explode through sequence: d4, d6, d8'
      ])
    })

    test('returns empty for empty array', () => {
      expect(explodeSequenceSchema.toDescription([])).toEqual([])
    })
  })
})

describe('inflation explosion sugar (!i)', () => {
  test('!i on a d6 parses to explodeSequence starting above 6', () => {
    const result = notationToOptions('2d6!i')
    expect(result[0]?.modifiers?.explodeSequence).toEqual([8, 10, 12, 20, 100])
  })

  test('!I on a d6 (case-insensitive)', () => {
    const result = notationToOptions('2d6!I')
    expect(result[0]?.modifiers?.explodeSequence).toEqual([8, 10, 12, 20, 100])
  })

  test('!i on d4 (smallest) includes all larger sizes', () => {
    const result = notationToOptions('1d4!i')
    expect(result[0]?.modifiers?.explodeSequence).toEqual([6, 8, 10, 12, 20, 100])
  })

  test('!i on d100 (largest) produces empty sequence', () => {
    const result = notationToOptions('1d100!i')
    expect(result[0]?.modifiers?.explodeSequence).toEqual([])
  })

  test('!i on d10 starts from d12', () => {
    const result = notationToOptions('1d10!i')
    expect(result[0]?.modifiers?.explodeSequence).toEqual([12, 20, 100])
  })

  test('!i on d20 starts from d100', () => {
    const result = notationToOptions('1d20!i')
    expect(result[0]?.modifiers?.explodeSequence).toEqual([100])
  })

  test('!i on non-standard d7 snaps up to d8', () => {
    const result = notationToOptions('1d7!i')
    expect(result[0]?.modifiers?.explodeSequence).toEqual([8, 10, 12, 20, 100])
  })

  test('!i on non-standard d3 snaps up to d4', () => {
    const result = notationToOptions('1d3!i')
    expect(result[0]?.modifiers?.explodeSequence).toEqual([4, 6, 8, 10, 12, 20, 100])
  })
})

describe('reductive explosion sugar (!r)', () => {
  test('!r on a d20 parses to explodeSequence going down from 20', () => {
    const result = notationToOptions('1d20!r')
    expect(result[0]?.modifiers?.explodeSequence).toEqual([12, 10, 8, 6, 4])
  })

  test('!R on a d20 (case-insensitive)', () => {
    const result = notationToOptions('1d20!R')
    expect(result[0]?.modifiers?.explodeSequence).toEqual([12, 10, 8, 6, 4])
  })

  test('!r on d10 starts from d8 going down', () => {
    const result = notationToOptions('1d10!r')
    expect(result[0]?.modifiers?.explodeSequence).toEqual([8, 6, 4])
  })

  test('!r on d4 (smallest) produces empty sequence', () => {
    const result = notationToOptions('1d4!r')
    expect(result[0]?.modifiers?.explodeSequence).toEqual([])
  })

  test('!r on d100 includes all smaller sizes', () => {
    const result = notationToOptions('1d100!r')
    expect(result[0]?.modifiers?.explodeSequence).toEqual([20, 12, 10, 8, 6, 4])
  })

  test('!r on d6 starts from d4', () => {
    const result = notationToOptions('1d6!r')
    expect(result[0]?.modifiers?.explodeSequence).toEqual([4])
  })

  test('!r on non-standard d7 snaps down to d6', () => {
    const result = notationToOptions('1d7!r')
    expect(result[0]?.modifiers?.explodeSequence).toEqual([6, 4])
  })

  test('!r on non-standard d15 snaps down to d12', () => {
    const result = notationToOptions('1d15!r')
    expect(result[0]?.modifiers?.explodeSequence).toEqual([12, 10, 8, 6, 4])
  })
})

describe('isDiceNotation recognizes explode sequence notations', () => {
  test('accepts !s{4,6,8}', () => {
    expect(isDiceNotation('4d6!s{6,8,10}')).toBe(true)
  })

  test('accepts !S{4,6,8} (case-insensitive)', () => {
    expect(isDiceNotation('4d6!S{6,8,10}')).toBe(true)
  })

  test('accepts !i (inflation)', () => {
    expect(isDiceNotation('2d6!i')).toBe(true)
  })

  test('accepts !I (case-insensitive)', () => {
    expect(isDiceNotation('2d6!I')).toBe(true)
  })

  test('accepts !r (reductive)', () => {
    expect(isDiceNotation('3d20!r')).toBe(true)
  })

  test('accepts !R (case-insensitive)', () => {
    expect(isDiceNotation('3d20!R')).toBe(true)
  })
})

describe('modifiersToNotation round-trip', () => {
  test('explodeSequence round-trips through toNotation', () => {
    const notation = modifiersToNotation({ explodeSequence: [4, 6, 8] })
    expect(notation).toBe('!s{4,6,8}')
  })
})

describe('modifiersToDescription', () => {
  test('describes explodeSequence', () => {
    const desc = modifiersToDescription({ explodeSequence: [4, 6, 8] })
    expect(desc).toEqual(['Explode through sequence: d4, d6, d8'])
  })
})
