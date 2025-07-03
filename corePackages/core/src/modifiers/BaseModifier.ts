import type {
  ModifierConfig,
  ModifierLog,
  ModifierOptions,
  NumericRollBonus,
  RequiredNumericRollParameters
} from '../types'

export abstract class BaseModifier<T extends ModifierConfig = ModifierConfig> {
  protected options: T | undefined

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
}
