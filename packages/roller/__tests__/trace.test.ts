import { describe, expect, test } from 'bun:test'
import { formatAsMath, traceRoll } from '../src/trace/index'
import type { RollTraceStep } from '../src/trace/index'

describe('formatAsMath', () => {
  test('single roll, no delta', () => {
    expect(formatAsMath([5])).toBe('5')
  })

  test('multiple rolls, no delta', () => {
    expect(formatAsMath([3, 4])).toBe('3 + 4')
  })

  test('positive delta', () => {
    expect(formatAsMath([5], 3)).toBe('5 + 3')
  })

  test('negative delta', () => {
    expect(formatAsMath([5], -2)).toBe('5 - 2')
  })

  test('negative roll value', () => {
    expect(formatAsMath([5, -2])).toBe('5 - 2')
  })
})

describe('traceRoll', () => {
  test('no modifiers returns single rolls step', () => {
    const record = {
      initialRolls: [3, 5, 2],
      rolls: [3, 5, 2],
      modifierLogs: [],
      total: 10,
      appliedTotal: 10
    }
    const steps = traceRoll(record)
    expect(steps.length).toBe(1)
    expect(steps[0]?.kind).toBe('rolls')
    if (steps[0]?.kind === 'rolls') {
      expect(steps[0].label).toBe('Rolled')
      expect(steps[0].unchanged).toEqual([3, 5, 2])
      expect(steps[0].removed).toEqual([])
      expect(steps[0].added).toEqual([])
    }
  })

  test('arithmetic modifier produces arithmetic step and finalRolls', () => {
    // Realistic record: `1d?+3` rolled a 4, so `total` already includes the +3.
    // arithmeticDelta = total - sum(rolls) = 7 - 4 = 3.
    const record = {
      initialRolls: [4],
      rolls: [4],
      modifierLogs: [{ modifier: 'plus', options: 3, removed: [], added: [] }],
      total: 7,
      appliedTotal: 7
    }
    const steps = traceRoll(record)
    expect(steps.length).toBe(3)
    expect(steps[0]?.kind).toBe('rolls')
    expect(steps[1]?.kind).toBe('arithmetic')
    if (steps[1]?.kind === 'arithmetic') {
      expect(steps[1].label).toBe('Add')
      expect(steps[1].display).toBe('+3')
    }
    expect(steps[2]?.kind).toBe('finalRolls')
    if (steps[2]?.kind === 'finalRolls') {
      expect(steps[2].arithmeticDelta).toBe(3)
    }
  })

  test('arithmeticDelta reflects plus/minus modifiers, not just subtracted pools', () => {
    // Regression: the old `appliedTotal - total` derivation was always 0 for an
    // additive pool, so a +N modifier never showed up in the final math line.
    const record = {
      initialRolls: [4],
      rolls: [4],
      modifierLogs: [{ modifier: 'plus', options: 3, removed: [], added: [] }],
      total: 7,
      // An additive pool: appliedTotal === total. The old derivation gave 0 here.
      appliedTotal: 7
    }
    const steps = traceRoll(record)
    const final = steps[2]
    expect(final?.kind).toBe('finalRolls')
    if (final?.kind === 'finalRolls') {
      expect(final.arithmeticDelta).toBe(3)
      expect(formatAsMath(final.rolls, final.arithmeticDelta)).toBe('4 + 3')
    }
  })

  test('drop modifier produces rolls step', () => {
    const record = {
      initialRolls: [2, 5, 3, 4],
      rolls: [5, 3, 4],
      modifierLogs: [{ modifier: 'drop', options: { lowest: 1 }, removed: [2], added: [] }],
      total: 12,
      appliedTotal: 12
    }
    const steps = traceRoll(record)
    expect(steps.length).toBe(3)
    expect(steps[1]?.kind).toBe('rolls')
    if (steps[1]?.kind === 'rolls') {
      expect(steps[1].removed).toEqual([2])
    }
    expect(steps[2]?.kind).toBe('finalRolls')
  })

  test('drop with an exact condition renders the exact values in the label', () => {
    // Regression: `exact` is a number[], but formatComparison read it via a
    // scalar helper, so exact-drop conditions never rendered in the label.
    const record = {
      initialRolls: [3, 5, 3, 4],
      rolls: [5, 4],
      modifierLogs: [{ modifier: 'drop', options: { exact: [3] }, removed: [3, 3], added: [] }],
      total: 9,
      appliedTotal: 9
    }
    const steps = traceRoll(record)
    const dropStep = steps[1]
    expect(dropStep?.kind).toBe('rolls')
    if (dropStep?.kind === 'rolls') {
      expect(dropStep.label).toBe('Drop Exactly 3')
    }
  })

  test('integerDivide modifier produces arithmetic step with ÷ sign', () => {
    // Realistic record: `1d?//2` rolled a 10, so `total` is the post-divide 5.
    // arithmeticDelta = total - sum(rolls) = 5 - 10 = -5.
    const record = {
      initialRolls: [10],
      rolls: [10],
      modifierLogs: [{ modifier: 'integerDivide', options: 2, removed: [], added: [] }],
      total: 5,
      appliedTotal: 5
    }
    const steps = traceRoll(record)
    expect(steps.length).toBe(3)
    expect(steps[1]?.kind).toBe('arithmetic')
    if (steps[1]?.kind === 'arithmetic') {
      expect(steps[1].label).toBe('Integer divide')
      expect(steps[1].display).toBe('÷2')
    }
    expect(steps[2]?.kind).toBe('finalRolls')
    if (steps[2]?.kind === 'finalRolls') {
      expect(steps[2].arithmeticDelta).toBe(-5)
    }
  })

  test('modulo modifier produces arithmetic step with % sign', () => {
    const record = {
      initialRolls: [10],
      rolls: [10],
      modifierLogs: [{ modifier: 'modulo', options: 3, removed: [], added: [] }],
      total: 10,
      appliedTotal: 1
    }
    const steps = traceRoll(record)
    expect(steps.length).toBe(3)
    expect(steps[1]?.kind).toBe('arithmetic')
    if (steps[1]?.kind === 'arithmetic') {
      expect(steps[1].label).toBe('Modulo')
      expect(steps[1].display).toBe('%3')
    }
  })

  test('return type is readonly RollTraceStep[]', () => {
    const record = {
      initialRolls: [1],
      rolls: [1],
      modifierLogs: [],
      total: 1,
      appliedTotal: 1
    }
    const steps: readonly RollTraceStep[] = traceRoll(record)
    expect(Array.isArray(steps)).toBe(true)
  })
})
