import type {
  ComparisonOptions,
  DropOptions,
  ModifierOptions,
  NumericRollBonus,
  ReplaceOptions,
  RerollOptions,
  UniqueOptions
} from '../../types'
import {
  CapModifier,
  DropModifier,
  ExplodeModifier,
  ReplaceModifier,
  RerollModifier,
  UniqueModifier
} from '../../lib/modifiers'

interface ModifierContext {
  sides: number
  quantity: number
  rollOne: () => number
}

export function applyModifier(
  key: keyof ModifierOptions,
  modifiers: ModifierOptions,
  currentBonuses: NumericRollBonus,
  context: ModifierContext
): NumericRollBonus {
  const modifierValue = modifiers[key]
  if (modifierValue === undefined) {
    return currentBonuses
  }

  switch (key) {
    case 'plus':
      return {
        rolls: currentBonuses.rolls,
        simpleMathModifier: Number(modifierValue),
        logs: currentBonuses.logs
      }

    case 'minus':
      return {
        rolls: currentBonuses.rolls,
        simpleMathModifier: -Number(modifierValue),
        logs: currentBonuses.logs
      }

    case 'reroll':
      return new RerollModifier(modifierValue as RerollOptions).apply(
        currentBonuses,
        undefined,
        context.rollOne
      )

    case 'unique':
      return new UniqueModifier(modifierValue as boolean | UniqueOptions).apply(
        currentBonuses,
        { sides: context.sides, quantity: context.quantity },
        context.rollOne
      )

    case 'replace':
      return new ReplaceModifier(
        modifierValue as ReplaceOptions | ReplaceOptions[]
      ).apply(currentBonuses)

    case 'cap':
      return new CapModifier(modifierValue as ComparisonOptions).apply(
        currentBonuses
      )

    case 'drop':
      return new DropModifier(modifierValue as DropOptions).apply(
        currentBonuses
      )

    case 'explode':
      return new ExplodeModifier(modifierValue as boolean).apply(
        currentBonuses,
        { sides: context.sides, quantity: context.quantity },
        context.rollOne
      )

    default:
      throw new Error(`Unknown modifier: ${String(key)}`)
  }
}
