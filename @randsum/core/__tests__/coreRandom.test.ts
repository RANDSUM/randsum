import { describe, expect, test } from 'bun:test'
import { coreRandom } from '../src/utils/coreRandom'

describe('coreRandom', () => {
  test('it returns an object between 1 and the provided number', () => {
    Array.from({ length: 999999 }).forEach(() => {
      const result = coreRandom(10)
      expect(result).toBeGreaterThanOrEqual(1)
      expect(result).toBeLessThanOrEqual(10)
    })
  })
})
