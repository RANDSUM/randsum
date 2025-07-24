import type { ModifierOptions } from '../../types/modifiers'

export const MODIFIER_ORDER: (keyof ModifierOptions)[] = [
  'cap',
  'drop',
  'replace',
  'reroll',
  'explode',
  'unique',
  'plus',
  'minus'
]
