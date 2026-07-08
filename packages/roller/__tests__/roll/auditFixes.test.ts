import { describe, expect, test } from 'bun:test'
import { roll } from '../../src/roll'
import { createSeededRandom } from '../../src/random'

describe('roller audit fixes', () => {
  describe('honest `values` typing', () => {
    test('numeric pools populate actual numbers, not strings', () => {
      const result = roll('2d6')
      expect(result.values).toHaveLength(2)
      for (const v of result.values) {
        expect(typeof v).toBe('number')
      }
      // The values are the actual die faces and sum to the total.
      const sum = result.values.reduce<number>((acc, v) => acc + (v as number), 0)
      expect(sum).toBe(result.total)
    })

    test('custom-faced pools populate the face values', () => {
      const result = roll({ sides: ['H', 'T'], quantity: 3 })
      expect(result.values).toHaveLength(3)
      for (const v of result.values) {
        expect(v === 'H' || v === 'T').toBe(true)
      }
    })

    test('numericFaces dice (Fate) populate numbers', () => {
      const result = roll('4dF')
      expect(result.values).toHaveLength(4)
      for (const v of result.values) {
        expect(typeof v).toBe('number')
        expect([-1, 0, 1]).toContain(v as number)
      }
    })
  })

  describe('bare dN notation (quantity optional)', () => {
    test('roll("d20") behaves like roll("1d20")', () => {
      const seeded = createSeededRandom(42)
      const bare = roll('d20', { randomFn: seeded })
      const seeded2 = createSeededRandom(42)
      const explicit = roll('1d20', { randomFn: seeded2 })
      expect(bare.total).toBe(explicit.total)
      expect(bare.rolls[0]?.parameters.quantity).toBe(1)
      expect(bare.rolls[0]?.parameters.sides).toBe(20)
    })

    test('bare dN stays within die bounds over many rolls', () => {
      for (const _ of Array.from({ length: 1000 })) {
        const result = roll('d6')
        expect(result.total).toBeGreaterThanOrEqual(1)
        expect(result.total).toBeLessThanOrEqual(6)
      }
    })
  })

  describe('typed `label` option', () => {
    test('label on an options object is carried onto the roll record', () => {
      const result = roll({ sides: 6, quantity: 1, label: 'fire' })
      expect(result.rolls[0]?.label).toBe('fire')
    })
  })
})
