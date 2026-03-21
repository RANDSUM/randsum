import { describe, expect, test } from 'bun:test'
import { RANDSUM_MODIFIERS } from '../../../src/modifiers'

// Spec Appendix A: modifier priority table.
// Priority determines execution order — lower number runs first.
const SPEC_PRIORITIES: Record<string, number> = {
  cap: 10,
  replace: 30,
  reroll: 40,
  explode: 50,
  compound: 51,
  penetrate: 52,
  explodeSequence: 53,
  wildDie: 55,
  unique: 60,
  drop: 65,
  keep: 66,
  count: 80,
  multiply: 85,
  plus: 90,
  minus: 91,
  integerDivide: 93,
  modulo: 94,
  sort: 95,
  multiplyTotal: 100
}

describe('S06.3 — Modifier Priority Ordering', () => {
  test('every modifier in RANDSUM_MODIFIERS has a priority matching the spec', () => {
    RANDSUM_MODIFIERS.forEach(modifier => {
      const specPriority = SPEC_PRIORITIES[modifier.name]
      expect(
        specPriority,
        `Modifier "${modifier.name}" is not in the spec priority table`
      ).toBeDefined()
      expect(modifier.priority).toBe(specPriority)
    })
  })

  test('RANDSUM_MODIFIERS is sorted by ascending priority', () => {
    const priorities = RANDSUM_MODIFIERS.map(m => m.priority)
    priorities.slice(1).forEach((priority, idx) => {
      const prev = priorities[idx]!
      expect(
        priority >= prev,
        `Modifier at index ${idx + 1} (priority ${priority}) must be >= prior (priority ${prev})`
      ).toBe(true)
    })
  })

  test('all spec-named modifiers are present in RANDSUM_MODIFIERS', () => {
    const registeredNames = new Set(RANDSUM_MODIFIERS.map(m => m.name))
    Object.keys(SPEC_PRIORITIES).forEach(name => {
      expect(registeredNames.has(name), `Expected modifier "${name}" to be registered`).toBe(true)
    })
  })

  describe('individual modifier priorities', () => {
    const byName = Object.fromEntries(RANDSUM_MODIFIERS.map(m => [m.name, m]))

    test('cap: priority 10 (Clamp — runs first)', () => {
      expect(byName['cap']?.priority).toBe(10)
    })

    test('replace: priority 30 (Map)', () => {
      expect(byName['replace']?.priority).toBe(30)
    })

    test('reroll: priority 40 (Substitute)', () => {
      expect(byName['reroll']?.priority).toBe(40)
    })

    test('explode: priority 50 (Generate)', () => {
      expect(byName['explode']?.priority).toBe(50)
    })

    test('compound: priority 51 (Accumulate)', () => {
      expect(byName['compound']?.priority).toBe(51)
    })

    test('penetrate: priority 52 (Accumulate)', () => {
      expect(byName['penetrate']?.priority).toBe(52)
    })

    test('explodeSequence: priority 53 (Generate)', () => {
      expect(byName['explodeSequence']?.priority).toBe(53)
    })

    test('wildDie: priority 55 (Dispatch)', () => {
      expect(byName['wildDie']?.priority).toBe(55)
    })

    test('unique: priority 60 (Substitute)', () => {
      expect(byName['unique']?.priority).toBe(60)
    })

    test('drop: priority 65 (Filter)', () => {
      expect(byName['drop']?.priority).toBe(65)
    })

    test('keep: priority 66 (Filter)', () => {
      expect(byName['keep']?.priority).toBe(66)
    })

    test('count: priority 80 (Reinterpret)', () => {
      expect(byName['count']?.priority).toBe(80)
    })

    test('multiply: priority 85 (Scale)', () => {
      expect(byName['multiply']?.priority).toBe(85)
    })

    test('plus: priority 90 (Scale)', () => {
      expect(byName['plus']?.priority).toBe(90)
    })

    test('minus: priority 91 (Scale)', () => {
      expect(byName['minus']?.priority).toBe(91)
    })

    test('integerDivide: priority 93 (Scale)', () => {
      expect(byName['integerDivide']?.priority).toBe(93)
    })

    test('modulo: priority 94 (Scale)', () => {
      expect(byName['modulo']?.priority).toBe(94)
    })

    test('sort: priority 95 (Order)', () => {
      expect(byName['sort']?.priority).toBe(95)
    })

    test('multiplyTotal: priority 100 (Scale — runs last)', () => {
      expect(byName['multiplyTotal']?.priority).toBe(100)
    })
  })
})
