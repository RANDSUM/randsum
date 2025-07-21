import type {
  ComparisonOptions,
  ModifierOptions,
  NumericRollBonus
} from '../../types/modifiers'
import { BaseModifier } from './BaseModifier'

export class CapModifier extends BaseModifier<ComparisonOptions> {
  public static readonly pattern: RegExp = this.createBracedComparisonPattern(
    /[Cc]/.source,
    '',
    true
  )

  public static override parse(
    modifiersString: string
  ): Pick<ModifierOptions, 'cap'> {
    const notations = this.extractMatches(modifiersString, CapModifier.pattern)
    if (notations.length === 0) {
      return {}
    }
    return notations.reduce<Pick<ModifierOptions, 'cap'>>(
      (acc, notationString = '') => {
        const capString = (notationString.split(/[Cc]/)[1] ?? '')
          .replace(/[{}]/g, '')
          .split(',')

        const capOptions = capString.reduce<ComparisonOptions>(
          (innerAcc, note) => {
            if (note.includes('<')) {
              return {
                ...innerAcc,
                lessThan: Number(note.replace(/</g, ''))
              }
            }
            return {
              ...innerAcc,
              greaterThan: Number(note.replace(/>/g, ''))
            }
          },
          {}
        )

        return {
          cap: {
            ...acc.cap,
            ...capOptions
          }
        }
      },
      { cap: {} }
    )
  }

  public static applySingleCap = (
    { greaterThan, lessThan }: ComparisonOptions,
    value?: number
  ): ((roll: number) => number) => {
    return (roll: number) => {
      const upperBounded =
        greaterThan !== undefined && roll > greaterThan
          ? (value ?? greaterThan)
          : roll

      const lowerBounded =
        lessThan !== undefined && upperBounded < lessThan
          ? (value ?? lessThan)
          : upperBounded

      return lowerBounded
    }
  }

  public apply(bonus: NumericRollBonus): NumericRollBonus {
    if (this.options === undefined) return bonus
    const rolls = bonus.rolls.map(CapModifier.applySingleCap(this.options))
    const logs = [...bonus.logs, this.toModifierLog('cap', bonus.rolls, rolls)]
    return {
      rolls,
      simpleMathModifier: bonus.simpleMathModifier,
      logs
    }
  }

  public toDescription(): string[] | undefined {
    if (this.options === undefined) return undefined
    return this.formatGreaterLessDescription(this.options).map(
      (str) => `No Rolls ${String(str)}`
    )
  }

  public toNotation = (): string | undefined => {
    if (this.options === undefined) return undefined
    const capList = this.formatGreaterLessNotation(this.options)
    return `C{${capList.join(',')}}`
  }
}
