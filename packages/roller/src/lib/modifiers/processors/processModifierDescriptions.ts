import type { ModifierOptions } from '../../../types'
import { MODIFIER_ORDER } from '../constants'
import { modifierToDescription } from '../modifierToDescription'

export function processModifierDescriptions(modifiers: ModifierOptions | undefined): string[] {
  if (!modifiers) return []

  return MODIFIER_ORDER.map(type => modifierToDescription(type, modifiers[type]))
    .flat()
    .filter((desc): desc is string => typeof desc === 'string')
    .filter(desc => desc.length > 0)
}
