import { describe, expect, test } from 'bun:test'
import { isDiceNotation } from '@randsum/roller/validate'
import { modifierPresets } from '../src/presets'
import type { ModifierName } from '../src/presets'
import { MODIFIER_TABLE } from '../src/internal/modifiers'

describe('modifierPresets', () => {
  test('every modifier has presets, and every preset rolls', () => {
    for (const name of Object.keys(MODIFIER_TABLE) as ModifierName[]) {
      const presets = modifierPresets(name)
      expect(presets.length).toBeGreaterThan(0)
      for (const preset of presets) {
        expect(isDiceNotation(preset.notation)).toBe(true)
        expect(preset.description).toBeTruthy()
      }
    }
  })

  test('the explode presets are its documented examples', () => {
    expect(modifierPresets('explode').map(p => p.notation)).toEqual([
      '3d6!',
      '4d6L!',
      '3d10!{>=8}',
      '5d10!{=10}'
    ])
  })
})
