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
        export: 'lookupTable',
        keyInput: 'tableName',
        lookupBy: 'roll'
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
            export: 'lookup'
            // missing keyInput and lookupBy
          }
        }
      }
    })
    expect(result.valid).toBe(false)
  })
})

describe('externalTableLookup codegen', () => {
  test('emits import from external package', () => {
    const code = generateCode(ETL_SPEC)
    expect(code).toContain("import { lookupTable } from 'some-reference-lib'")
  })

  test('emits lookup call with keyInput and total', () => {
    const code = generateCode(ETL_SPEC)
    expect(code).toContain('lookupTable(input.tableName, total)')
  })

  test('result type is string (opaque)', () => {
    const code = generateCode(ETL_SPEC)
    expect(code).toContain('export type RollResult = string')
  })

  test('return includes total, result, and rolls', () => {
    const code = generateCode(ETL_SPEC)
    expect(code).toContain('return { total, result, rolls: r.rolls }')
  })

  test('does not emit outcome range lines', () => {
    const code = generateCode(ETL_SPEC)
    expect(code).not.toContain('throw new Error')
  })
})
