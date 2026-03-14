import type { Mock } from 'bun:test'
import { afterEach, describe, expect, spyOn, test } from 'bun:test'
import { generateCode } from '../../src/lib/codegen'
import { SchemaError } from '../../src/lib/errors'

describe('generateCode with invalid spec', () => {
  test('throws SchemaError for invalid spec', async () => {
    const badSpec = { name: 'bad' } as never
    try {
      await generateCode(badSpec)
      expect(true).toBe(false)
    } catch (e) {
      expect(e).toBeInstanceOf(SchemaError)
      expect((e as SchemaError).code).toBe('INVALID_SPEC')
      expect((e as SchemaError).message).toContain('Invalid spec')
    }
  })
})

describe('fetchRemoteData', () => {
  const fetchSpyRef: { current: Mock<typeof fetch> | null } = { current: null }

  afterEach(() => {
    fetchSpyRef.current?.mockRestore()
  })

  test('throws SchemaError for non-ok response', async () => {
    fetchSpyRef.current = spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 500
      } as Response)
    )
    const spec = {
      $schema: 'https://randsum.dev/schemas/v1/randsum.json',
      name: 'RTL Test',
      shortcode: 'test-rtl-fetch',
      game_url: 'https://example.com',
      roll: {
        inputs: { tableName: { type: 'string' as const } },
        dice: { pool: { sides: 20 }, quantity: 1 },
        resolve: {
          remoteTableLookup: {
            url: 'https://example.com/tables.json',
            find: { field: 'name', input: 'tableName' },
            tableField: 'table',
            resultMapping: { key: { $lookupResult: 'key' } }
          }
        }
      }
    }
    try {
      await generateCode(spec)
      expect(true).toBe(false)
    } catch (e) {
      expect(e).toBeInstanceOf(SchemaError)
      expect((e as SchemaError).code).toBe('INVALID_SPEC')
      expect((e as SchemaError).message).toContain('Failed to fetch remote table data')
    }
  })

  test('resolves dataPath when provided', async () => {
    fetchSpyRef.current = spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ nested: { data: [{ name: 'Entry', table: {} }] } })
      } as Response)
    )
    const spec = {
      $schema: 'https://randsum.dev/schemas/v1/randsum.json',
      name: 'DataPath Test',
      shortcode: 'test-dp',
      game_url: 'https://example.com',
      roll: {
        inputs: { tableName: { type: 'string' as const } },
        dice: { pool: { sides: 20 }, quantity: 1 },
        resolve: {
          remoteTableLookup: {
            url: 'https://example.com/tables.json',
            dataPath: 'nested.data',
            find: { field: 'name', input: 'tableName' },
            tableField: 'table',
            resultMapping: { key: { $lookupResult: 'key' } }
          }
        }
      }
    }
    const code = await generateCode(spec)
    expect(code).toContain('const REMOTE_DATA =')
    expect(code).toContain('Entry')
  })

  test('uses cache when available', async () => {
    const cachedData = [{ name: 'Cached', table: {} }]
    const spec = {
      $schema: 'https://randsum.dev/schemas/v1/randsum.json',
      name: 'Cache Test',
      shortcode: 'test-cache',
      game_url: 'https://example.com',
      roll: {
        inputs: { tableName: { type: 'string' as const } },
        dice: { pool: { sides: 20 }, quantity: 1 },
        resolve: {
          remoteTableLookup: {
            url: 'https://example.com/tables.json',
            find: { field: 'name', input: 'tableName' },
            tableField: 'table',
            resultMapping: { key: { $lookupResult: 'key' } }
          }
        }
      }
    }
    const cache = new Map<string, readonly unknown[]>()
    cache.set('https://example.com/tables.json', cachedData)
    const code = await generateCode(spec, { remoteDataCache: cache })
    expect(code).toContain('Cached')
  })
})

describe('codegen for specToFilename', () => {
  test('specToFilename is re-exported', async () => {
    const { specToFilename } = await import('../../src/lib/codegen')
    expect(specToFilename('My Cool Game')).toBe('my-cool-game')
    expect(specToFilename('Test & Fun!')).toBe('test--fun')
  })
})
