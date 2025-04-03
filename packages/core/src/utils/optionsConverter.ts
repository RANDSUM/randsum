/**
 * @file Utilities for converting between roll options and dice notation
 * @module @randsum/core/utils/optionsConverter
 */

import { CapModifier } from '../modifiers/CapModifier'
import { DropModifier } from '../modifiers/DropModifier'
import { ExplodeModifier } from '../modifiers/ExplodeModifier'
import { MinusModifier } from '../modifiers/MinusModifier'
import { PlusModifier } from '../modifiers/PlusModifier'
import { ReplaceModifier } from '../modifiers/ReplaceModifier'
import { RerollModifier } from '../modifiers/RerollModifier'
import { UniqueModifier } from '../modifiers/UniqueModifier'
import type { DiceNotation, ModifierOptions, RollOptions } from '../types'

/**
 * Utilities for converting between roll options and dice notation
 *
 * This object provides methods to convert roll options to dice notation strings
 * and human-readable descriptions.
 *
 * @namespace
 */
export const optionsConverter = {
  /**
   * Converts roll options to dice notation string
   *
   * @param options - The roll options to convert
   * @returns Dice notation string
   *
   * @example
   * // Convert numeric options to notation
   * optionsConverter.toNotation({ sides: 20, quantity: 1 }); // "1d20"
   *
   * @example
   * // Convert options with modifiers to notation
   * optionsConverter.toNotation({
   *   sides: 6,
   *   quantity: 3,
   *   modifiers: { drop: { lowest: 1 } }
   * }); // "3d6L"
   */
  toNotation(options: RollOptions): DiceNotation {
    const coreNotation = this.formatCoreNotation(options)
    const modifierNotation = this.formatModifierNotation(options.modifiers)
    return `${coreNotation}${modifierNotation}` as DiceNotation
  },

  /**
   * Converts roll options to human-readable descriptions
   *
   * @param options - The roll options to convert
   * @returns Array of description strings
   *
   * @example
   * // Get description for numeric options
   * optionsConverter.toDescription({ sides: 20, quantity: 1 });
   * // ["Roll 1 20-sided die"]
   *
   * @example
   * // Get description for options with modifiers
   * optionsConverter.toDescription({
   *   sides: 6,
   *   quantity: 3,
   *   modifiers: { drop: { lowest: 1 } }
   * });
   * // ["Roll 3 6-sided dice", "Drop lowest"]
   */
  toDescription(options: RollOptions): string[] {
    return [
      this.formatCoreDescription(options),
      ...this.formatModifierDescriptions(options)
    ]
  },

  /**
   * Formats the core part of dice notation (quantity and sides)
   *
   * @param options - The roll options to format
   * @returns Core notation string
   *
   * @example
   * // Format numeric dice
   * optionsConverter.formatCoreNotation({ sides: 20, quantity: 1 }); // "1d20"
   *
   * @example
   * // Format custom dice
   * optionsConverter.formatCoreNotation({
   *   sides: ['Heads', 'Tails'],
   *   quantity: 1
   * }); // "1d{HeadsTails}"
   *
   * @private
   */
  formatCoreNotation(options: RollOptions): string {
    const { quantity = 1, sides } = options

    if (Array.isArray(sides)) {
      return `${String(quantity)}d{${sides.join('')}}`
    }

    return `${String(quantity)}d${String(sides)}`
  },

  /**
   * Formats the modifier part of dice notation
   *
   * @param modifiers - The modifier options to format
   * @returns Modifier notation string
   *
   * @example
   * // Format drop lowest modifier
   * optionsConverter.formatModifierNotation({ drop: { lowest: 1 } }); // "L"
   *
   * @example
   * // Format multiple modifiers
   * optionsConverter.formatModifierNotation({
   *   drop: { lowest: 1 },
   *   plus: 2
   * }); // "L+2"
   *
   * @private
   */
  formatModifierNotation(modifiers: ModifierOptions | undefined): string {
    if (!modifiers) {
      return ''
    }

    return [
      new CapModifier(modifiers.cap).toNotation(),
      new DropModifier(modifiers.drop).toNotation(),
      new ReplaceModifier(modifiers.replace).toNotation(),
      new RerollModifier(modifiers.reroll).toNotation(),
      new ExplodeModifier(modifiers.explode).toNotation(),
      new UniqueModifier(modifiers.unique).toNotation(),
      new PlusModifier(modifiers.plus).toNotation(),
      new MinusModifier(modifiers.minus).toNotation()
    ]
      .filter((notation): notation is string => typeof notation === 'string')
      .join('')
  },

  /**
   * Formats a human-readable description of the core dice roll
   *
   * @param options - The roll options to format
   * @returns Core description string
   *
   * @example
   * // Format description for numeric dice
   * optionsConverter.formatCoreDescription({ sides: 20, quantity: 1 });
   * // "Roll 1 20-sided die"
   *
   * @example
   * // Format description for multiple dice
   * optionsConverter.formatCoreDescription({ sides: 6, quantity: 3 });
   * // "Roll 3 6-sided dice"
   *
   * @example
   * // Format description for custom dice
   * optionsConverter.formatCoreDescription({
   *   sides: ['Heads', 'Tails'],
   *   quantity: 1
   * });
   * // "Roll 1 die with the following sides: (Heads,Tails)"
   *
   * @private
   */
  formatCoreDescription(options: RollOptions): string {
    const { sides, quantity = 1 } = options

    const base = `Roll ${String(quantity)}`
    let descriptor = 'die'
    if (quantity > 1) {
      descriptor = 'dice'
    }

    if (Array.isArray(sides)) {
      let formattedSides = ''
      for (const s of sides) {
        if (s === '') {
          formattedSides += ' '
        } else {
          if (formattedSides.length > 0) {
            formattedSides += ','
          }
          formattedSides += s
        }
      }
      return `${base} ${descriptor} with the following sides: (${formattedSides})`
    }

    return `${base} ${String(sides)}-sided ${descriptor}`
  },

  /**
   * Formats human-readable descriptions of all modifiers
   *
   * @param options - The roll options containing modifiers to format
   * @returns Array of modifier description strings
   *
   * @example
   * // Format descriptions for drop lowest modifier
   * optionsConverter.formatModifierDescriptions({
   *   sides: 20,
   *   quantity: 2,
   *   modifiers: { drop: { lowest: 1 } }
   * });
   * // ["Drop lowest"]
   *
   * @example
   * // Format descriptions for multiple modifiers
   * optionsConverter.formatModifierDescriptions({
   *   sides: 6,
   *   quantity: 3,
   *   modifiers: {
   *     drop: { lowest: 1 },
   *     plus: 2
   *   }
   * });
   * // ["Drop lowest", "Add 2"]
   *
   * @private
   */
  formatModifierDescriptions(options: RollOptions): string[] {
    if (!options.modifiers) {
      return []
    }

    return [
      new CapModifier(options.modifiers.cap).toDescription(),
      new DropModifier(options.modifiers.drop).toDescription(),
      new ReplaceModifier(options.modifiers.replace).toDescription(),
      new RerollModifier(options.modifiers.reroll).toDescription(),
      new ExplodeModifier(options.modifiers.explode).toDescription(),
      new UniqueModifier(options.modifiers.unique).toDescription(),
      new PlusModifier(options.modifiers.plus).toDescription(),
      new MinusModifier(options.modifiers.minus).toDescription()
    ]
      .flat()
      .filter((desc): desc is string => typeof desc === 'string')
      .filter((desc) => desc.length > 0)
  }
}
