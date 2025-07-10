import type {
  ModifierOptions,
  RollBonus,
  RequiredRollParameters
} from '../../types'
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
    bonus: RollBonus,
    { sides }: RequiredRollParameters,
    rollOne: () => number
  ): RollBonus {
    if (this.options === undefined) return bonus
    const explodeCount = bonus.rolls.filter((roll) => roll === sides).length
    const explodeResults = Array.from({ length: explodeCount }, rollOne)
    const explodedRolls = [...bonus.rolls, ...explodeResults]

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
