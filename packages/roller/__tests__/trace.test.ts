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
    const record = {
      initialRolls: [4],
      rolls: [4],
      modifierLogs: [{ modifier: 'plus', options: 3, removed: [], added: [] }],
      total: 4,
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
