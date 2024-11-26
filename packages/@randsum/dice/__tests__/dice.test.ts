import { describe, expect, test } from 'bun:test'
import { D10, D100, D12, D20, D4, D6, D8 } from '../src'

describe('exported dice', () => {
  test('D4 should be a D with 4 sides', () => {
    expect(D4.sides).toEqual(4)
  })

  test('D6 should be a D with 6 sides', () => {
    expect(D6.sides).toEqual(6)
  })

  test('D8 should be a D with 8 sides', () => {
    expect(D8.sides).toEqual(8)
  })

  test('D10 should be a D with 10 sides', () => {
    expect(D10.sides).toEqual(10)
  })

  test('D12 should be a D with 12 sides', () => {
    expect(D12.sides).toEqual(12)
  })

  test('D20 should be a D with 20 sides', () => {
    expect(D20.sides).toEqual(20)
  })

  test('D100 should be a D with 100 sides', () => {
    expect(D100.sides).toEqual(100)
  })
})
