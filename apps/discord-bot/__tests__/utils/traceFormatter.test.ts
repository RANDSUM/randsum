import { describe, expect, test } from 'bun:test'
import type { RollTraceStep } from '@randsum/roller/trace'
import { formatTraceSteps } from '../../src/utils/traceFormatter.js'

describe('formatTraceSteps', () => {
  test('formats a single rolls step with no removed/added', () => {
    const steps: readonly RollTraceStep[] = [
      { kind: 'rolls', label: 'Rolled', unchanged: [3, 4, 5], removed: [], added: [] }
    ]
    const result = formatTraceSteps(steps)
    expect(result).toContain('Rolled')
    expect(result).toContain('3')
    expect(result).toContain('4')
    expect(result).toContain('5')
  })

  test('shows removed dice in strikethrough', () => {
    const steps: readonly RollTraceStep[] = [
      { kind: 'rolls', label: 'Drop Lowest 1', unchanged: [4, 5], removed: [2], added: [] }
    ]
    const result = formatTraceSteps(steps)
    expect(result).toContain('~~2~~')
  })

  test('shows added dice in bold', () => {
    const steps: readonly RollTraceStep[] = [
      { kind: 'rolls', label: 'Reroll', unchanged: [3, 5], removed: [], added: [6] }
    ]
    const result = formatTraceSteps(steps)
    expect(result).toContain('**6**')
  })

  test('formats arithmetic step with label and display', () => {
    const steps: readonly RollTraceStep[] = [{ kind: 'arithmetic', label: 'Add', display: '+5' }]
    const result = formatTraceSteps(steps)
    expect(result).toContain('Add')
    expect(result).toContain('+5')
  })

  test('formats finalRolls step with rolls and delta', () => {
    const steps: readonly RollTraceStep[] = [
      { kind: 'finalRolls', rolls: [4, 5], arithmeticDelta: 3 }
    ]
    const result = formatTraceSteps(steps)
    expect(result).toContain('4')
    expect(result).toContain('5')
    expect(result).toContain('3')
  })

  test('formats finalRolls step with zero delta', () => {
    const steps: readonly RollTraceStep[] = [
      { kind: 'finalRolls', rolls: [4, 5], arithmeticDelta: 0 }
    ]
    const result = formatTraceSteps(steps)
    expect(result).toContain('4')
    expect(result).toContain('5')
  })

  test('formats divider step as separator', () => {
    const steps: readonly RollTraceStep[] = [{ kind: 'divider' }]
    const result = formatTraceSteps(steps)
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })

  test('formats multiple steps joined together', () => {
    const steps: readonly RollTraceStep[] = [
      { kind: 'rolls', label: 'Rolled', unchanged: [3, 4, 2, 5], removed: [], added: [] },
      { kind: 'rolls', label: 'Drop Lowest 1', unchanged: [3, 4, 5], removed: [2], added: [] },
      { kind: 'finalRolls', rolls: [3, 4, 5], arithmeticDelta: 0 }
    ]
    const result = formatTraceSteps(steps)
    expect(result).toContain('Rolled')
    expect(result).toContain('Drop Lowest 1')
    expect(result).toContain('~~2~~')
  })

  test('returns a non-empty string for any valid steps array', () => {
    const steps: readonly RollTraceStep[] = [
      { kind: 'rolls', label: 'Rolled', unchanged: [1], removed: [], added: [] }
    ]
    const result = formatTraceSteps(steps)
    expect(result.length).toBeGreaterThan(0)
  })
})
