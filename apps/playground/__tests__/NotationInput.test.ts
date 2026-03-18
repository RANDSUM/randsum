import { describe, expect, test } from 'bun:test'
import type { TokenCategory } from '@randsum/roller/tokenize'
import {
  tokenCategoryToClass,
  validationStateToBorderColor
} from '../src/components/notationInputUtils'

describe('tokenCategoryToClass', () => {
  test('maps Core to token-core', () => {
    expect(tokenCategoryToClass('Core')).toBe('token-core')
  })

  test('maps Special to token-special', () => {
    const specialCategories: TokenCategory[] = ['Special']
    for (const c of specialCategories) {
      expect(tokenCategoryToClass(c)).toBe('token-special')
    }
  })

  test('maps Pool to token-pool', () => {
    expect(tokenCategoryToClass('Pool')).toBe('token-pool')
  })

  test('maps Explode/Counting/Order to token-modifier', () => {
    const modifierCategories: TokenCategory[] = ['Explode', 'Counting', 'Order']
    for (const c of modifierCategories) {
      expect(tokenCategoryToClass(c)).toBe('token-modifier')
    }
  })

  test('maps Arithmetic to token-arithmetic', () => {
    expect(tokenCategoryToClass('Arithmetic')).toBe('token-arithmetic')
  })

  test('maps unknown to token-unknown', () => {
    expect(tokenCategoryToClass('unknown')).toBe('token-unknown')
  })
})

describe('validationStateToBorderColor', () => {
  test('empty returns --pg-color-border', () => {
    expect(validationStateToBorderColor('empty')).toBe('var(--pg-color-border)')
  })

  test('valid returns --pg-color-accent', () => {
    expect(validationStateToBorderColor('valid')).toBe('var(--pg-color-accent)')
  })

  test('invalid returns --pg-color-error', () => {
    expect(validationStateToBorderColor('invalid')).toBe('var(--pg-color-error)')
  })
})
