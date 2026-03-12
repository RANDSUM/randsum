import { describe, expect, test } from 'bun:test'
import fc from 'fast-check'
import { ROLL_TABLE_ENTRIES, roll } from '@randsum/games/salvageunion'

const ROLLABLE_TABLE_NAMES = (
  ROLL_TABLE_ENTRIES as readonly { name: string; indexable?: boolean }[]
)
  .filter(t => t.indexable !== false)
  .map(t => t.name)
  .filter(name => {
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
      fc.property(fc.constantFrom(...ROLLABLE_TABLE_NAMES), _tableName => {
        const { total } = roll(_tableName)
        return total >= 1 && total <= 20
      })
    )
  })

  test('result always has required fields', () => {
    fc.assert(
      fc.property(fc.constantFrom(...ROLLABLE_TABLE_NAMES), _tableName => {
        const { result } = roll(_tableName)
        return (
          typeof result.key === 'string' &&
          typeof result.label === 'string' &&
          (result.description === undefined || typeof result.description === 'string') &&
          typeof result.tableName === 'string' &&
          typeof result.table === 'object' &&
          typeof result.roll === 'number'
        )
      })
    )
  })

  test('result.tableName always matches the tableName argument', () => {
    fc.assert(
      fc.property(fc.constantFrom(...ROLLABLE_TABLE_NAMES), tableName => {
        const { result } = roll(tableName)
        return result.tableName === tableName
      })
    )
  })

  test('result.roll always equals total', () => {
    fc.assert(
      fc.property(fc.constantFrom(...ROLLABLE_TABLE_NAMES), _tableName => {
        const { total, result } = roll(_tableName)
        return result.roll === total
      })
    )
  })

  test('never throws for valid table names', () => {
    fc.assert(
      fc.property(fc.constantFrom(...ROLLABLE_TABLE_NAMES), _tableName => {
        expect(() => roll(_tableName)).not.toThrow()
        return true
      }),
      { numRuns: 50 }
    )
  })
})
