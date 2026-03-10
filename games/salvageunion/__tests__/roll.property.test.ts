import { describe, expect, test } from 'bun:test'
import fc from 'fast-check'
import { roll } from '../src/roll'
import { SALVAGE_UNION_TABLE_NAMES } from '../src/types'

const VALID_TABLE_NAMES = SALVAGE_UNION_TABLE_NAMES.filter(name => {
  try {
    roll(name)
    return true
  } catch {
    return false
  }
})

describe('roll property-based tests', () => {
  test('total is always in the range 1-20', () => {
    fc.assert(
      fc.property(fc.constantFrom(...VALID_TABLE_NAMES), _tableName => {
        const { total } = roll(_tableName)
        return total >= 1 && total <= 20
      })
    )
  })

  test('result always has required fields', () => {
    fc.assert(
      fc.property(fc.constantFrom(...VALID_TABLE_NAMES), _tableName => {
        const { result } = roll(_tableName)
        return (
          typeof result.key === 'string' &&
          typeof result.label === 'string' &&
          typeof result.description === 'string' &&
          typeof result.tableName === 'string' &&
          typeof result.table === 'object' &&
          typeof result.roll === 'number'
        )
      })
    )
  })

  test('result.tableName always matches the tableName argument', () => {
    fc.assert(
      fc.property(fc.constantFrom(...VALID_TABLE_NAMES), tableName => {
        const { result } = roll(tableName)
        return result.tableName === tableName
      })
    )
  })

  test('result.roll always equals total', () => {
    fc.assert(
      fc.property(fc.constantFrom(...VALID_TABLE_NAMES), _tableName => {
        const { total, result } = roll(_tableName)
        return result.roll === total
      })
    )
  })

  test('never throws for valid table names', () => {
    fc.assert(
      fc.property(fc.constantFrom(...VALID_TABLE_NAMES), _tableName => {
        expect(() => roll(_tableName)).not.toThrow()
        return true
      }),
      { numRuns: 50 }
    )
  })
})
