import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test'
import { generateCode } from '../src/codegen'
import { validateSpec } from '../src'

const MOCK_REMOTE_DATA = [
  { name: 'CoreTable', table: { '1-5': { label: 'Failure' }, '6-10': { label: 'Success' } } }
]

function mockFetch(data: unknown = MOCK_REMOTE_DATA): ReturnType<typeof spyOn> {
  return spyOn(globalThis, 'fetch').mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data)
    } as Response)
  )
}

const RTL_SPEC = {
  $schema: 'https://randsum.dev/schemas/v1/randsum.json',
  name: 'Remote Lookup Test',
  shortcode: 'test-rtl',
  game_url: 'https://example.com',
  roll: {
    inputs: { tableName: { type: 'string' as const } },
    dice: { pool: { sides: 20 }, quantity: 1 },
    resolve: {
      remoteTableLookup: {
        url: 'https://example.com/tables.json',
        find: {
          field: 'name',
          input: 'tableName'
        },
        tableField: 'table',
        resultMapping: {
          key: { $lookupResult: 'key' },
          tableName: { $input: 'tableName' },
          roll: { expr: 'total' as const }
        }
      }
    }
  }
}

describe('remoteTableLookup schema validation', () => {
  test('spec with remoteTableLookup resolve is valid', () => {
    const result = validateSpec(RTL_SPEC)
    expect(result.valid).toBe(true)
  })

  test('remoteTableLookup missing required fields is invalid', () => {
    const result = validateSpec({
      ...RTL_SPEC,
      roll: {
        ...RTL_SPEC.roll,
        resolve: {
          remoteTableLookup: {
            url: 'https://example.com/tables.json'
            // missing find, tableField, resultMapping
          }
        }
      }
    })
    expect(result.valid).toBe(false)
  })
})

describe('remoteTableLookup codegen', () => {
  const fetchSpyRef: { current: { mockRestore: () => void } | null } = { current: null }

  beforeEach(() => {
    fetchSpyRef.current = mockFetch()
  })

  afterEach(() => {
    fetchSpyRef.current?.mockRestore()
  })

  test('embeds REMOTE_DATA constant', async () => {
    const code = await generateCode(RTL_SPEC)
    expect(code).toContain('const REMOTE_DATA =')
    expect(code).toContain('CoreTable')
  })

  test('imports lookupByRange from @randsum/gameSchema', async () => {
    const code = await generateCode(RTL_SPEC)
    expect(code).toContain('lookupByRange')
    expect(code).toContain("from '@randsum/gameSchema'")
  })

  test('emits find call using REMOTE_DATA', async () => {
    const code = await generateCode(RTL_SPEC)
    expect(code).toContain('const foundTable = REMOTE_DATA.find(t => t.name === input.tableName)')
  })

  test('emits null check for found table', async () => {
    const code = await generateCode(RTL_SPEC)
    expect(code).toContain('if (!foundTable) throw new Error')
  })

  test('emits lookupByRange call with tableField and total', async () => {
    const code = await generateCode(RTL_SPEC)
    expect(code).toContain('lookupByRange(foundTable.table, total)')
  })

  test('emits RollResult interface for resultMapping', async () => {
    const code = await generateCode(RTL_SPEC)
    expect(code).toContain('export interface RollResult {')
  })

  test('emits resultMapping fields', async () => {
    const code = await generateCode(RTL_SPEC)
    expect(code).toContain('key: lookupResult.key')
    expect(code).toContain('tableName: input.tableName')
    expect(code).toContain('roll: total')
  })

  test('emits ROLL_TABLE_ENTRIES export', async () => {
    const code = await generateCode(RTL_SPEC)
    expect(code).toContain('export const ROLL_TABLE_ENTRIES')
    expect(code).toContain('REMOTE_DATA')
  })

  test('emits VALID_TABLE_NAMES export', async () => {
    const code = await generateCode(RTL_SPEC)
    expect(code).toContain('export const VALID_TABLE_NAMES')
    expect(code).toContain('REMOTE_DATA.map(')
  })

  test('emits default error message when errorMessage not specified', async () => {
    const code = await generateCode(RTL_SPEC)
    expect(code).toContain('if (!foundTable) throw new Error(`No table found:')
  })
})

// --- errorMessage ---

const ERROR_MSG_SPEC = {
  $schema: 'https://randsum.dev/schemas/v1/randsum.json',
  name: 'Error Message Test',
  shortcode: 'test-errmsg',
  game_url: 'https://example.com',
  roll: {
    inputs: { tableName: { type: 'string' as const } },
    dice: { pool: { sides: 20 }, quantity: 1 },
    resolve: {
      remoteTableLookup: {
        url: 'https://example.com/tables.json',
        find: {
          field: 'name',
          input: 'tableName',
          errorMessage: 'Invalid table name: "${value}"'
        },
        tableField: 'data',
        resultMapping: {
          key: { $lookupResult: 'key' },
          roll: { expr: 'total' as const }
        }
      }
    }
  }
}

describe('remoteTableLookup errorMessage', () => {
  const fetchSpyRef: { current: { mockRestore: () => void } | null } = { current: null }

  beforeEach(() => {
    fetchSpyRef.current = mockFetch()
  })

  afterEach(() => {
    fetchSpyRef.current?.mockRestore()
  })

  test('spec with errorMessage is valid', () => {
    const result = validateSpec(ERROR_MSG_SPEC)
    expect(result.valid).toBe(true)
  })

  test('codegen emits custom error message template', async () => {
    const code = await generateCode(ERROR_MSG_SPEC)
    expect(code).toContain('if (!foundTable) throw new Error(`Invalid table name: "')
    expect(code).toContain('${input.tableName}')
  })
})

// --- resultMapping with fallback ---

const FALLBACK_SPEC = {
  $schema: 'https://randsum.dev/schemas/v1/randsum.json',
  name: 'Fallback Test',
  shortcode: 'test-fallback',
  game_url: 'https://example.com',
  roll: {
    inputs: { tableName: { type: 'string' as const } },
    dice: { pool: { sides: 20 }, quantity: 1 },
    resolve: {
      remoteTableLookup: {
        url: 'https://example.com/tables.json',
        find: {
          field: 'name',
          input: 'tableName'
        },
        tableField: 'table',
        resultMapping: {
          label: {
            $lookupResult: 'result.label',
            fallback: { $lookupResult: 'key' }
          },
          desc: {
            $lookupResult: 'result.value',
            fallback: { $foundTable: 'name' }
          },
          roll: { expr: 'total' as const }
        }
      }
    }
  }
}

describe('remoteTableLookup $lookupResult fallback', () => {
  const fetchSpyRef: { current: { mockRestore: () => void } | null } = { current: null }

  beforeEach(() => {
    fetchSpyRef.current = mockFetch()
  })

  afterEach(() => {
    fetchSpyRef.current?.mockRestore()
  })

  test('spec with fallback is valid', () => {
    const result = validateSpec(FALLBACK_SPEC)
    expect(result.valid).toBe(true)
  })

  test('codegen emits ?? for $lookupResult fallback', async () => {
    const code = await generateCode(FALLBACK_SPEC)
    expect(code).toContain('label: lookupResult.result.label ?? lookupResult.key')
  })

  test('codegen emits ?? with $foundTable fallback', async () => {
    const code = await generateCode(FALLBACK_SPEC)
    expect(code).toContain('desc: lookupResult.result.value ?? foundTable.name')
  })

  test('non-fallback fields are unaffected', async () => {
    const code = await generateCode(FALLBACK_SPEC)
    expect(code).toContain('roll: total')
  })
})
