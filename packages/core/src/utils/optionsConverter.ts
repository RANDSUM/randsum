import { CapModifier } from '../modifiers/CapModifier'
import { DropModifier } from '../modifiers/DropModifier'
import { ExplodeModifier } from '../modifiers/ExplodeModifier'
import { MinusModifier } from '../modifiers/MinusModifier'
import { PlusModifier } from '../modifiers/PlusModifier'
import { ReplaceModifier } from '../modifiers/ReplaceModifier'
import { RerollModifier } from '../modifiers/RerollModifier'
import { UniqueModifier } from '../modifiers/UniqueModifier'
import type { DiceNotation, ModifierOptions, RollOptions } from '../types'

export const optionsConverter = {
  toNotation(options: RollOptions): DiceNotation {
    const coreNotation = this.formatCoreNotation(options)
    const modifierNotation = this.formatModifierNotation(options.modifiers)
    return `${coreNotation}${modifierNotation}` as DiceNotation
  },

  toDescription(options: RollOptions): string[] {
    return [
      this.formatCoreDescription(options),
      ...this.formatModifierDescriptions(options)
    ]
  },

  formatCoreNotation(options: RollOptions): string {
    const { quantity = 1, sides } = options

    if (Array.isArray(sides)) {
      return `${String(quantity)}d{${sides.join('')}}`
    }

    return `${String(quantity)}d${String(sides)}`
  },

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
