import type { ModifierOptions } from '../../types'

export const MODIFIER_KEYS: (keyof ModifierOptions)[] = [
  'cap',
  'drop',
  'replace',
  'reroll',
  'explode',
  'unique',
  'plus',
  'minus'
] as const

export const MODIFIER_ORDER: (keyof ModifierOptions)[] = MODIFIER_KEYS
