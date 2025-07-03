import type {
  ComparisonOptions,
  ModifierOptions,
  NumericRollBonus
} from '../types'
import { BaseModifier } from './BaseModifier'

export class CapModifier extends BaseModifier<ComparisonOptions> {
  public static readonly pattern: RegExp = new RegExp(
    `${/[Cc]/.source}${/{(?:[<>]\d+,)*[<>]\d+}/.source}`,
    'g'
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
          .replaceAll(/{|}/g, '')
          .split(',')

        const capOptions = capString.reduce<ComparisonOptions>(
          (innerAcc, note) => {
            if (note.includes('<')) {
              return {
                ...innerAcc,
                lessThan: Number(note.replaceAll('<', ''))
              }
            }
            return {
              ...innerAcc,
              greaterThan: Number(note.replaceAll('>', ''))
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
      if (greaterThan !== undefined && roll > greaterThan) {
        return value ?? greaterThan
      }
      if (lessThan !== undefined && roll < lessThan) {
        return value ?? lessThan
      }
      return roll
    }
  }

  public apply(bonus: NumericRollBonus): NumericRollBonus {
    if (this.options === undefined) return bonus
    const rolls = bonus.rolls.map(CapModifier.applySingleCap(this.options))
    const logs = [...bonus.logs, this.toModifierLog('cap', bonus.rolls, rolls)]
    return {
      ...bonus,
      rolls,
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
