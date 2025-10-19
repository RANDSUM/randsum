import type { ModifierOptions } from '../../types'

export const MODIFIER_ORDER: readonly (keyof ModifierOptions)[] = [
  'cap',
  'drop',
  'replace',
  'reroll',
  'explode',
  'unique',
  'plus',
  'minus'
] as const
