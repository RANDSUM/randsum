import { isDiceNotation } from '../guards'
import {
  CapModifier,
  DropModifier,
  ExplodeModifier,
  MinusModifier,
  PlusModifier,
  ReplaceModifier,
  RerollModifier,
  UniqueModifier
} from '../modifiers'
import type { DiceNotation, RollOptions } from '../../types'

export class OptionsConverter {
  private readonly options: RollOptions

  constructor(options: RollOptions) {
    this.options = options
  }

  public get toNotation(): DiceNotation {
    const proposed = `${this.arithmeticNotation}${this.coreNotation}${this.modifierNotation}`
    if (!isDiceNotation(proposed)) {
      throw new Error(`Invalid notation generated: ${proposed}`)
    }
    return proposed
  }

  public get toDescription(): string[] {
    return [
      this.coreDescription,
      ...this.modifierDescription,
      this.arithmeticDescription
    ]
  }

  private get coreNotation(): string {
    const { quantity = 1, sides } = this.options
    return `${String(quantity)}d${String(sides)}`
  }

  private get arithmeticNotation(): string {
    const { arithmetic } = this.options
    if (arithmetic === 'add') return '+'
    if (arithmetic === 'subtract') return '-'
    return ''
  }

  private get modifierNotation(): string {
    const { modifiers } = this.options
    if (!modifiers) {
      return ''
    }

    return [
      new CapModifier(modifiers.cap).toNotation(),
      new DropModifier(modifiers.drop).toNotation(),
      new ReplaceModifier(modifiers.replace).toNotation(),
      new RerollModifier(modifiers.reroll).toNotation(),
      new ExplodeModifier(modifiers.explode).toNotation(),
      new UniqueModifier(modifiers.unique).toNotation(),
      new PlusModifier(modifiers.plus).toNotation(),
      new MinusModifier(modifiers.minus).toNotation()
    ]
      .filter((notation): notation is string => typeof notation === 'string')
      .join('')
  }

  private get coreDescription(): string {
    const { sides, quantity = 1 } = this.options

    const base = `Roll ${String(quantity)}`
    let descriptor = 'die'
    if (quantity > 1) {
      descriptor = 'dice'
    }

    return `${base} ${String(sides)}-sided ${descriptor}`
  }

  private get modifierDescription(): string[] {
    const { modifiers } = this.options
    if (!modifiers) {
      return []
    }

    return [
      new CapModifier(modifiers.cap).toDescription(),
      new DropModifier(modifiers.drop).toDescription(),
      new ReplaceModifier(modifiers.replace).toDescription(),
      new RerollModifier(modifiers.reroll).toDescription(),
      new ExplodeModifier(modifiers.explode).toDescription(),
      new UniqueModifier(modifiers.unique).toDescription(),
      new PlusModifier(modifiers.plus).toDescription(),
      new MinusModifier(modifiers.minus).toDescription()
    ]
      .flat()
      .filter((desc): desc is string => typeof desc === 'string')
      .filter((desc) => desc.length > 0)
  }

  private get arithmeticDescription(): string {
    const { arithmetic } = this.options
    if (arithmetic === 'add') return 'And Subtract the result'
    if (arithmetic === 'subtract') return 'And Add the result'
    throw new Error(`Unknown arithmetic: ${String(arithmetic)}`)
  }
}
