import type { RequiredNumericRollParameters } from '../../types/core'
import type { ModifierOptions, NumericRollBonus } from '../../types/modifiers'
import { BaseModifier } from './BaseModifier'

export class ExplodeModifier extends BaseModifier<boolean> {
  public static readonly pattern: RegExp = /!/g

  public static override parse = (
    modifiersString: string
  ): Pick<ModifierOptions, 'explode'> => {
    const notations = this.extractMatches(
      modifiersString,
      ExplodeModifier.pattern
    )
    if (notations.length === 0) {
      return {}
    }
    return { explode: true }
  }

  public apply(
    bonus: NumericRollBonus,
    { sides }: RequiredNumericRollParameters,
    rollOne: () => number
  ): NumericRollBonus {
    if (this.options === undefined) return bonus

    let explodeCount = 0
    for (const roll of bonus.rolls) {
      if (roll === sides) {
        explodeCount++
      }
    }

    if (explodeCount === 0) {
      return bonus
    }

    const explodedRolls = new Array<number>(bonus.rolls.length + explodeCount)

    for (let i = 0; i < bonus.rolls.length; i++) {
      explodedRolls[i] = Number(bonus.rolls[i])
    }

    for (let i = 0; i < explodeCount; i++) {
      explodedRolls[bonus.rolls.length + i] = rollOne()
    }

    const logs = [
      ...bonus.logs,
      this.toModifierLog('explode', bonus.rolls, explodedRolls)
    ]

    return {
      rolls: explodedRolls,
      simpleMathModifier: bonus.simpleMathModifier,
      logs
    }
  }

  public toDescription = (): string[] | undefined => {
    if (this.options === undefined) return undefined
    return ['Exploding Dice']
  }

  public toNotation = (): string | undefined => {
    if (this.options === undefined) return undefined
    return '!'
  }
}
