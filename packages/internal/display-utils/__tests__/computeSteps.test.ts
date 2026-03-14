import { describe, expect, test } from 'bun:test'
import type { RollRecord } from '@randsum/roller'
import { computeSteps, formatAsMath } from '../src/computeSteps'

function makeRecord(overrides: {
  initialRolls?: number[]
  rolls?: number[]
  modifierLogs?: { modifier: string; options: unknown; removed: number[]; added: number[] }[]
  total?: number
  appliedTotal?: number
}): RollRecord {
  return {
    initialRolls: overrides.initialRolls ?? [4, 3],
    rolls: overrides.rolls ?? [4, 3],
    modifierLogs: overrides.modifierLogs ?? [],
    total: overrides.total ?? 7,
    appliedTotal: overrides.appliedTotal ?? 7
    // eslint-disable-next-line no-restricted-syntax
  } as unknown as RollRecord
}

describe('formatAsMath', () => {
  test('formats single roll', () => {
    expect(formatAsMath([5])).toBe('5')
  })

  test('formats multiple rolls with addition', () => {
    expect(formatAsMath([3, 4, 5])).toBe('3 + 4 + 5')
  })

  test('formats with positive delta', () => {
    expect(formatAsMath([3, 4], 2)).toBe('3 + 4 + 2')
  })

  test('formats with negative delta', () => {
    expect(formatAsMath([3, 4], -2)).toBe('3 + 4 - 2')
  })

  test('handles negative roll value', () => {
    expect(formatAsMath([5, -3])).toBe('5 - 3')
  })

  test('zero delta produces no extra term', () => {
    expect(formatAsMath([5], 0)).toBe('5')
  })
})

