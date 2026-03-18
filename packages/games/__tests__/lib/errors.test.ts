import { describe, expect, test } from 'bun:test'

import { RandsumError } from '@randsum/roller/errors'

import { SchemaError } from '../../src/lib/errors'

describe('SchemaError', () => {
  test('constructor takes (message, code)', () => {
    const err = new SchemaError('something broke', 'REF_NOT_FOUND')
    expect(err.message).toBe('something broke')
    expect(err.code).toBe('REF_NOT_FOUND')
  })

  test('instanceof RandsumError is true', () => {
    const err = new SchemaError('test', 'INVALID_SPEC')
    expect(err instanceof RandsumError).toBe(true)
  })

  test('instanceof Error is true', () => {
    const err = new SchemaError('test', 'INVALID_SPEC')
    expect(err instanceof Error).toBe(true)
  })

  test('name is SchemaError', () => {
    const err = new SchemaError('test', 'INVALID_SPEC')
    expect(err.name).toBe('SchemaError')
  })

  test('code is preserved', () => {
    const err = new SchemaError('msg', 'REF_NOT_FOUND')
    expect(err.code).toBe('REF_NOT_FOUND')
  })
})
