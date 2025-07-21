import { describe, expect, mock, test } from 'bun:test'
import { BaseModifier } from '../../../src/lib/modifiers'
import type { NumericRollBonus } from '../../../src/types/modifiers'

class TestModifier extends BaseModifier<number> {
  public static override parse = mock((_modifierString: string) => {
    return {}
  })

  public apply(bonus: NumericRollBonus): NumericRollBonus {
    if (!this.options) return bonus
    return { ...bonus, simpleMathModifier: this.options }
  }

  public toDescription(): string[] | undefined {
    return ['Test Modifier']
  }

  public toNotation(): string | undefined {
    return 'T'
  }

  public getOptions(): number | undefined {
    return this.options
  }

  public testToModifierLog(
    modifier: string,
    initialRolls: number[],
    newRolls: number[]
  ): ModifierLog {
    return this.toModifierLog(modifier, initialRolls, newRolls)
  }
}

class ErrorThrowingModifier extends BaseModifier<boolean> {
  public apply(): NumericRollBonus {
    throw new Error('Test error in apply method')
  }

  public toDescription(): string[] | undefined {
    throw new Error('Test error in toDescription method')
  }

  public toNotation(): string | undefined {
    throw new Error('Test error in toNotation method')
  }
}

describe('BaseModifier', () => {
  describe('constructor', () => {
    test('initializes with options', () => {
      const options = 42
      const modifier = new TestModifier(options)

      expect(modifier.getOptions()).toBe(options)
    })

    test('initializes with undefined options', () => {
      const modifier = new TestModifier(undefined)

      expect(modifier.getOptions()).toBeUndefined()
    })
  })

  describe('static parse', () => {
    test('has a parse method that can be overridden', () => {
      expect(typeof BaseModifier.parse).toBe('function')

      const result = TestModifier.parse('test')
      expect(TestModifier.parse).toHaveBeenCalled()
      expect(TestModifier.parse).toHaveBeenCalledWith('test')
      expect(result).toEqual({})
    })
  })

  describe('apply', () => {
    test('concrete implementation can apply modifications', () => {
      const modifier = new TestModifier(5)
      const bonus: NumericRollBonus = {
        rolls: [1, 2],
        simpleMathModifier: 0,
        logs: []
      }

      const result = modifier.apply(bonus)
      expect(result.simpleMathModifier).toBe(5)
    })

    test('concrete implementation handles undefined options', () => {
      const modifier = new TestModifier(undefined)
      const bonus: NumericRollBonus = {
        rolls: [1, 2],
        simpleMathModifier: 0,
        logs: []
      }

      const result = modifier.apply(bonus)
      expect(result).toBe(bonus)
    })
  })

  describe('toDescription', () => {
    test('concrete implementation returns description array', () => {
      const modifier = new TestModifier(5)
      const result = modifier.toDescription()
      expect(result).toEqual(['Test Modifier'])
    })

    test('handles error conditions in concrete implementations', () => {
      const modifier = new ErrorThrowingModifier(true)
      expect(() => modifier.toDescription()).toThrow(
        'Test error in toDescription method'
      )
    })
  })

  describe('toNotation', () => {
    test('concrete implementation returns notation string', () => {
      const modifier = new TestModifier(5)
      const result = modifier.toNotation()
      expect(result).toBe('T')
    })

    test('handles error conditions in concrete implementations', () => {
      const modifier = new ErrorThrowingModifier(true)
      expect(() => modifier.toNotation()).toThrow(
        'Test error in toNotation method'
      )
    })
  })

  describe('inheritance patterns', () => {
    test('subclasses inherit from BaseModifier correctly', () => {
      const modifier = new TestModifier(42)
      expect(modifier).toBeInstanceOf(BaseModifier)
      expect(modifier).toBeInstanceOf(TestModifier)
    })

    test('subclasses can override static parse method', () => {
      expect(TestModifier.parse).toBeDefined()
      expect(typeof TestModifier.parse).toBe('function')

      TestModifier.parse('test-string')
      expect(TestModifier.parse).toHaveBeenCalledWith('test-string')
    })

    test('base class parse method returns empty object', () => {
      const result = BaseModifier.parse('any-string')
      expect(result).toEqual({})
    })

    test('subclasses can have different option types', () => {
      const numberModifier = new TestModifier(123)
      const booleanModifier = new ErrorThrowingModifier(false)

      expect(numberModifier.getOptions()).toBe(123)
      expect(booleanModifier).toBeInstanceOf(BaseModifier)
    })
  })

  describe('interface compliance', () => {
    test('all required abstract methods are implemented in concrete classes', () => {
      const modifier = new TestModifier(1)

      expect(typeof modifier.apply).toBe('function')
      expect(typeof modifier.toDescription).toBe('function')
      expect(typeof modifier.toNotation).toBe('function')
    })

    test('constructor properly initializes options property', () => {
      const withOptions = new TestModifier(999)
      const withoutOptions = new TestModifier(undefined)

      expect(withOptions.getOptions()).toBe(999)
      expect(withoutOptions.getOptions()).toBeUndefined()
    })
  })

  describe('edge cases and boundary conditions', () => {
    test('handles undefined options correctly', () => {
      const undefinedModifier = new TestModifier(undefined)

      expect(undefinedModifier.getOptions()).toBeUndefined()
    })

    test('handles zero and negative option values', () => {
      const zeroModifier = new TestModifier(0)
      const negativeModifier = new TestModifier(-5)

      expect(zeroModifier.getOptions()).toBe(0)
      expect(negativeModifier.getOptions()).toBe(-5)
    })

    test('handles large option values', () => {
      const largeModifier = new TestModifier(Number.MAX_SAFE_INTEGER)
      expect(largeModifier.getOptions()).toBe(Number.MAX_SAFE_INTEGER)
    })

    test('static parse method handles empty and invalid strings', () => {
      expect(BaseModifier.parse('')).toEqual({})
      expect(BaseModifier.parse('   ')).toEqual({})
      expect(BaseModifier.parse('invalid-notation')).toEqual({})
      expect(BaseModifier.parse('123!@#$%')).toEqual({})
    })
  })

  describe('toModifierLog', () => {
    test('handles simple addition and removal', () => {
      const modifier = new TestModifier(1)
      const result = modifier.testToModifierLog('test', [1, 2, 3], [1, 2, 4])

      expect(result.added).toEqual([4])
      expect(result.removed).toEqual([3])
      expect(result.modifier).toBe('test')
    })

    test('handles duplicate values correctly - example case', () => {
      const modifier = new TestModifier(1)
      const initialRolls = [4, 4, 4, 4, 4]
      const newRolls = [4, 2, 4, 4, 4]

      const result = modifier.testToModifierLog('test', initialRolls, newRolls)

      expect(result.added).toEqual([2])
      expect(result.removed).toEqual([4])
      expect(result.modifier).toBe('test')
    })

    test('handles multiple duplicates', () => {
      const modifier = new TestModifier(1)
      const initialRolls = [1, 1, 2, 2, 3]
      const newRolls = [1, 2, 2, 2, 4, 4]

      const result = modifier.testToModifierLog('test', initialRolls, newRolls)

      expect(result.added).toEqual([2, 4, 4])
      expect(result.removed).toEqual([1, 3])
      expect(result.modifier).toBe('test')
    })

    test('handles no changes', () => {
      const modifier = new TestModifier(1)
      const rolls = [1, 2, 3, 3, 4]

      const result = modifier.testToModifierLog('test', rolls, rolls)

      expect(result.added).toEqual([])
      expect(result.removed).toEqual([])
      expect(result.modifier).toBe('test')
    })

    test('handles complete replacement', () => {
      const modifier = new TestModifier(1)
      const result = modifier.testToModifierLog('test', [1, 2, 3], [4, 5, 6])

      expect(result.added).toEqual([4, 5, 6])
      expect(result.removed).toEqual([1, 2, 3])
      expect(result.modifier).toBe('test')
    })

    test('handles empty arrays', () => {
      const modifier = new TestModifier(1)

      const addResult = modifier.testToModifierLog('test', [], [1, 2, 3])
      expect(addResult.added).toEqual([1, 2, 3])
      expect(addResult.removed).toEqual([])

      const removeResult = modifier.testToModifierLog('test', [1, 2, 3], [])
      expect(removeResult.added).toEqual([])
      expect(removeResult.removed).toEqual([1, 2, 3])
    })
  })
})