describe('computeSteps', () => {
  test('no modifiers returns single Rolled step', () => {
    const steps = computeSteps(makeRecord({ initialRolls: [3, 5], rolls: [3, 5] }))
    expect(steps.length).toBe(1)
    expect(steps[0]).toMatchObject({ kind: 'rolls', label: 'Rolled' })
  })

  test('plus modifier produces arithmetic step and finalRolls', () => {
    const steps = computeSteps(
      makeRecord({
        initialRolls: [4],
        rolls: [4],
        modifierLogs: [{ modifier: 'plus', options: 3, removed: [], added: [] }],
        total: 4,
        appliedTotal: 7
      })
    )
    const arith = steps.find(s => s.kind === 'arithmetic')
    expect(arith).toMatchObject({ kind: 'arithmetic', label: 'Add', display: '+3' })
    expect(steps.at(-1)?.kind).toBe('finalRolls')
  })

  test('minus modifier produces Subtract arithmetic step', () => {
    const steps = computeSteps(
      makeRecord({
        initialRolls: [6],
        rolls: [6],
        modifierLogs: [{ modifier: 'minus', options: 2, removed: [], added: [] }],
        total: 6,
        appliedTotal: 4
      })
    )
    const arith = steps.find(s => s.kind === 'arithmetic')
    expect(arith).toMatchObject({ kind: 'arithmetic', display: '-2' })
  })

  test('multiply modifier produces arithmetic step', () => {
    const steps = computeSteps(
      makeRecord({
        initialRolls: [3],
        rolls: [3],
        modifierLogs: [{ modifier: 'multiply', options: 2, removed: [], added: [] }],
        total: 3,
        appliedTotal: 6
      })
    )
    const arith = steps.find(s => s.kind === 'arithmetic')
    expect(arith).toMatchObject({ kind: 'arithmetic', display: '\u00d72' })
  })

  test('multiplyTotal modifier produces Multiply total arithmetic step', () => {
    const steps = computeSteps(
      makeRecord({
        initialRolls: [3],
        rolls: [3],
        modifierLogs: [{ modifier: 'multiplyTotal', options: 3, removed: [], added: [] }],
        total: 3,
        appliedTotal: 9
      })
    )
    const arith = steps.find(s => s.kind === 'arithmetic')
    expect(arith).toMatchObject({ kind: 'arithmetic', label: 'Multiply total' })
  })

  test('drop with only lowest set produces Drop Lowest step', () => {
    const steps = computeSteps(
      makeRecord({
        initialRolls: [2, 5, 4],
        rolls: [5, 4],
        modifierLogs: [{ modifier: 'drop', options: { lowest: 1 }, removed: [2], added: [] }],
        total: 9,
        appliedTotal: 9
      })
    )
    const dropStep = steps.find(s => s.kind === 'rolls' && s.label !== 'Rolled')
    expect(dropStep).toMatchObject({ kind: 'rolls', label: 'Drop Lowest 1' })
  })

  test('drop with only highest set produces Drop Highest step', () => {
    const steps = computeSteps(
      makeRecord({
        initialRolls: [2, 5, 4],
        rolls: [2, 4],
        modifierLogs: [{ modifier: 'drop', options: { highest: 1 }, removed: [5], added: [] }],
        total: 6,
        appliedTotal: 6
      })
    )
    const dropStep = steps.find(s => s.kind === 'rolls' && s.label !== 'Rolled')
    expect(dropStep).toMatchObject({ kind: 'rolls', label: 'Drop Highest 1' })
  })

  test('drop with both lowest and highest produces two steps', () => {
    const steps = computeSteps(
      makeRecord({
        initialRolls: [1, 3, 5, 6],
        rolls: [3, 5],
        modifierLogs: [
          { modifier: 'drop', options: { lowest: 1, highest: 1 }, removed: [1, 6], added: [] }
        ],
        total: 8,
        appliedTotal: 8
      })
    )
    const dropSteps = steps.filter(s => s.kind === 'rolls' && s.label !== 'Rolled')
    expect(dropSteps.length).toBe(2)
    expect(dropSteps[0]).toMatchObject({ label: 'Drop Lowest 1' })
    expect(dropSteps[1]).toMatchObject({ label: 'Drop Highest 1' })
  })

  test('keep with only highest set produces Keep Highest step', () => {
    const steps = computeSteps(
      makeRecord({
        initialRolls: [2, 5],
        rolls: [5],
        modifierLogs: [{ modifier: 'keep', options: { highest: 1 }, removed: [2], added: [] }],
        total: 5,
        appliedTotal: 5
      })
    )
    const keepStep = steps.find(s => s.kind === 'rolls' && s.label !== 'Rolled')
    expect(keepStep).toMatchObject({ label: 'Keep Highest 1' })
  })

  test('non-arithmetic non-splittable modifier uses generic label path', () => {
    const steps = computeSteps(
      makeRecord({
        initialRolls: [1, 4],
        rolls: [3, 4],
        modifierLogs: [{ modifier: 'reroll', options: { lessThan: 2 }, removed: [1], added: [3] }],
        total: 7,
        appliedTotal: 7
      })
    )
    const modStep = steps.find(s => s.kind === 'rolls' && s.label !== 'Rolled')
    expect(modStep).toBeDefined()
    expect(modStep).toMatchObject({ kind: 'rolls' })
  })

  test('non-splittable modifier with no comparison options uses base label', () => {
    const steps = computeSteps(
      makeRecord({
        initialRolls: [3, 3, 5],
        rolls: [5],
        modifierLogs: [{ modifier: 'unique', options: null, removed: [3, 3], added: [] }],
        total: 5,
        appliedTotal: 5
      })
    )
    const uniqueStep = steps.find(s => s.kind === 'rolls' && s.label === 'Unique')
    expect(uniqueStep).toBeDefined()
  })

  test('finalRolls step has correct arithmeticDelta', () => {
    const steps = computeSteps(
      makeRecord({
        initialRolls: [4],
        rolls: [4],
        modifierLogs: [{ modifier: 'plus', options: 5, removed: [], added: [] }],
        total: 4,
        appliedTotal: 9
      })
    )
    const final = steps.at(-1)
    expect(final?.kind).toBe('finalRolls')
    if (final?.kind === 'finalRolls') {
      expect(final.arithmeticDelta).toBe(5)
    }
  })
})
