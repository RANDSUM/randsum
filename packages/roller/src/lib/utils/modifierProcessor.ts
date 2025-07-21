import type { ModifierOptions } from '../../types'
import type { BaseModifier } from '../modifiers'
import {
  ArithmeticModifier,
  CapModifier,
  DropModifier,
  ExplodeModifier,
  ReplaceModifier,
  RerollModifier,
  UniqueModifier
} from '../modifiers'

export class ModifierProcessor {
  private readonly modifiers: ModifierOptions

  constructor(modifiers: ModifierOptions) {
    this.modifiers = modifiers
  }

  private createModifierInstances(): BaseModifier[] {
    return [
      new CapModifier(this.modifiers.cap),
      new DropModifier(this.modifiers.drop),
      new ReplaceModifier(this.modifiers.replace),
      new RerollModifier(this.modifiers.reroll),
      new ExplodeModifier(this.modifiers.explode),
      new UniqueModifier(this.modifiers.unique),
      ArithmeticModifier.createPlus(this.modifiers.plus),
      ArithmeticModifier.createMinus(this.modifiers.minus)
    ]
  }

  public toDescriptions(): string[] {
    return this.createModifierInstances()
      .map((modifier) => modifier.toDescription())
      .flat()
      .filter((desc): desc is string => typeof desc === 'string')
      .filter((desc) => desc.length > 0)
  }

  public toNotations(): string {
    return this.createModifierInstances()
      .map((modifier) => modifier.toNotation())
      .filter((notation): notation is string => typeof notation === 'string')
      .join('')
  }

  public static processDescriptions(modifiers?: ModifierOptions): string[] {
    if (!modifiers) return []
    return new ModifierProcessor(modifiers).toDescriptions()
  }

  public static processNotations(modifiers?: ModifierOptions): string {
    if (!modifiers) return ''
    return new ModifierProcessor(modifiers).toNotations()
  }
}
