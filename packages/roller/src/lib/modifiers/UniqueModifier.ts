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
      const notUnique = notationString
        .replaceAll(/[Uu]{/g, '')
        .replaceAll('}', '')
        .split(',')

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

    const filteredArray = new Set(
      bonus.rolls.filter((n) => !notUnique.includes(Number(n)))
    )

    const uniqueRolls = bonus.rolls.map(Number).map((roll, index, array) => {
      let newRoll: number
      if (array.indexOf(roll) === index || notUnique.includes(roll)) {
        return roll
      }
      do {
        newRoll = rollOne()
      } while (filteredArray.has(newRoll))
      return newRoll
    })

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
