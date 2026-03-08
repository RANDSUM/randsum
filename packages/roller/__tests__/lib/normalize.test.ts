import { describe, expect, test } from 'bun:test'
import { equate, normalize } from '../../src/lib/normalize'

describe('normalize', () => {
  test('identity: canonical notation normalizes to itself', () => {
    const notations = ['1d6', '4d6L', '2d20H', '3d8R{<2}']
    notations.forEach(n => {
      expect(normalize(n).value).toBe(n)
    })
  })

  test('returns a valid dice notation string', () => {
    const result = normalize('4d6L')
    expect(typeof result.value).toBe('string')
    expect(result.value).toMatch(/\d+[dD]\d+/)
  })
})

describe('equate', () => {
  test('identical notations are equivalent', () => {
    expect(equate('4d6L', '4d6L').value).toBe(true)
    expect(equate('1d20', '1d20').value).toBe(true)
  })

  test('different notations are not equivalent', () => {
    expect(equate('1d6', '2d6').value).toBe(false)
    expect(equate('4d6L', '4d6H').value).toBe(false)
  })
})
