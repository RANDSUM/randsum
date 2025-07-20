import type {
  ComparisonOptions,
  ModifierConfig,
  ModifierLog,
  ModifierOptions,
  NumericRollBonus,
  RequiredNumericRollParameters
} from '../../types'

export abstract class BaseModifier<T extends ModifierConfig = ModifierConfig> {
  protected readonly options: T | undefined

  constructor(options: T | undefined) {
    this.options = options
  }

  public abstract apply(
    bonuses: NumericRollBonus,
    parameters?: RequiredNumericRollParameters,
    rollOne?: () => number
  ): NumericRollBonus

  public abstract toDescription(): string[] | undefined

  public abstract toNotation(): string | undefined

  public static parse(_modifiersString: string): Partial<ModifierOptions> {
    return {}
  }

  protected static extractMatches(
    notationString: string,
    pattern: RegExp
  ): string[] {
    const MAX_INPUT_LENGTH = 1000

    if (notationString.length > MAX_INPUT_LENGTH) {
      throw new Error(
        `Input string too long: ${String(notationString.length)} characters exceeds maximum of ${String(MAX_INPUT_LENGTH)}`
      )
    }

    return [...notationString.matchAll(pattern)].map((matches) => matches[0])
  }

  protected static createBracedComparisonPattern(
    prefix: string,
    suffix = '',
    requireOperator = false
  ): RegExp {
    const operatorPattern = requireOperator ? '[<>]' : '[<>]?'
    const bracedContent = `{(?:${operatorPattern}\\d+,)*${operatorPattern}\\d+}`
    return new RegExp(`${prefix}${bracedContent}${suffix}`, 'g')
  }

  protected static createBracedReplacementPattern(
    prefix: string,
    suffix = ''
  ): RegExp {
    const bracedContent = '{(?:[<>]?\\d+=\\d+,)*[<>]?\\d+=\\d+}'
    return new RegExp(`${prefix}${bracedContent}${suffix}`, 'g')
  }

  protected toModifierLog(
    modifier: string,
    initialRolls: number[],
    newRolls: number[]
  ): ModifierLog {
    const initialFreq = new Map<number, number>()
    const newFreq = new Map<number, number>()

    for (const roll of initialRolls) {
      initialFreq.set(roll, (initialFreq.get(roll) ?? 0) + 1)
    }

    for (const roll of newRolls) {
      newFreq.set(roll, (newFreq.get(roll) ?? 0) + 1)
    }

    const added: number[] = []
    const removed: number[] = []

    const allValues = new Set([...initialRolls, ...newRolls])

    for (const value of allValues) {
      const initialCount = initialFreq.get(value) ?? 0
      const newCount = newFreq.get(value) ?? 0
      const diff = newCount - initialCount

      if (diff > 0) {
        for (let i = 0; i < diff; i++) {
          added.push(value)
        }
      } else if (diff < 0) {
        for (let i = 0; i < Math.abs(diff); i++) {
          removed.push(value)
        }
      }
    }

    return {
      modifier,
      options: this.options,
      added,
      removed
    }
  }

  protected formatHumanList(list: (number | string)[]): string {
    return list
      .map((num, index, list) => {
        if (list.length === 1) return `[${String(num)}]`
        if (index === list.length - 1) return `and [${String(num)}]`
        return `[${String(num)}] `
      })
      .join('')
  }

  protected formatGreaterLessNotation(
    options: ComparisonOptions,
    list: string[] = []
  ): string[] {
    if (options.greaterThan) {
      list.push(`>${String(options.greaterThan)}`)
    }
    if (options.lessThan) {
      list.push(`<${String(options.lessThan)}`)
    }
    return list
  }

  protected formatGreaterLessDescription(
    options: ComparisonOptions,
    list: string[] = []
  ): string[] {
    if (options.greaterThan) {
      list.push(`greater than [${String(options.greaterThan)}]`)
    }
    if (options.lessThan) {
      list.push(`less than [${String(options.lessThan)}]`)
    }
    return list
  }
}
