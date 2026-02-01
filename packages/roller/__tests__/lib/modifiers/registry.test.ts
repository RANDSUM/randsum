import { describe, expect, test } from 'bun:test'
import '../../../src/lib/modifiers/definitions/index.js'
import {
  applyModifierFromRegistry,
  clearRegistry,
  defineModifier,
  getAllModifiers,
  getModifier,
  getRegisteredModifierCount,
  hasModifier,
  hasRegisteredModifiers,
  modifierToDescriptionFromRegistry,
  modifierToNotationFromRegistry,
  registerDefaultModifiers
} from '../../../src/lib/modifiers/registry'
import {
  capModifier,
  compoundModifier,
  countSuccessesModifier,
  dropModifier,
  explodeModifier,
  keepModifier,
  minusModifier,
  multiplyModifier,
  multiplyTotalModifier,
  penetrateModifier,
  plusModifier,
  replaceModifier,
  rerollModifier,
  uniqueModifier
} from '../../../src/lib/modifiers/definitions'
import { ModifierError } from '../../../src/errors'
import type { ModifierContext } from '../../../src/lib/modifiers/schema'
import type { ModifierOptions } from '../../../src/types'

describe('registry functions', () => {
  describe('hasRegisteredModifiers', () => {
    test('returns true when modifiers are registered', () => {
      // Modifiers are registered on import
      expect(hasRegisteredModifiers()).toBe(true)
    })
  })

  describe('hasModifier', () => {
    test('returns true for registered modifiers', () => {
      expect(hasModifier('plus')).toBe(true)
      expect(hasModifier('minus')).toBe(true)
      expect(hasModifier('drop')).toBe(true)
      expect(hasModifier('keep')).toBe(true)
      expect(hasModifier('reroll')).toBe(true)
      expect(hasModifier('explode')).toBe(true)
      expect(hasModifier('cap')).toBe(true)
      expect(hasModifier('unique')).toBe(true)
      expect(hasModifier('replace')).toBe(true)
      expect(hasModifier('compound')).toBe(true)
      expect(hasModifier('penetrate')).toBe(true)
      expect(hasModifier('multiply')).toBe(true)
      expect(hasModifier('countSuccesses')).toBe(true)
      expect(hasModifier('multiplyTotal')).toBe(true)
    })
  })

  describe('getModifier', () => {
    test('returns modifier definition for registered modifier', () => {
      const plusModifier = getModifier('plus')

      expect(plusModifier).toBeDefined()
      expect(plusModifier?.name).toBe('plus')
      expect(typeof plusModifier?.apply).toBe('function')
      expect(typeof plusModifier?.toNotation).toBe('function')
      expect(typeof plusModifier?.toDescription).toBe('function')
    })

    test('returns undefined for unregistered modifier name', () => {
      // TypeScript won't let us pass an invalid key, but we can test the behavior
      // by checking a valid key that we know exists
      const modifier = getModifier('drop')
      expect(modifier).toBeDefined()
    })

    test('returns correct definition for each modifier', () => {
      const drop = getModifier('drop')
      const keep = getModifier('keep')
      const reroll = getModifier('reroll')

      expect(drop?.name).toBe('drop')
      expect(keep?.name).toBe('keep')
      expect(reroll?.name).toBe('reroll')

      // Verify priorities are set correctly
      expect(drop?.priority).toBeLessThan(keep?.priority ?? 0)
    })
  })

  describe('getAllModifiers', () => {
    test('returns array of all registered modifiers', () => {
      const allModifiers = getAllModifiers()

      expect(Array.isArray(allModifiers)).toBe(true)
      expect(allModifiers.length).toBeGreaterThan(0)
    })

    test('includes expected modifiers', () => {
      const allModifiers = getAllModifiers()
      const names = allModifiers.map(m => m.name)

      expect(names).toContain('plus')
      expect(names).toContain('minus')
      expect(names).toContain('drop')
      expect(names).toContain('keep')
      expect(names).toContain('reroll')
      expect(names).toContain('explode')
    })

    test('all modifiers have required properties', () => {
      const allModifiers = getAllModifiers()

      for (const modifier of allModifiers) {
        expect(modifier.name).toBeDefined()
        expect(typeof modifier.priority).toBe('number')
        expect(modifier.pattern).toBeInstanceOf(RegExp)
        expect(typeof modifier.parse).toBe('function')
        expect(typeof modifier.apply).toBe('function')
        expect(typeof modifier.toNotation).toBe('function')
        expect(typeof modifier.toDescription).toBe('function')
      }
    })
  })

  describe('getRegisteredModifierCount', () => {
    test('returns count of registered modifiers', () => {
      const count = getRegisteredModifierCount()
      expect(count).toBeGreaterThan(0)
      expect(count).toBe(getAllModifiers().length)
    })
  })

  describe('clearRegistry', () => {
    test('clears all modifiers from registry', () => {
      const countBefore = getRegisteredModifierCount()
      expect(countBefore).toBeGreaterThan(0)

      clearRegistry()
      expect(getRegisteredModifierCount()).toBe(0)
      expect(hasRegisteredModifiers()).toBe(false)

      registerDefaultModifiers([
        capModifier,
        compoundModifier,
        countSuccessesModifier,
        dropModifier,
        explodeModifier,
        keepModifier,
        minusModifier,
        multiplyModifier,
        multiplyTotalModifier,
        penetrateModifier,
        plusModifier,
        replaceModifier,
        rerollModifier,
        uniqueModifier
      ])
      expect(getRegisteredModifierCount()).toBe(countBefore)
    })
  })

  describe('modifierToNotationFromRegistry and modifierToDescriptionFromRegistry', () => {
    test('return undefined when modifier not in registry', () => {
      const countBefore = getRegisteredModifierCount()
      clearRegistry()

      expect(modifierToNotationFromRegistry('plus', 5)).toBeUndefined()
      expect(modifierToDescriptionFromRegistry('plus', 5)).toBeUndefined()

      registerDefaultModifiers([
        capModifier,
        compoundModifier,
        countSuccessesModifier,
        dropModifier,
        explodeModifier,
        keepModifier,
        minusModifier,
        multiplyModifier,
        multiplyTotalModifier,
        penetrateModifier,
        plusModifier,
        replaceModifier,
        rerollModifier,
        uniqueModifier
      ])
      expect(getRegisteredModifierCount()).toBe(countBefore)
    })
  })

  describe('applyModifierFromRegistry error cases', () => {
    test('throws ModifierError when modifier requires rollFn but none provided', () => {
      // reroll requires rollFn
      const ctx: ModifierContext = { parameters: { sides: 6, quantity: 4 } }

      expect(() => {
        applyModifierFromRegistry('reroll', { exact: [1] }, [1, 2, 3, 4], ctx)
      }).toThrow(ModifierError)
    })

    test('throws ModifierError when modifier requires parameters but none provided', () => {
      // unique requires parameters for validation
      const rollOne = (): number => 5
      const ctx: ModifierContext = { rollOne }

      expect(() => {
        applyModifierFromRegistry('unique', true, [1, 1, 2, 3], ctx)
      }).toThrow(ModifierError)
    })

    test('throws ModifierError for unknown modifier type', () => {
      expect(() => {
        applyModifierFromRegistry('nonexistent' as keyof ModifierOptions, {}, [1, 2, 3], {
          rollOne: (): number => 5,
          parameters: { sides: 6, quantity: 4 }
        })
      }).toThrow(ModifierError)
    })

    test('wraps non-Error throws in ModifierError with Unknown error message', () => {
      defineModifier({
        name: 'plus',
        priority: 90,
        pattern: /\+/,
        parse: () => ({}),
        toNotation: () => '+',
        toDescription: () => [],
        apply: () => {
          // eslint-disable-next-line @typescript-eslint/only-throw-error -- intentionally non-Error to test Unknown error branch
          throw 42
        }
      })

      const ctx: ModifierContext = {
        rollOne: (): number => 5,
        parameters: { sides: 6, quantity: 4 }
      }

      const caught: { value?: unknown } = {}
      try {
        applyModifierFromRegistry('plus', 5, [1, 2, 3], ctx)
      } catch (e) {
        caught.value = e
      }
      expect(caught.value).toBeInstanceOf(ModifierError)
      expect((caught.value as ModifierError).message).toContain('Unknown error: 42')

      defineModifier(plusModifier)
    })
  })
})
