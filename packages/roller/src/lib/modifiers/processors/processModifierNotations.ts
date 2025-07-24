import type { ModifierOptions } from '../../../types'
import { MODIFIER_ORDER } from '../constants'
import { modifierToNotation } from '../modifierToNotation'

export function processModifierNotations(modifiers: ModifierOptions | undefined): string {
  if (!modifiers) return ''

  return MODIFIER_ORDER.map(type => modifierToNotation(type, modifiers[type]))
    .filter((notation): notation is string => typeof notation === 'string')
    .join('')
}
