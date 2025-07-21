import type {
  ModifierOptions,
  NumericRollBonus,
  RequiredNumericRollParameters,
  UniqueOptions
} from '../../types'
import { BaseModifier } from './BaseModifier'

export class UniqueModifier extends BaseModifier<boolean | UniqueOptions> {
  public static readonly pattern: RegExp = /[Uu]({(?:\d+,)*\d+})?/g

  public static override parse(
    modifiersString: string
  ): Pick<ModifierOptions, 'unique'> {
    return this.extractMatches(modifiersString, UniqueModifier.pattern).reduce<
      Pick<ModifierOptions, 'unique'>
    >((acc, notationString) => {
      if (notationString.toUpperCase() === 'U') {
        if (typeof acc.unique === 'object') {
          return acc
        }
        return { unique: true }
      }
      const notUnique = notationString.replace(/[Uu{}]/g, '').split(',')

      return {
        unique: {
          notUnique: notUnique.map(Number)
        }
      }
    }, {})
  }

  public apply(
    bonus: NumericRollBonus,
    { sides, quantity }: RequiredNumericRollParameters,
    rollOne: () => number
  ): NumericRollBonus {
    if (this.options === undefined) return bonus
    if (quantity > sides) {
      throw new Error(
        'Cannot have more rolls than sides when unique is enabled'
      )
    }
    const notUnique = this.generateNotUniqueArray()

    const notUniqueSet = new Set(notUnique)
    const seenValues = new Set<number>()
    const uniqueRolls = new Array<number>(bonus.rolls.length)

    for (let i = 0; i < bonus.rolls.length; i++) {
      const roll = Number(bonus.rolls[i])

      if (notUniqueSet.has(roll) || !seenValues.has(roll)) {
        uniqueRolls[i] = roll
        seenValues.add(roll)
      } else {
        let newRoll: number
        do {
          newRoll = rollOne()
        } while (seenValues.has(newRoll) && !notUniqueSet.has(newRoll))

        uniqueRolls[i] = newRoll
        seenValues.add(newRoll)
      }
    }

    const logs = [
      ...bonus.logs,
      this.toModifierLog('unique', bonus.rolls, uniqueRolls)
    ]

    return {
      ...bonus,
      rolls: uniqueRolls,
      logs
    }
  }

  public toDescription(): string[] | undefined {
    if (this.options === undefined) return undefined
    if (typeof this.options === 'boolean') {
      return ['No Duplicate Rolls']
    }
    return [
      `No Duplicates (except ${this.formatHumanList(this.options.notUnique)})`
    ]
  }

  public toNotation(): string | undefined {
    if (this.options === undefined) return undefined
    if (typeof this.options === 'boolean') return 'U'
    return `U{${this.options.notUnique.join(',')}}`
  }

  private generateNotUniqueArray(): number[] {
    if (this.options === undefined || typeof this.options === 'boolean') {
      return []
    }
    return this.options.notUnique.map(Number)
  }
}
