import type { ModifierOptions, RollOptions } from '../../types'
import { ModifierError } from '../../errors'

/**
 * Validates modifier options for correctness and edge cases.
 *
 * Checks for problematic modifier combinations that would produce
 * invalid or unexpected results, such as:
 * - Dropping all dice from a pool
 * - Unique modifier with quantity > sides
 * - Reroll values outside valid range
 *
 * @param modifiers - Modifier options to validate
 * @param rollOptions - Roll options containing sides and quantity
 * @throws ModifierError if modifiers are invalid
 *
 * @example
 * ```ts
 * validateModifierOptions(
 *   { drop: { lowest: 2 } },
 *   { sides: 6, quantity: 2 }
 * ) // Throws: Cannot drop 2 dice from a pool of 2
 * ```
 */
export function validateModifierOptions(
  modifiers: ModifierOptions,
  rollOptions: Pick<RollOptions, 'sides' | 'quantity'>
): void {
  const quantity = rollOptions.quantity ?? 1
  const sides = typeof rollOptions.sides === 'number' ? rollOptions.sides : rollOptions.sides.length

  // Drop validation
  if (modifiers.drop) {
    const totalDrop = (modifiers.drop.lowest ?? 0) + (modifiers.drop.highest ?? 0)
    if (totalDrop >= quantity) {
      throw new ModifierError('drop', `Cannot drop ${totalDrop} dice from a pool of ${quantity}`)
    }
  }

  // Keep validation
  if (modifiers.keep) {
    if (modifiers.keep.highest !== undefined) {
      if (modifiers.keep.highest > quantity || modifiers.keep.highest < 1) {
        throw new ModifierError(
          'keep',
          `Cannot keep ${modifiers.keep.highest} highest dice from a pool of ${quantity}`
        )
      }
    }
    if (modifiers.keep.lowest !== undefined) {
      if (modifiers.keep.lowest > quantity || modifiers.keep.lowest < 1) {
        throw new ModifierError(
          'keep',
          `Cannot keep ${modifiers.keep.lowest} lowest dice from a pool of ${quantity}`
        )
      }
    }
  }

  // Unique validation
  if (modifiers.unique && quantity > sides) {
    throw new ModifierError(
      'unique',
      `Cannot have ${quantity} unique results with only ${sides} sides`
    )
  }

  // Cap validation: if both lessThan and greaterThan are present, lessThan must be < greaterThan
  if (modifiers.cap) {
    if (
      modifiers.cap.lessThan !== undefined &&
      modifiers.cap.greaterThan !== undefined &&
      modifiers.cap.lessThan >= modifiers.cap.greaterThan
    ) {
      throw new ModifierError(
        'cap',
        `Invalid cap range: lessThan (${modifiers.cap.lessThan}) must be less than greaterThan (${modifiers.cap.greaterThan})`
      )
    }
  }

  // Reroll exact validation
  if (modifiers.reroll?.exact) {
    for (const value of modifiers.reroll.exact) {
      if (value < 1 || value > sides) {
        throw new ModifierError(
          'reroll',
          `Reroll value ${value} is outside valid range [1, ${sides}]`
        )
      }
    }
  }
}
