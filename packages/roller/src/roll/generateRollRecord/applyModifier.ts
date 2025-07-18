import type { ModifierOptions, NumericRollBonus } from '../../types'
import {
  CapModifier,
  DropModifier,
  ExplodeModifier,
  ReplaceModifier,
  RerollModifier,
  UniqueModifier
} from '../../lib'

export function applyModifier(
  key: keyof ModifierOptions,
  modifiers: ModifierOptions,
  currentBonuses: NumericRollBonus,
  rollParams: { sides: number; quantity: number; rollOne: () => number }
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
      return new RerollModifier(modifiers.reroll).apply(
        currentBonuses,
        undefined,
        rollParams.rollOne
      )

    case 'unique':
      return new UniqueModifier(modifiers.unique).apply(
        currentBonuses,
        { sides: rollParams.sides, quantity: rollParams.quantity },
        rollParams.rollOne
      )

    case 'replace':
      return new ReplaceModifier(modifiers.replace).apply(currentBonuses)

    case 'cap':
      return new CapModifier(modifiers.cap).apply(currentBonuses)

    case 'drop':
      return new DropModifier(modifiers.drop).apply(currentBonuses)

    case 'explode':
      return new ExplodeModifier(modifiers.explode).apply(
        currentBonuses,
        { sides: rollParams.sides, quantity: rollParams.quantity },
        rollParams.rollOne
      )

    default:
      throw new Error(`Unknown modifier: ${String(key)}`)
  }
}
