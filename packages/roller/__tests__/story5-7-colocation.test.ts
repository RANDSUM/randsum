import { describe, expect, test } from 'bun:test'
import { RANDSUM_MODIFIERS } from '../src/modifiers'

describe('Story 5+7: Modifier Co-Location', () => {
  describe('RANDSUM_MODIFIERS single source of truth', () => {
    test('contains all expected modifier names', () => {
      const names = RANDSUM_MODIFIERS.map(m => m.name)
      expect(names).toContain('cap')
      expect(names).toContain('drop')
      expect(names).toContain('keep')
      expect(names).toContain('replace')
      expect(names).toContain('reroll')
      expect(names).toContain('explode')
      expect(names).toContain('compound')
      expect(names).toContain('penetrate')
      expect(names).toContain('explodeSequence')
      expect(names).toContain('unique')
      expect(names).toContain('wildDie')
      expect(names).toContain('multiply')
      expect(names).toContain('plus')
      expect(names).toContain('minus')
      expect(names).toContain('sort')
      expect(names).toContain('integerDivide')
      expect(names).toContain('modulo')
      expect(names).toContain('count')
      expect(names).toContain('multiplyTotal')
    })

    test('has exactly 19 modifiers', () => {
      expect(RANDSUM_MODIFIERS).toHaveLength(19)
    })

    test('each modifier has both schema and behavior fields', () => {
      for (const mod of RANDSUM_MODIFIERS) {
        const m = mod
        // Schema fields
        expect(m.name).toBeDefined()
        expect(m.priority).toBeDefined()
        expect(m.pattern).toBeInstanceOf(RegExp)
        expect(typeof m.parse).toBe('function')
        expect(typeof m.toNotation).toBe('function')
        expect(typeof m.toDescription).toBe('function')
        // Behavior field
        expect(typeof m.apply).toBe('function')
      }
    })

    test('modifiers are in a consistent order matching the old definition', () => {
      const names = RANDSUM_MODIFIERS.map(m => m.name)
      expect(names).toEqual([
        'cap',
        'drop',
        'keep',
        'replace',
        'reroll',
        'explode',
        'compound',
        'penetrate',
        'explodeSequence',
        'unique',
        'wildDie',
        'multiply',
        'plus',
        'minus',
        'sort',
        'integerDivide',
        'modulo',
        'count',
        'multiplyTotal'
      ])
    })
  })

  describe('co-located exports', () => {
    test('cap.ts exports both capSchema and capModifier', async () => {
      const mod = await import('../src/modifiers/cap')
      expect(mod.capSchema).toBeDefined()
      expect(mod.capModifier).toBeDefined()
      expect(mod.capSchema.name).toBe('cap')
      expect(typeof mod.capModifier.apply).toBe('function')
    })

    test('drop.ts exports both dropSchema and dropModifier', async () => {
      const mod = await import('../src/modifiers/drop')
      expect(mod.dropSchema).toBeDefined()
      expect(mod.dropModifier).toBeDefined()
    })

    test('explode.ts exports both explodeSchema and explodeModifier', async () => {
      const mod = await import('../src/modifiers/explode')
      expect(mod.explodeSchema).toBeDefined()
      expect(mod.explodeModifier).toBeDefined()
    })

    test('compound.ts exports both compoundSchema and compoundModifier', async () => {
      const mod = await import('../src/modifiers/compound')
      expect(mod.compoundSchema).toBeDefined()
      expect(mod.compoundModifier).toBeDefined()
    })

    test('penetrate.ts exports both penetrateSchema and penetrateModifier', async () => {
      const mod = await import('../src/modifiers/penetrate')
      expect(mod.penetrateSchema).toBeDefined()
      expect(mod.penetrateModifier).toBeDefined()
    })

    test('plus.ts exports both plusSchema and plusModifier', async () => {
      const mod = await import('../src/modifiers/plus')
      expect(mod.plusSchema).toBeDefined()
      expect(mod.plusModifier).toBeDefined()
    })

    test('minus.ts exports both minusSchema and minusModifier', async () => {
      const mod = await import('../src/modifiers/minus')
      expect(mod.minusSchema).toBeDefined()
      expect(mod.minusModifier).toBeDefined()
    })
  })

  describe('schema-only iteration helpers in modifiersToStrings', () => {
    test('modifiersToNotation produces correct notation via schema iteration', async () => {
      const { modifiersToNotation } =
        await import('../src/notation/transformers/modifiersToStrings')
      const notation = modifiersToNotation({ plus: 5, drop: { lowest: 1 } })
      expect(notation).toContain('L')
      expect(notation).toContain('+5')
    })

    test('modifiersToDescription produces correct descriptions via schema iteration', async () => {
      const { modifiersToDescription } =
        await import('../src/notation/transformers/modifiersToStrings')
      const desc = modifiersToDescription({ plus: 5 })
      expect(desc.some(d => d.includes('Add'))).toBe(true)
    })

    test('registry processModifierNotations produces same results', async () => {
      const { processModifierNotations } = await import('../src/modifiers/registry')
      const notation = processModifierNotations({ plus: 5, drop: { lowest: 1 } })
      expect(notation).toContain('L')
      expect(notation).toContain('+5')
    })
  })

  describe('shared explosion factory', () => {
    test('shared/explosion.ts exports createAccumulatingExplosionBehavior', async () => {
      const mod = await import('../src/modifiers/shared/explosion')
      expect(typeof mod.createAccumulatingExplosionBehavior).toBe('function')
    })
  })

  describe('rolling still works end-to-end', () => {
    test('roll with modifiers produces valid results', async () => {
      const { roll } = await import('../src')
      const result = roll('4d6L')
      expect(result.total).toBeGreaterThanOrEqual(3)
      expect(result.total).toBeLessThanOrEqual(18)
    })

    test('notation round-trips through optionsToNotation', async () => {
      const { optionsToNotation } = await import('../src')
      const notation = optionsToNotation({
        sides: 6,
        quantity: 4,
        modifiers: { drop: { lowest: 1 } }
      })
      expect(notation).toContain('4d6')
      expect(notation).toContain('L')
    })
  })
})
