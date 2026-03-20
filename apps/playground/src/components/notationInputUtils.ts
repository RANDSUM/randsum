import type { TokenCategory } from '@randsum/roller/tokenize'

export type ValidationState = 'empty' | 'valid' | 'invalid'

export function tokenCategoryToClass(category: TokenCategory): string {
  if (category === 'Core') return 'token-core'
  if (category === 'Special') return 'token-special'
  if (category === 'Filter' || category === 'Clamp' || category === 'Map') return 'token-pool'
  if (
    category === 'Generate' ||
    category === 'Accumulate' ||
    category === 'Substitute' ||
    category === 'Reinterpret' ||
    category === 'Dispatch' ||
    category === 'Order'
  )
    return 'token-modifier'
  if (category === 'Scale') return 'token-arithmetic'
  return 'token-unknown'
}

// Backwards-compatible alias — will be removed when playground test suite is updated
export function tokenTypeToClass(category: string): string {
  return tokenCategoryToClass(category as TokenCategory)
}

export function validationStateToBorderColor(state: ValidationState): string {
  if (state === 'valid') return 'var(--pg-color-accent)'
  if (state === 'invalid') return 'var(--pg-color-error)'
  return 'var(--pg-color-border)'
}
