import { describe, expect, test } from 'bun:test'
import type { TokenType } from '@randsum/roller/tokenize'
import {
  tokenTypeToClass,
  validationStateToBorderColor
} from '../src/components/notationInputUtils'

describe('tokenTypeToClass', () => {
  test('maps core to token-core', () => {
    expect(tokenTypeToClass('core')).toBe('token-core')
  })

  test('maps special die types to token-special', () => {
    const specialTypes: TokenType[] = [
      'percentile',
      'fate',
      'geometric',
      'draw',
      'zeroBias',
      'customFaces'
    ]
    for (const t of specialTypes) {
      expect(tokenTypeToClass(t)).toBe('token-special')
    }
  })

  test('maps drop/keep types to token-pool', () => {
    const poolTypes: TokenType[] = [
      'dropLowest',
      'dropHighest',
      'keepHighest',
      'keepLowest',
      'keepMiddle'
    ]
    for (const t of poolTypes) {
      expect(tokenTypeToClass(t)).toBe('token-pool')
    }
  })

  test('maps reroll/explode/unique/cap/replace to token-modifier', () => {
    const modifierTypes: TokenType[] = [
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
    ]
    for (const t of modifierTypes) {
      expect(tokenTypeToClass(t)).toBe('token-modifier')
    }
  })

  test('maps arithmetic types to token-arithmetic', () => {
    const arithmeticTypes: TokenType[] = [
      'plus',
      'minus',
      'multiply',
      'multiplyTotal',
      'integerDivide',
      'modulo'
    ]
    for (const t of arithmeticTypes) {
      expect(tokenTypeToClass(t)).toBe('token-arithmetic')
    }
  })

  test('maps repeat to token-repeat', () => {
    expect(tokenTypeToClass('repeat')).toBe('token-repeat')
  })

  test('maps label to token-label', () => {
    expect(tokenTypeToClass('label')).toBe('token-label')
  })

  test('maps unknown to token-unknown', () => {
    expect(tokenTypeToClass('unknown')).toBe('token-unknown')
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
