import { describe, expect, test } from 'bun:test'
import { roll } from '../../src/roll'
import { createQueueRandom } from '../../test-utils/src/queueRandom'

describe('createQueueRandom', () => {
  describe('basic mapping', () => {
    test('maps die value v to (v - 1) / sides', () => {
      const rng = createQueueRandom({ sides: 6, rolls: [3] })
      expect(rng()).toBe((3 - 1) / 6)
    })

    test('maps minimum die value 1 to 0', () => {
      const rng = createQueueRandom({ sides: 6, rolls: [1] })
      expect(rng()).toBe(0)
    })

    test('maps maximum die value to (sides - 1) / sides', () => {
      const rng = createQueueRandom({ sides: 6, rolls: [6] })
      expect(rng()).toBe((6 - 1) / 6)
    })

    test('drains queue in order', () => {
      const rng = createQueueRandom({ sides: 6, rolls: [1, 3, 6] })
      expect(rng()).toBe(0)
      expect(rng()).toBe((3 - 1) / 6)
      expect(rng()).toBe((6 - 1) / 6)
    })

    test('works with d20', () => {
      const rng = createQueueRandom({ sides: 20, rolls: [15] })
      expect(rng()).toBe((15 - 1) / 20)
    })
  })

  describe('modifier roll arrays', () => {
    test('concatenates rolls and rerollRolls in order', () => {
      const rng = createQueueRandom({ sides: 6, rolls: [2], rerollRolls: [5] })
      expect(rng()).toBe((2 - 1) / 6)
      expect(rng()).toBe((5 - 1) / 6)
    })

    test('concatenates in priority order: rolls, reroll, explode, compound, penetrate, sequence', () => {
      const rng = createQueueRandom({
        sides: 6,
        rolls: [1],
        rerollRolls: [2],
        explodeRolls: [3],
        compoundRolls: [4],
        penetrateRolls: [5],
        sequenceRolls: [6]
      })
      expect(rng()).toBe((1 - 1) / 6)
      expect(rng()).toBe((2 - 1) / 6)
      expect(rng()).toBe((3 - 1) / 6)
      expect(rng()).toBe((4 - 1) / 6)
      expect(rng()).toBe((5 - 1) / 6)
      expect(rng()).toBe((6 - 1) / 6)
    })

    test('omitted arrays are skipped', () => {
      const rng = createQueueRandom({ sides: 6, rolls: [2], explodeRolls: [4] })
      expect(rng()).toBe((2 - 1) / 6)
      expect(rng()).toBe((4 - 1) / 6)
    })
  })

  describe('queue exhaustion', () => {
    test('throws when queue is exhausted', () => {
      const rng = createQueueRandom({ sides: 6, rolls: [3] })
      rng() // consume the only value
      expect(() => rng()).toThrow()
    })

    test('throws with helpful message when queue is exhausted', () => {
      const rng = createQueueRandom({ sides: 6, rolls: [3] })
      rng()
      expect(() => rng()).toThrow('exhausted')
    })
  })

  describe('integration with roll()', () => {
    test('produces expected die value when used as randomFn in roll()', () => {
      const rng = createQueueRandom({ sides: 6, rolls: [4] })
      const result = roll({ sides: 6, quantity: 1 }, { randomFn: rng })
      expect(result.rolls[0]!.rolls).toEqual([4])
    })

    test('produces expected values for multi-die roll', () => {
      const rng = createQueueRandom({ sides: 6, rolls: [2, 5, 3] })
      const result = roll({ sides: 6, quantity: 3 }, { randomFn: rng })
      expect(result.rolls[0]!.rolls).toEqual([2, 5, 3])
    })
  })
})
