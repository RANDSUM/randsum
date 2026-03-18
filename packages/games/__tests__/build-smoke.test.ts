import { describe, expect, test } from 'bun:test'
import {
  SchemaError,
  generateCode,
  loadSpec,
  lookupByRange,
  resolveExternalRefs,
  specToFilename,
  validateSpec
} from '@randsum/games/schema'

describe('schema build smoke test', () => {
  test('all exported functions are defined', () => {
    expect(typeof generateCode).toBe('function')
    expect(typeof loadSpec).toBe('function')
    expect(typeof lookupByRange).toBe('function')
    expect(typeof resolveExternalRefs).toBe('function')
    expect(typeof specToFilename).toBe('function')
    expect(typeof validateSpec).toBe('function')
  })

  test('SchemaError is a constructable class', () => {
    expect(typeof SchemaError).toBe('function')
    const err = new SchemaError('test message', 'INVALID_SPEC')
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('test message')
  })

  test('validateSpec rejects invalid input', () => {
    const result = validateSpec({})
    expect(result.valid).toBe(false)
  })

  test('specToFilename converts names correctly', () => {
    expect(specToFilename('Blades in the Dark')).toBe('blades-in-the-dark')
    expect(specToFilename('D&D 5th Edition')).toBe('dd-5th-edition')
  })
})
