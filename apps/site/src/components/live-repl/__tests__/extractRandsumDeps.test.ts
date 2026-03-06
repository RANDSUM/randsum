import { describe, expect, test } from 'bun:test'
import { extractRandsumDeps } from '../extractRandsumDeps'

describe('extractRandsumDeps', () => {
  test('extracts a single @randsum package', () => {
    const code = `import { roll } from '@randsum/roller'`
    expect(extractRandsumDeps(code)).toEqual({ '@randsum/roller': 'latest' })
  })

  test('extracts multiple distinct @randsum packages', () => {
    const code = `
      import { roll } from '@randsum/roller'
      import { roll as bladesRoll } from '@randsum/blades'
    `
    expect(extractRandsumDeps(code)).toEqual({
      '@randsum/roller': 'latest',
      '@randsum/blades': 'latest'
    })
  })

  test('deduplicates repeated imports of the same package', () => {
    const code = `
      import { roll } from '@randsum/roller'
      import type { RollResult } from '@randsum/roller'
    `
    expect(extractRandsumDeps(code)).toEqual({ '@randsum/roller': 'latest' })
  })

  test('returns empty object for non-@randsum code', () => {
    expect(extractRandsumDeps(`import { something } from 'some-lib'`)).toEqual({})
  })

  test('returns empty object for bash/empty strings', () => {
    expect(extractRandsumDeps('bun add @randsum/roller')).toEqual({})
    expect(extractRandsumDeps('')).toEqual({})
  })

  test('handles double-quote imports', () => {
    const code = `import { roll } from "@randsum/fifth"`
    expect(extractRandsumDeps(code)).toEqual({ '@randsum/fifth': 'latest' })
  })
})
