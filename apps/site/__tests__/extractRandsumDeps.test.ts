import { describe, expect, test } from 'bun:test'
import { extractRandsumDeps } from '../src/components/live-repl/extractRandsumDeps'

describe('extractRandsumDeps', () => {
  test('extracts a single @randsum import (single quotes)', () => {
    const code = `import { roll } from '@randsum/roller'`
    expect(extractRandsumDeps(code)).toEqual({ '@randsum/roller': 'latest' })
  })

  test('handles double quotes', () => {
    const code = `import { roll } from "@randsum/roller"`
    expect(extractRandsumDeps(code)).toEqual({ '@randsum/roller': 'latest' })
  })

  test('extracts multiple distinct @randsum imports', () => {
    const code = [
      `import { roll } from '@randsum/roller'`,
      `import { bladeRoll } from '@randsum/blades'`
    ].join('\n')
    expect(extractRandsumDeps(code)).toEqual({
      '@randsum/roller': 'latest',
      '@randsum/blades': 'latest'
    })
  })

  test('deduplicates repeated imports of the same package', () => {
    const code = [
      `import { roll } from '@randsum/roller'`,
      `import { roll2 } from '@randsum/roller'`
    ].join('\n')
    expect(extractRandsumDeps(code)).toEqual({ '@randsum/roller': 'latest' })
  })

  test('returns empty object when no @randsum imports', () => {
    const code = `import { something } from 'some-other-package'`
    expect(extractRandsumDeps(code)).toEqual({})
  })

  test('returns empty object for empty string', () => {
    expect(extractRandsumDeps('')).toEqual({})
  })
})
