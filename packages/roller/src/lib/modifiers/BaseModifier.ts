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
    return Array.from(notationString.matchAll(pattern), (match) => match[0])
  }

  protected static createBracedComparisonPattern(
    prefix: string,
    suffix = '',
    requireOperator = false
  ): RegExp {
    const operator = requireOperator ? '[<>]' : '[<>]?'
    const numberWithOperator = `${operator}\\d+`
    const commaSeparatedList = `(?:${numberWithOperator},)*${numberWithOperator}`
    const bracedContent = `{${commaSeparatedList}}`

    return new RegExp(`${prefix}${bracedContent}${suffix}`, 'g')
  }

  protected static createBracedReplacementPattern(
    prefix: string,
    suffix = ''
  ): RegExp {
    const replacementPair = '[<>]?\\d+=\\d+'
    const commaSeparatedPairs = `(?:${replacementPair},)*${replacementPair}`
    const bracedContent = `{${commaSeparatedPairs}}`

    return new RegExp(`${prefix}${bracedContent}${suffix}`, 'g')
  }

  protected toModifierLog(
    modifier: string,
    initialRolls: number[],
    newRolls: number[]
  ): ModifierLog {
    const baseLog = { modifier, options: this.options }

    // Handle simple cases first
    if (initialRolls === newRolls) {
      return { ...baseLog, added: [], removed: [] }
    }

    if (initialRolls.length === 0) {
      return { ...baseLog, added: [...newRolls], removed: [] }
    }

    if (newRolls.length === 0) {
      return { ...baseLog, added: [], removed: [...initialRolls] }
    }

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

    return { ...baseLog, added, removed }
  }

  protected formatHumanList(list: (number | string)[]): string {
    if (list.length === 0) return ''
    if (list.length === 1) return `[${String(list[0])}]`

    const formattedItems = list.map((item) => `[${String(item)}]`)
    const lastItem = formattedItems.pop()

    return `${formattedItems.join(' ')} and ${lastItem}`
  }

  protected formatGreaterLessNotation(
    options: ComparisonOptions,
    list: string[] = []
  ): string[] {
    return this.formatGreaterLessComparison(
      options,
      (value) => `>${String(value)}`,
      (value) => `<${String(value)}`,
      list
    )
  }

  protected formatGreaterLessDescription(
    options: ComparisonOptions,
    list: string[] = []
  ): string[] {
    return this.formatGreaterLessComparison(
      options,
      (value) => `greater than [${String(value)}]`,
      (value) => `less than [${String(value)}]`,
      list
    )
  }

  private formatGreaterLessComparison(
    options: ComparisonOptions,
    greaterThanFormatter: (value: number) => string,
    lessThanFormatter: (value: number) => string,
    list: string[] = []
  ): string[] {
    if (options.greaterThan) {
      list.push(greaterThanFormatter(options.greaterThan))
    }
    if (options.lessThan) {
      list.push(lessThanFormatter(options.lessThan))
    }
    return list
  }
}
