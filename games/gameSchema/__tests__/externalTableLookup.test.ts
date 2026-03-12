import { describe, expect, test } from 'bun:test'
import { generateCode } from '../src/codegen'
import { validateSpec } from '../src'

const ETL_SPEC = {
  $schema: 'https://randsum.dev/schemas/v1/randsum.json',
  name: 'External Lookup Test',
  shortcode: 'test-etl',
  game_url: 'https://example.com',
  roll: {
    inputs: { tableName: { type: 'string' as const } },
    dice: { pool: { sides: 20 }, quantity: 1 },
    resolve: {
      externalTableLookup: {
        package: 'some-reference-lib',
        imports: ['SomeReference', 'resultForTable'],
        find: {
          collection: 'SomeReference.RollTables',
          where: { field: 'name', input: 'tableName' }
        },
        resolve: {
          fn: 'resultForTable',
          tableField: 'table'
        }
      }
    }
  }
}

describe('externalTableLookup schema validation', () => {
  test('spec with externalTableLookup resolve is valid', () => {
    const result = validateSpec(ETL_SPEC)
    expect(result.valid).toBe(true)
  })

  test('externalTableLookup missing required field is invalid', () => {
    const result = validateSpec({
      ...ETL_SPEC,
      roll: {
        ...ETL_SPEC.roll,
        resolve: {
          externalTableLookup: {
            package: 'some-lib',
            imports: ['lookup']
            // missing find and resolve
          }
        }
      }
    })
    expect(result.valid).toBe(false)
  })
})

describe('externalTableLookup codegen', () => {
  test('emits imports from external package', () => {
    const code = generateCode(ETL_SPEC)
    expect(code).toContain("import { SomeReference, resultForTable } from 'some-reference-lib'")
  })

  test('emits find call with collection and where', () => {
    const code = generateCode(ETL_SPEC)
    expect(code).toContain(
      'const foundTable = SomeReference.RollTables.find(t => t.name === input.tableName)'
    )
  })

  test('emits null check for found table', () => {
    const code = generateCode(ETL_SPEC)
    expect(code).toContain('if (!foundTable) throw new Error')
  })

  test('emits resolve call with tableField and total', () => {
    const code = generateCode(ETL_SPEC)
    expect(code).toContain('resultForTable(foundTable.table, total)')
  })

  test('result type is string (opaque) without resultMapping', () => {
    const code = generateCode(ETL_SPEC)
    expect(code).toContain('export type RollResult = string')
  })

  test('return includes total, lookupResult, and rolls', () => {
    const code = generateCode(ETL_SPEC)
    expect(code).toContain('return { total, result: lookupResult, rolls: r.rolls }')
  })

  test('emits default error message when errorMessage not specified', () => {
    const code = generateCode(ETL_SPEC)
    expect(code).toContain('if (!foundTable) throw new Error(`No table found:')
  })
})

// --- #996: errorMessage ---

const ERROR_MSG_SPEC = {
  $schema: 'https://randsum.dev/schemas/v1/randsum.json',
  name: 'Error Message Test',
  shortcode: 'test-errmsg',
  game_url: 'https://example.com',
  roll: {
    inputs: { tableName: { type: 'string' as const } },
    dice: { pool: { sides: 20 }, quantity: 1 },
    resolve: {
      externalTableLookup: {
        package: 'some-lib',
        imports: ['Ref', 'lookup'],
        find: {
          collection: 'Ref.Tables',
          where: { field: 'name', input: 'tableName' },
          errorMessage: 'Invalid table name: "${value}"'
        },
        resolve: { fn: 'lookup', tableField: 'data' }
      }
    }
  }
}

describe('externalTableLookup errorMessage (#996)', () => {
  test('spec with errorMessage is valid', () => {
    const result = validateSpec(ERROR_MSG_SPEC)
    expect(result.valid).toBe(true)
  })

  test('codegen emits custom error message template', () => {
    const code = generateCode(ERROR_MSG_SPEC)
    expect(code).toContain('if (!foundTable) throw new Error(`Invalid table name: "')
    expect(code).toContain('${input.tableName}')
  })
})

