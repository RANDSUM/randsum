import type { ModifierOptions } from '../../types'

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
