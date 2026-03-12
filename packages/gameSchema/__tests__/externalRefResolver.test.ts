import { describe, expect, test } from 'bun:test'

import { SchemaError } from '../src/errors'
import { resolveExternalRefs } from '../src/externalRefResolver'
import type { RandSumSpec } from '../src/types'

const PLAIN_SPEC: RandSumSpec = {
  $schema: 'https://randsum.dev/schemas/v1/randsum.json',
  name: 'Test',
  shortcode: 'test-ext',
  game_url: 'https://example.com',
  roll: {
    dice: { pool: { sides: 6 }, quantity: 1 },
    resolve: 'sum' as const
  }
}

describe('resolveExternalRefs', () => {
  test('returns spec unchanged if no external refs present', async () => {
    const result = await resolveExternalRefs(PLAIN_SPEC)
    expect(result).toEqual(PLAIN_SPEC)
  })

  test('throws SchemaError for unreachable external ref URL', async () => {
    const specWithBadRef = {
      ...PLAIN_SPEC,
      tables: {
        myTable: {
          $ref: 'https://this-domain-does-not-exist-randsum-test.invalid/tables.json#/foo'
        }
      }
    }
    try {
      await resolveExternalRefs(specWithBadRef as RandSumSpec)
      expect(true).toBe(false) // should not reach here
    } catch (e) {
      expect(e).toBeInstanceOf(SchemaError)
      expect((e as SchemaError).code).toBe('EXTERNAL_REF_FAILED')
    }
  })

  test('throws SchemaError with helpful message for HTTP error', async () => {
    const specWithBadRef = {
      ...PLAIN_SPEC,
      tables: {
        myTable: { $ref: 'https://httpbin.org/status/404#/foo' }
      }
    }
    try {
      await resolveExternalRefs(specWithBadRef as RandSumSpec)
      expect(true).toBe(false) // should not reach here
    } catch (e) {
      expect(e).toBeInstanceOf(SchemaError)
      expect((e as SchemaError).message).toContain('Failed to fetch external ref')
    }
  })
})
