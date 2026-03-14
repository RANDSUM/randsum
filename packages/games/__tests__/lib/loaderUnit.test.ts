import { afterEach, describe, expect, spyOn, test } from 'bun:test'
import { SchemaError } from '../../src/lib/errors'
import { loadSpec, loadSpecAsync } from '../../src/lib/loader'
import type { RandSumSpec } from '../../src/lib/types'

const VALID_SPEC: RandSumSpec = {
  $schema: 'https://randsum.dev/schemas/v1/randsum.json',
  name: 'Loader Test',
  shortcode: 'test-loader',
  game_url: 'https://example.com',
  roll: {
    dice: { pool: { sides: 6 }, quantity: 1 },
    resolve: 'sum' as const
  }
}

describe('loadSpec with invalid spec', () => {
  test('throws SchemaError for invalid spec object', () => {
    const badSpec = { name: 'bad' } as unknown as RandSumSpec
    expect(() => loadSpec(badSpec)).toThrow(SchemaError)
    expect(() => loadSpec(badSpec)).toThrow('Invalid spec')
  })

  test('throws for non-existent file path', () => {
    expect(() => loadSpec('/tmp/nonexistent-randsum-spec.json')).toThrow()
  })
})

describe('loadSpecAsync with HTTP URLs', () => {
  const fetchSpyRef: { current: ReturnType<typeof spyOn> | null } = { current: null }

  afterEach(() => {
    fetchSpyRef.current?.mockRestore()
  })

  test('loads spec from HTTP URL', async () => {
    fetchSpyRef.current = spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(VALID_SPEC)
      } as Response)
    )
    const result = await loadSpecAsync('https://example.com/spec.json')
    expect(Object.keys(result)).toContain('roll')
    const rollResult = result.roll!()
    expect(typeof rollResult.total).toBe('number')
  })

  test('loads spec from HTTPS URL', async () => {
    fetchSpyRef.current = spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(VALID_SPEC)
      } as Response)
    )
    const result = await loadSpecAsync('https://example.com/spec.json')
    expect(Object.keys(result)).toContain('roll')
  })

  test('throws SchemaError for HTTP error', async () => {
    fetchSpyRef.current = spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as Response)
    )
    try {
      await loadSpecAsync('https://example.com/spec.json')
      expect(true).toBe(false)
    } catch (e) {
      expect(e).toBeInstanceOf(SchemaError)
      expect((e as SchemaError).code).toBe('EXTERNAL_REF_FAILED')
      expect((e as SchemaError).message).toContain('500')
    }
  })

  test('throws for invalid spec from HTTP URL', async () => {
    fetchSpyRef.current = spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ name: 'bad' })
      } as Response)
    )
    try {
      await loadSpecAsync('https://example.com/spec.json')
      expect(true).toBe(false)
    } catch (e) {
      expect(e).toBeInstanceOf(SchemaError)
      expect((e as SchemaError).message).toContain('Invalid spec')
    }
  })
})

describe('loadSpecAsync with file path', () => {
  test('throws for invalid spec from file', async () => {
    // Create a temp file with invalid spec
    const tmpPath = '/tmp/test-invalid-spec.json'
    await Bun.write(tmpPath, JSON.stringify({ name: 'bad' }))
    try {
      await loadSpecAsync(tmpPath)
      expect(true).toBe(false)
    } catch (e) {
      expect(e).toBeInstanceOf(SchemaError)
      expect((e as SchemaError).message).toContain('Invalid spec')
    }
  })
})

describe('loadSpecAsync with spec object', () => {
  test('loads valid spec object', async () => {
    const result = await loadSpecAsync(VALID_SPEC)
    expect(Object.keys(result)).toContain('roll')
    const rollResult = result.roll!()
    expect(typeof rollResult.total).toBe('number')
  })

  test('throws for invalid spec object', async () => {
    const badSpec = { name: 'bad' } as unknown as RandSumSpec
    try {
      await loadSpecAsync(badSpec)
      expect(true).toBe(false)
    } catch (e) {
      expect(e).toBeInstanceOf(SchemaError)
    }
  })
})
