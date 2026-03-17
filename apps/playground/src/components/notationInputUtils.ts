import type { TokenType } from '@randsum/roller/tokenize'

const SPECIAL_TYPES: ReadonlySet<TokenType> = new Set([
  'percentile',
  'fate',
  'geometric',
  'draw',
  'zeroBias',
  'customFaces'
])

const POOL_TYPES: ReadonlySet<TokenType> = new Set([
  'dropLowest',
  'dropHighest',
  'keepHighest',
  'keepLowest',
  'keepMiddle'
])

const MODIFIER_TYPES: ReadonlySet<TokenType> = new Set([
  'reroll',
  'explode',
  'compound',
  'penetrate',
  'explodeSequence',
  'unique',
  'cap',
  'replace',
  'count',
  'countSuccesses',
  'marginOfSuccess',
  'sort',
  'wildDie',
  'dropCondition'
])

const ARITHMETIC_TYPES: ReadonlySet<TokenType> = new Set([
  'plus',
  'minus',
  'multiply',
  'multiplyTotal',
  'integerDivide',
  'modulo'
])

export type ValidationState = 'empty' | 'valid' | 'invalid'

export function tokenTypeToClass(type: TokenType): string {
  if (type === 'core') return 'token-core'
  if (SPECIAL_TYPES.has(type)) return 'token-special'
  if (POOL_TYPES.has(type)) return 'token-pool'
  if (MODIFIER_TYPES.has(type)) return 'token-modifier'
  if (ARITHMETIC_TYPES.has(type)) return 'token-arithmetic'
  if (type === 'repeat') return 'token-repeat'
  if (type === 'label') return 'token-label'
  return 'token-unknown'
}

export function validationStateToBorderColor(state: ValidationState): string {
  if (state === 'valid') return 'var(--pg-color-accent)'
  if (state === 'invalid') return 'var(--pg-color-error)'
  return 'var(--pg-color-border)'
}
