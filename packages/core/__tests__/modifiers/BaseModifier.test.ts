import { describe, expect, mock, test } from 'bun:test'
import { BaseModifier } from '../../src/modifiers/BaseModifier'
import type { NumericRollBonus } from '../../src/types'

class TestModifier extends BaseModifier<number> {
  public static override parse = mock((_modifierString: string) => {
    return { testOption: 1 }
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
      expect(result).toEqual({ testOption: 1 })
    })
  })

  describe('apply', () => {
    test('concrete implementation can apply modifications', () => {
      const modifier = new TestModifier(5)
      const bonus: NumericRollBonus = {
        rolls: [1, 2],
        simpleMathModifier: 0
      }

      const result = modifier.apply(bonus)
      expect(result.simpleMathModifier).toBe(5)
    })

    test('concrete implementation handles undefined options', () => {
      const modifier = new TestModifier(undefined)
      const bonus: NumericRollBonus = {
        rolls: [1, 2],
        simpleMathModifier: 0
      }

      const result = modifier.apply(bonus)
      expect(result).toBe(bonus)
    })
  })
})
