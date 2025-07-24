import type { ModifierOptions } from '../../types/modifiers'
import { ModifierEngine } from './ModifierEngine'

export class ModifierProcessor {
  private readonly modifiers: ModifierOptions

  constructor(modifiers: ModifierOptions) {
    this.modifiers = modifiers
  }

  public toDescriptions(): string[] {
    const modifierTypes: (keyof ModifierOptions)[] = [
      'cap',
      'drop',
      'replace',
      'reroll',
      'explode',
      'unique',
      'plus',
      'minus'
    ]

    return modifierTypes
      .map(type => ModifierEngine.toDescription(type, this.modifiers[type]))
      .flat()
      .filter((desc): desc is string => typeof desc === 'string')
      .filter(desc => desc.length > 0)
  }

  public toNotations(): string {
    const modifierTypes: (keyof ModifierOptions)[] = [
      'cap',
      'drop',
      'replace',
      'reroll',
      'explode',
      'unique',
      'plus',
      'minus'
    ]

    return modifierTypes
      .map(type => ModifierEngine.toNotation(type, this.modifiers[type]))
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
