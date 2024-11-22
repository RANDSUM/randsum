import type { RollParameters } from '../../types'
import {
  applyReroll,
  applyUnique,
  applyReplace,
  applySingleCap,
  applyDrop,
  applyExplode
} from './modifierApplicators'
import type { RollBonuses } from './types'

export function applyModifiers(
  poolParameters: RollParameters,
  initialRolls: number[]
): RollBonuses {
  const rollBonuses = {
    simpleMathModifier: 0,
    rolls: initialRolls as number[]
  }

  const {
    config: { sides, quantity, modifiers = {} },
    die
  } = poolParameters

  const rollOne: () => number = () => die.roll()

  return Object.keys(modifiers).reduce((bonuses, key) => {
    switch (key) {
      case 'reroll':
        return {
          ...bonuses,
          rolls: modifiers.reroll
            ? applyReroll(bonuses.rolls, modifiers.reroll, rollOne)
            : bonuses.rolls
        }

      case 'unique':
        return {
          ...bonuses,
          rolls: modifiers.unique
            ? applyUnique(
                bonuses.rolls,
                { sides, quantity: quantity || 1, unique: modifiers.unique },
                rollOne
              )
            : bonuses.rolls
        }

      case 'replace':
        return {
          ...bonuses,
          rolls: modifiers.replace
            ? applyReplace(bonuses.rolls, modifiers.replace)
            : bonuses.rolls
        }

      case 'cap':
        return {
          ...bonuses,
          rolls: modifiers.cap
            ? bonuses.rolls.map(applySingleCap(modifiers.cap))
            : bonuses.rolls
        }

      case 'drop':
        return {
          ...bonuses,
          rolls: modifiers.drop
            ? applyDrop(bonuses.rolls, modifiers.drop)
            : bonuses.rolls
        }

      case 'explode':
        return {
          ...bonuses,
          rolls: modifiers.explode
            ? applyExplode(bonuses.rolls, { sides }, rollOne)
            : bonuses.rolls
        }

      case 'plus':
        return {
          ...bonuses,
          simpleMathModifier:
            bonuses.simpleMathModifier + Number(modifiers.plus)
        }

      case 'minus':
        return {
          ...bonuses,
          simpleMathModifier:
            bonuses.simpleMathModifier - Number(modifiers.minus)
        }

      default:
        throw new Error(`Unknown modifier: ${key}`)
    }
  }, rollBonuses)
}

export function calculateTotal(rolls: number[], bonus = 0): number {
  return rolls.reduce((acc, cur) => (acc as number) + (cur as number), bonus)
}
