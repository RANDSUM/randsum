import type { DiceNotation, RollOptions } from './types'

/**
 * Fate dice preset configuration
 */
const fateDicePreset: RollOptions = {
  sides: ['+', '+', ' ', ' ', '-', '-'],
  quantity: 4
}

/**
 * Pre-defined dice roll presets for common scenarios.
 *
 * Presets can be resolved using `resolvePreset()` to get either
 * a DiceNotation string or RollOptions object.
 */
export const PRESETS: Record<string, DiceNotation | RollOptions> = {
  // D&D 5th Edition
  'dnd-ability-score': '4d6L' as DiceNotation,
  'dnd-advantage': '2d20L' as DiceNotation,
  'dnd-disadvantage': '2d20H' as DiceNotation,

  // Fate/Fudge dice (4dF)
  'fate-dice': fateDicePreset
  // Shadowrun style (parameterized)
  // Use resolvePreset() for parameterized presets
}

/**
 * Resolves a preset name to either a DiceNotation or RollOptions.
 *
 * For parameterized presets, use the function form:
 * - `'shadowrun-pool'` -> requires dice parameter
 *
 * @param name - Preset name
 * @returns DiceNotation string or RollOptions object
 *
 * @example
 * ```ts
 * // Simple preset
 * resolvePreset('dnd-ability-score') // Returns "4d6L"
 *
 * // Fate dice preset
 * resolvePreset('fate-dice') // Returns RollOptions with custom faces
 * ```
 *
 * @throws Error if preset name is not found
 */
export function resolvePreset(name: string): DiceNotation | RollOptions {
  const preset = PRESETS[name]
  if (preset === undefined) {
    throw new Error(
      `Unknown preset: "${name}". Available presets: ${Object.keys(PRESETS).join(', ')}`
    )
  }

  return preset
}

/**
 * Resolves a parameterized preset.
 *
 * @param name - Preset name
 * @param args - Arguments for parameterized preset
 * @returns DiceNotation string or RollOptions object
 *
 * @example
 * ```ts
 * // Shadowrun pool (parameterized)
 * resolvePresetParam('shadowrun-pool', { dice: 8 }) // Returns "8d6"
 * ```
 */
export function resolvePresetParam(
  name: string,
  args: Record<string, unknown>
): DiceNotation | RollOptions {
  switch (name) {
    case 'shadowrun-pool': {
      const diceArg = args['dice']
      const dice = typeof diceArg === 'number' ? diceArg : Number(diceArg)
      if (!Number.isInteger(dice) || dice < 1 || dice > 100) {
        throw new Error(`Invalid dice count for shadowrun-pool: ${dice}. Must be 1-100.`)
      }
      return `${dice}d6` as DiceNotation
    }

    default:
      // Try non-parameterized resolve first
      return resolvePreset(name)
  }
}
