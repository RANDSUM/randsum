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

  test('result type is string (opaque)', () => {
    const code = generateCode(ETL_SPEC)
    expect(code).toContain('export type RollResult = string')
  })

  test('return includes total, result, and rolls', () => {
    const code = generateCode(ETL_SPEC)
    expect(code).toContain('return { total, result, rolls: r.rolls }')
  })
})
