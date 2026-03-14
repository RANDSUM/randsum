import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test'
import { SchemaError } from '../../src/lib/errors'
import { resolveExternalRefs } from '../../src/lib/externalRefResolver'
import type { RandSumSpec } from '../../src/lib/types'

const PLAIN_SPEC: RandSumSpec = {
  $schema: 'https://randsum.dev/schemas/v1/randsum.json',
  name: 'Test',
  shortcode: 'test-ext-unit',
  game_url: 'https://example.com',
  roll: {
    dice: { pool: { sides: 6 }, quantity: 1 },
    resolve: 'sum' as const
  }
}

describe('fetchJson error paths', () => {
  const fetchSpyRef: { current: ReturnType<typeof spyOn> | null } = { current: null }

  afterEach(() => {
    fetchSpyRef.current?.mockRestore()
  })

  test('throws SchemaError for HTTP error status', async () => {
    fetchSpyRef.current = spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 404
      } as Response)
    )
    const specWithRef = {
      ...PLAIN_SPEC,
      tables: {
        myTable: { $ref: 'https://example.com/data.json#/tables' }
      }
    }
    try {
      await resolveExternalRefs(specWithRef as RandSumSpec)
      expect(true).toBe(false)
    } catch (e) {
      expect(e).toBeInstanceOf(SchemaError)
      expect((e as SchemaError).code).toBe('EXTERNAL_REF_FAILED')
      expect((e as SchemaError).message).toContain('HTTP 404')
    }
  })

  test('throws SchemaError for network error (non-SchemaError)', async () => {
    fetchSpyRef.current = spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.reject(new Error('Network failure'))
    )
    const specWithRef = {
      ...PLAIN_SPEC,
      tables: {
        myTable: { $ref: 'https://example.com/data.json' }
      }
    }
    try {
      await resolveExternalRefs(specWithRef as RandSumSpec)
      expect(true).toBe(false)
    } catch (e) {
      expect(e).toBeInstanceOf(SchemaError)
      expect((e as SchemaError).code).toBe('EXTERNAL_REF_FAILED')
      expect((e as SchemaError).message).toContain('Network failure')
    }
  })

  test('throws SchemaError for non-Error rejection', async () => {
    fetchSpyRef.current = spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.reject('string error')
    )
    const specWithRef = {
      ...PLAIN_SPEC,
      tables: {
        myTable: { $ref: 'https://example.com/data.json' }
      }
    }
    try {
      await resolveExternalRefs(specWithRef as RandSumSpec)
      expect(true).toBe(false)
    } catch (e) {
      expect(e).toBeInstanceOf(SchemaError)
      expect((e as SchemaError).message).toContain('string error')
    }
  })
})

describe('resolvePointer edge cases', () => {
  const fetchSpyRef: { current: ReturnType<typeof spyOn> | null } = { current: null }

  afterEach(() => {
    fetchSpyRef.current?.mockRestore()
  })

  test('resolves deeply nested pointer', async () => {
    fetchSpyRef.current = spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ a: { b: { c: 'deep-value' } } })
      } as Response)
    )
    const specWithRef = {
      ...PLAIN_SPEC,
      tables: {
        myTable: { $ref: 'https://example.com/data.json#/a/b/c' }
      }
    }
    const result = await resolveExternalRefs(specWithRef as RandSumSpec)
    expect((result as Record<string, unknown>).tables).toEqual({ myTable: 'deep-value' })
  })

  test('resolves root pointer (no hash fragment)', async () => {
    const data = { ranges: [] }
    fetchSpyRef.current = spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(data)
      } as Response)
    )
    const specWithRef = {
      ...PLAIN_SPEC,
      tables: {
        myTable: { $ref: 'https://example.com/data.json' }
      }
    }
    const result = await resolveExternalRefs(specWithRef as RandSumSpec)
    expect((result as Record<string, unknown>).tables).toEqual({ myTable: data })
  })

  test('throws for pointer hitting non-object', async () => {
    fetchSpyRef.current = spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ a: 'not-object' })
      } as Response)
    )
    const specWithRef = {
      ...PLAIN_SPEC,
      tables: {
        myTable: { $ref: 'https://example.com/data.json#/a/b' }
      }
    }
    try {
      await resolveExternalRefs(specWithRef as RandSumSpec)
      expect(true).toBe(false)
    } catch (e) {
      expect(e).toBeInstanceOf(SchemaError)
      expect((e as SchemaError).message).toContain('hit non-object')
    }
  })

  test('throws for pointer with missing segment', async () => {
    fetchSpyRef.current = spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ a: { x: 1 } })
      } as Response)
    )
    const specWithRef = {
      ...PLAIN_SPEC,
      tables: {
        myTable: { $ref: 'https://example.com/data.json#/a/missing' }
      }
    }
    try {
      await resolveExternalRefs(specWithRef as RandSumSpec)
      expect(true).toBe(false)
    } catch (e) {
      expect(e).toBeInstanceOf(SchemaError)
      expect((e as SchemaError).message).toContain('segment "missing" not found')
    }
  })
})

describe('inlineRefs with arrays', () => {
  const fetchSpyRef: { current: ReturnType<typeof spyOn> | null } = { current: null }

  afterEach(() => {
    fetchSpyRef.current?.mockRestore()
  })

  test('inlines refs inside arrays', async () => {
    const resolved = { key: 'value' }
    fetchSpyRef.current = spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(resolved)
      } as Response)
    )
    const specWithArrayRef = {
      ...PLAIN_SPEC,
      customList: [{ $ref: 'https://example.com/data.json' }, 'plain-string', 42]
    }
    const result = await resolveExternalRefs(specWithArrayRef as unknown as RandSumSpec)
    const list = (result as Record<string, unknown>).customList as unknown[]
    expect(list[0]).toEqual(resolved)
    expect(list[1]).toBe('plain-string')
    expect(list[2]).toBe(42)
  })

  test('inlines refs in nested objects', async () => {
    const resolved = { data: [1, 2, 3] }
    fetchSpyRef.current = spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(resolved)
      } as Response)
    )
    const specWithNested = {
      ...PLAIN_SPEC,
      nested: {
        deep: {
          ref: { $ref: 'https://example.com/data.json' }
        }
      }
    }
    const result = await resolveExternalRefs(specWithNested as unknown as RandSumSpec)
    const nested = (result as Record<string, unknown>).nested as Record<
      string,
      Record<string, unknown>
    >
    expect(nested.deep.ref).toEqual(resolved)
  })
})

describe('collectExternalRefs with nested objects', () => {
  const fetchSpyRef: { current: ReturnType<typeof spyOn> | null } = { current: null }

  afterEach(() => {
    fetchSpyRef.current?.mockRestore()
  })

  test('collects refs from deeply nested structures', async () => {
    const data = { result: 'resolved' }
    fetchSpyRef.current = spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(data)
      } as Response)
    )
    const specWithDeep = {
      ...PLAIN_SPEC,
      level1: {
        level2: {
          level3: { $ref: 'https://example.com/deep.json' }
        }
      }
    }
    const result = await resolveExternalRefs(specWithDeep as unknown as RandSumSpec)
    const level1 = (result as Record<string, unknown>).level1 as Record<
      string,
      Record<string, unknown>
    >
    expect(level1.level2.level3).toEqual(data)
  })
})