// --- #996: resultMapping ---

const RESULT_MAPPING_SPEC = {
  $schema: 'https://randsum.dev/schemas/v1/randsum.json',
  name: 'Result Mapping Test',
  shortcode: 'test-rmap',
  game_url: 'https://example.com',
  roll: {
    inputs: { tableName: { type: 'string' as const } },
    dice: { pool: { sides: 20 }, quantity: 1 },
    resolve: {
      externalTableLookup: {
        package: 'some-lib',
        imports: ['Ref', 'lookup'],
        find: {
          collection: 'Ref.Tables',
          where: { field: 'name', input: 'tableName' }
        },
        resolve: { fn: 'lookup', tableField: 'data' },
        resultMapping: {
          key: { $lookupResult: 'key' },
          label: { $lookupResult: 'result.label' },
          tableName: { $input: 'tableName' },
          tableData: { $foundTable: 'data' },
          roll: { expr: 'total' as const }
        }
      }
    }
  }
}

describe('externalTableLookup resultMapping (#996)', () => {
  test('spec with resultMapping is valid', () => {
    const result = validateSpec(RESULT_MAPPING_SPEC)
    expect(result.valid).toBe(true)
  })

  test('emits RollResult interface instead of type alias', () => {
    const code = generateCode(RESULT_MAPPING_SPEC)
    expect(code).toContain('export interface RollResult {')
    expect(code).toContain('readonly key: unknown')
    expect(code).toContain('readonly label: unknown')
    expect(code).toContain('readonly tableName: string')
    expect(code).toContain('readonly tableData: unknown')
    expect(code).toContain('readonly roll: number')
  })

  test('emits $lookupResult as dot-path access', () => {
    const code = generateCode(RESULT_MAPPING_SPEC)
    expect(code).toContain('key: lookupResult.key')
    expect(code).toContain('label: lookupResult.result.label')
  })

  test('emits $foundTable as field access', () => {
    const code = generateCode(RESULT_MAPPING_SPEC)
    expect(code).toContain('tableData: foundTable.data')
  })

  test('emits $input as input accessor', () => {
    const code = generateCode(RESULT_MAPPING_SPEC)
    expect(code).toContain('tableName: input.tableName')
  })

  test('emits expr total as total', () => {
    const code = generateCode(RESULT_MAPPING_SPEC)
    expect(code).toContain('roll: total')
  })

  test('wraps mapped fields in result object', () => {
    const code = generateCode(RESULT_MAPPING_SPEC)
    expect(code).toContain('result: {')
  })
})

// --- #996 follow-up: $lookupResult fallback ---

const FALLBACK_SPEC = {
  $schema: 'https://randsum.dev/schemas/v1/randsum.json',
  name: 'Fallback Test',
  shortcode: 'test-fallback',
  game_url: 'https://example.com',
  roll: {
    inputs: { tableName: { type: 'string' as const } },
    dice: { pool: { sides: 20 }, quantity: 1 },
    resolve: {
      externalTableLookup: {
        package: 'some-lib',
        imports: ['Ref', 'lookup'],
        find: {
          collection: 'Ref.Tables',
          where: { field: 'name', input: 'tableName' }
        },
        resolve: { fn: 'lookup', tableField: 'data' },
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

describe('$lookupResult fallback (#996)', () => {
  test('spec with fallback is valid', () => {
    const result = validateSpec(FALLBACK_SPEC)
    expect(result.valid).toBe(true)
  })

  test('codegen emits ?? for $lookupResult fallback', () => {
    const code = generateCode(FALLBACK_SPEC)
    expect(code).toContain('label: lookupResult.result.label ?? lookupResult.key')
  })

  test('codegen emits ?? with $foundTable fallback', () => {
    const code = generateCode(FALLBACK_SPEC)
    expect(code).toContain('desc: lookupResult.result.value ?? foundTable.name')
  })

  test('non-fallback fields are unaffected', () => {
    const code = generateCode(FALLBACK_SPEC)
    expect(code).toContain('roll: total')
  })
})
