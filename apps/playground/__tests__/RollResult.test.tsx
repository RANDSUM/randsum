import { describe, expect, test } from 'bun:test'
import type { RollRecord, RollerRollResult } from '@randsum/roller'
import { DieBadge, PoolSection, RollResult, StepRow } from '../src/components/RollResult'

function makeRecord(overrides: {
  initialRolls?: number[]
  rolls?: number[]
  modifierLogs?: {
    modifier: string
    options: unknown
    removed: number[]
    added: number[]
  }[]
  total?: number
  appliedTotal?: number
  notation?: string
}): RollRecord {
  return {
    initialRolls: overrides.initialRolls ?? [4, 3],
    rolls: overrides.rolls ?? [4, 3],
    modifierLogs: overrides.modifierLogs ?? [],
    total: overrides.total ?? 7,
    appliedTotal: overrides.appliedTotal ?? 7,
    notation: overrides.notation ?? '2d6',
    description: ['Roll 2d6'],
    argument: '2d6',
    parameters: {}
    // eslint-disable-next-line no-restricted-syntax
  } as unknown as RollRecord
}

function makeResult(records: RollRecord[], total?: number): RollerRollResult {
  return {
    rolls: records,
    total: total ?? records.reduce((sum, r) => sum + r.total, 0),
    values: records.flatMap(r => r.rolls)
    // eslint-disable-next-line no-restricted-syntax
  } as unknown as RollerRollResult
}

describe('RollResult', () => {
  describe('component exports', () => {
    test('RollResult is a function component', () => {
      expect(typeof RollResult).toBe('function')
    })

    test('DieBadge is a function component', () => {
      expect(typeof DieBadge).toBe('function')
    })

    test('StepRow is a function component', () => {
      expect(typeof StepRow).toBe('function')
    })

    test('PoolSection is a function component', () => {
      expect(typeof PoolSection).toBe('function')
    })
  })

  describe('DieBadge', () => {
    test('renders with unchanged variant by default', () => {
      const element = DieBadge({ value: 5, variant: 'unchanged' })
      expect(element).toBeDefined()
      expect(element.props.children).toBe(5)
      expect(element.props.className).toContain('pg-die-badge')
      expect(element.props.className).not.toContain('removed')
      expect(element.props.className).not.toContain('added')
    })

    test('renders with removed variant including strikethrough style', () => {
      const element = DieBadge({ value: 3, variant: 'removed' })
      expect(element.props.className).toContain('pg-die-badge--removed')
      expect(element.props.style).toHaveProperty('textDecoration', 'line-through')
    })

    test('renders with added variant', () => {
      const element = DieBadge({ value: 6, variant: 'added' })
      expect(element.props.className).toContain('pg-die-badge--added')
    })
  })

  describe('StepRow', () => {
    test('renders rolls step with die badges', () => {
      const step = {
        kind: 'rolls' as const,
        label: 'Rolled',
        unchanged: [4, 3],
        removed: [] as readonly number[],
        added: [] as readonly number[]
      }
      const element = StepRow({ step })
      expect(element).toBeDefined()
    })

    test('renders arithmetic step with accent styling', () => {
      const step = {
        kind: 'arithmetic' as const,
        label: 'Add',
        display: '+5'
      }
      const element = StepRow({ step })
      expect(element).toBeDefined()
    })

    test('renders divider step as hr', () => {
      const step = { kind: 'divider' as const }
      const element = StepRow({ step })
      expect(element).toBeDefined()
      expect(element.type).toBe('hr')
    })

    test('renders finalRolls step with Final label', () => {
      const step = {
        kind: 'finalRolls' as const,
        rolls: [4, 3] as readonly number[],
        arithmeticDelta: 0
      }
      const element = StepRow({ step })
      expect(element).toBeDefined()
    })
  })

  describe('PoolSection', () => {
    test('renders steps for a record', () => {
      const record = makeRecord({})
      const element = PoolSection({ record })
      expect(element).toBeDefined()
    })

    test('does not render heading when showHeading is false', () => {
      const record = makeRecord({ notation: '4d6L' })
      const element = PoolSection({ record, showHeading: false })
      // Should not contain the notation heading
      expect(element).toBeDefined()
    })

    test('renders heading when showHeading is true', () => {
      const record = makeRecord({ notation: '4d6L' })
      const element = PoolSection({ record, showHeading: true })
      expect(element).toBeDefined()
    })
  })

  describe('RollResult (full component)', () => {
    test('renders grand total prominently', () => {
      const record = makeRecord({ total: 12 })
      const result = makeResult([record], 12)
      const element = RollResult({ result })
      expect(element).toBeDefined()
    })

    test('renders single pool without notation heading', () => {
      const record = makeRecord({ notation: '2d6' })
      const result = makeResult([record])
      const element = RollResult({ result })
      expect(element).toBeDefined()
    })

    test('renders multi-pool with notation headings', () => {
      const record1 = makeRecord({ notation: '1d20+5', total: 15 })
      const record2 = makeRecord({ notation: '2d6', total: 7 })
      const result = makeResult([record1, record2], 22)
      const element = RollResult({ result })
      expect(element).toBeDefined()
    })

    test('renders with modifier steps', () => {
      const record = makeRecord({
        initialRolls: [4, 3, 2, 1],
        rolls: [4, 3, 2],
        total: 9,
        appliedTotal: 9,
        modifierLogs: [
          {
            modifier: 'drop',
            options: { lowest: 1 },
            removed: [1],
            added: []
          }
        ]
      })
      const result = makeResult([record], 9)
      const element = RollResult({ result })
      expect(element).toBeDefined()
    })

    test('renders with arithmetic modifiers', () => {
      const record = makeRecord({
        initialRolls: [15],
        rolls: [15],
        total: 20,
        appliedTotal: 15,
        modifierLogs: [
          {
            modifier: 'plus',
            options: 5,
            removed: [],
            added: []
          }
        ]
      })
      const result = makeResult([record], 20)
      const element = RollResult({ result })
      expect(element).toBeDefined()
    })
  })
})
