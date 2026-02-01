import { describe, expect, test } from 'bun:test'
import { PRESETS, resolvePreset, resolvePresetParam } from '../src/presets'
import { ValidationError } from '../src/errors'

describe('PRESETS', () => {
  test('contains expected preset names', () => {
    expect(PRESETS).toHaveProperty('dnd-ability-score')
    expect(PRESETS).toHaveProperty('dnd-advantage')
    expect(PRESETS).toHaveProperty('dnd-disadvantage')
    expect(PRESETS).toHaveProperty('fate-dice')
  })

  test('dnd-ability-score is 4d6L notation', () => {
    expect(PRESETS['dnd-ability-score']).toBe('4d6L')
  })

  test('dnd-advantage is 2d20L notation', () => {
    expect(PRESETS['dnd-advantage']).toBe('2d20L')
  })

  test('dnd-disadvantage is 2d20H notation', () => {
    expect(PRESETS['dnd-disadvantage']).toBe('2d20H')
  })

  test('fate-dice is a RollOptions object', () => {
    const fateDice = PRESETS['fate-dice']
    expect(typeof fateDice).toBe('object')
    expect(fateDice).toHaveProperty('sides')
    expect(fateDice).toHaveProperty('quantity')
  })
})

describe('resolvePreset', () => {
  test('resolves dnd-ability-score', () => {
    expect(resolvePreset('dnd-ability-score')).toBe('4d6L')
  })

  test('resolves dnd-advantage', () => {
    expect(resolvePreset('dnd-advantage')).toBe('2d20L')
  })

  test('resolves dnd-disadvantage', () => {
    expect(resolvePreset('dnd-disadvantage')).toBe('2d20H')
  })

  test('resolves fate-dice to RollOptions', () => {
    const result = resolvePreset('fate-dice')
    expect(typeof result).toBe('object')
    expect(result).toHaveProperty('sides', ['+', '+', ' ', ' ', '-', '-'])
    expect(result).toHaveProperty('quantity', 4)
  })

  test('throws ValidationError for unknown preset', () => {
    expect(() => resolvePreset('unknown-preset')).toThrow(ValidationError)
  })

  test('error message includes available presets', () => {
    try {
      resolvePreset('not-a-preset')
      expect.unreachable('Should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError)
      expect((e as ValidationError).message).toContain('Unknown preset')
      expect((e as ValidationError).message).toContain('dnd-ability-score')
    }
  })
})

describe('resolvePresetParam', () => {
  describe('shadowrun-pool', () => {
    test('creates dice pool with valid count', () => {
      expect(resolvePresetParam('shadowrun-pool', { dice: 8 })).toBe('8d6')
    })

    test('handles string dice parameter', () => {
      expect(resolvePresetParam('shadowrun-pool', { dice: '5' })).toBe('5d6')
    })

    test('handles minimum dice count (1)', () => {
      expect(resolvePresetParam('shadowrun-pool', { dice: 1 })).toBe('1d6')
    })

    test('handles maximum dice count (100)', () => {
      expect(resolvePresetParam('shadowrun-pool', { dice: 100 })).toBe('100d6')
    })

    test('throws for dice count below 1', () => {
      expect(() => resolvePresetParam('shadowrun-pool', { dice: 0 })).toThrow(ValidationError)
    })

    test('throws for dice count above 100', () => {
      expect(() => resolvePresetParam('shadowrun-pool', { dice: 101 })).toThrow(ValidationError)
    })

    test('throws for non-integer dice count', () => {
      expect(() => resolvePresetParam('shadowrun-pool', { dice: 5.5 })).toThrow(ValidationError)
    })

    test('throws for negative dice count', () => {
      expect(() => resolvePresetParam('shadowrun-pool', { dice: -3 })).toThrow(ValidationError)
    })

    test('error message includes validation details', () => {
      try {
        resolvePresetParam('shadowrun-pool', { dice: 150 })
        expect.unreachable('Should have thrown')
      } catch (e) {
        expect(e).toBeInstanceOf(ValidationError)
        expect((e as ValidationError).message).toContain('Invalid dice count')
        expect((e as ValidationError).message).toContain('1-100')
      }
    })
  })

  describe('fallback to resolvePreset', () => {
    test('resolves non-parameterized presets', () => {
      expect(resolvePresetParam('dnd-ability-score', {})).toBe('4d6L')
    })

    test('throws for unknown preset', () => {
      expect(() => resolvePresetParam('unknown', {})).toThrow(ValidationError)
    })
  })
})
