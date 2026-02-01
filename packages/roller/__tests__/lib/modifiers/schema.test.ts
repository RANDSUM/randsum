import { describe, expect, test } from 'bun:test'
import {
  type ModifierContext,
  assertParameters,
  assertRequiredContext,
  assertRollFn
} from '../../../src/lib/modifiers/schema'

describe('assertRollFn', () => {
  test('returns context with rollOne when provided', () => {
    const mockRollOne = (): number => 5
    const ctx: ModifierContext = { rollOne: mockRollOne }

    const result = assertRollFn(ctx)

    expect(result.rollOne).toBe(mockRollOne)
    expect(result.rollOne()).toBe(5)
  })

  test('preserves parameters when provided with rollOne', () => {
    const mockRollOne = (): number => 3
    const ctx: ModifierContext = {
      rollOne: mockRollOne,
      parameters: { sides: 6, quantity: 4 }
    }

    const result = assertRollFn(ctx)

    expect(result.rollOne).toBe(mockRollOne)
    expect(result.parameters).toEqual({ sides: 6, quantity: 4 })
  })

  test('throws when rollOne is undefined', () => {
    const ctx: ModifierContext = {}

    expect(() => assertRollFn(ctx)).toThrow(
      'Internal error: rollOne function required but not provided'
    )
  })

  test('throws when only parameters provided', () => {
    const ctx: ModifierContext = { parameters: { sides: 6, quantity: 2 } }

    expect(() => assertRollFn(ctx)).toThrow(
      'Internal error: rollOne function required but not provided'
    )
  })
})

describe('assertParameters', () => {
  test('returns context with parameters when provided', () => {
    const ctx: ModifierContext = { parameters: { sides: 20, quantity: 1 } }

    const result = assertParameters(ctx)

    expect(result.parameters).toEqual({ sides: 20, quantity: 1 })
  })

  test('preserves rollOne when provided with parameters', () => {
    const mockRollOne = (): number => 10
    const ctx: ModifierContext = {
      rollOne: mockRollOne,
      parameters: { sides: 20, quantity: 1 }
    }

    const result = assertParameters(ctx)

    expect(result.parameters).toEqual({ sides: 20, quantity: 1 })
    expect(result.rollOne).toBe(mockRollOne)
  })

  test('throws when parameters is undefined', () => {
    const ctx: ModifierContext = {}

    expect(() => assertParameters(ctx)).toThrow(
      'Internal error: parameters required but not provided'
    )
  })

  test('throws when only rollOne provided', () => {
    const mockRollOne = (): number => 5
    const ctx: ModifierContext = { rollOne: mockRollOne }

    expect(() => assertParameters(ctx)).toThrow(
      'Internal error: parameters required but not provided'
    )
  })
})

describe('assertRequiredContext', () => {
  test('returns context with both rollOne and parameters', () => {
    const mockRollOne = (): number => 6
    const ctx: ModifierContext = {
      rollOne: mockRollOne,
      parameters: { sides: 6, quantity: 4 }
    }

    const result = assertRequiredContext(ctx)

    expect(result.rollOne).toBe(mockRollOne)
    expect(result.rollOne()).toBe(6)
    expect(result.parameters).toEqual({ sides: 6, quantity: 4 })
  })

  test('throws when rollOne is missing', () => {
    const ctx: ModifierContext = { parameters: { sides: 6, quantity: 4 } }

    expect(() => assertRequiredContext(ctx)).toThrow(
      'Internal error: rollOne function required but not provided'
    )
  })

  test('throws when parameters is missing', () => {
    const mockRollOne = (): number => 5
    const ctx: ModifierContext = { rollOne: mockRollOne }

    expect(() => assertRequiredContext(ctx)).toThrow(
      'Internal error: parameters required but not provided'
    )
  })

  test('throws when both are missing', () => {
    const ctx: ModifierContext = {}

    expect(() => assertRequiredContext(ctx)).toThrow(
      'Internal error: rollOne function required but not provided'
    )
  })
})

describe('ModifierContext type usage', () => {
  test('context can be created with all optional properties', () => {
    const ctx: ModifierContext = {}
    expect(ctx.rollOne).toBeUndefined()
    expect(ctx.parameters).toBeUndefined()
  })

  test('context can have just rollOne', () => {
    const ctx: ModifierContext = { rollOne: () => 1 }
    expect(ctx.rollOne?.()).toBe(1)
    expect(ctx.parameters).toBeUndefined()
  })

  test('context can have just parameters', () => {
    const ctx: ModifierContext = { parameters: { sides: 8, quantity: 3 } }
    expect(ctx.rollOne).toBeUndefined()
    expect(ctx.parameters?.sides).toBe(8)
    expect(ctx.parameters?.quantity).toBe(3)
  })

  test('context can have both properties', () => {
    const mockRollOne = (): number => 4
    const ctx: ModifierContext = {
      rollOne: mockRollOne,
      parameters: { sides: 10, quantity: 2 }
    }
    expect(ctx.rollOne?.()).toBe(4)
    expect(ctx.parameters?.sides).toBe(10)
  })
})
