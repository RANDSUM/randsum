import type { ModifierOptions } from '../../types'

export const MODIFIER_ORDER: readonly (keyof ModifierOptions)[] = [
  'cap',
  'drop',
  'keep',
  'replace',
  'reroll',
  'explode',
  'compound',
  'penetrate',
  'unique',
  'countSuccesses',
  'multiply',
  'plus',
  'minus',
  'multiplyTotal'
] as const
