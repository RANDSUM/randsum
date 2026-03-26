import { describe, expect, test } from 'bun:test'
import { render } from 'ink-testing-library'
import React from 'react'
import type { RollRecord } from '@randsum/roller'
import { RollSteps } from '../../src/ink/RollSteps'

const mockRecord: RollRecord = {
  argument: '2d6',
  notation: '2d6',
  description: ['2d6'],
  parameters: {
    sides: 6,
    quantity: 2,
    modifiers: {},
    argument: '2d6',
    description: ['2d6'],
    notation: '2d6'
  },
  rolls: [3, 4],
  initialRolls: [3, 4],
  modifierLogs: [],
  appliedTotal: 7,
  total: 7
}

const mockRecordWithReplacement: RollRecord = {
  argument: '2d6ro{<2}',
  notation: '2d6ro{<2}',
  description: ['2d6 reroll once below 2'],
  parameters: {
    sides: 6,
    quantity: 2,
    modifiers: { rerollOnce: { lessThan: 2 } },
    argument: '2d6ro{<2}',
    description: ['2d6 reroll once below 2'],
    notation: '2d6ro{<2}'
  },
  rolls: [3, 4],
  initialRolls: [1, 4],
  modifierLogs: [
    {
      modifier: 'rerollOnce',
      options: { lessThan: 2 },
      added: [3],
      removed: [1],
      replacements: [{ from: 1, to: 3 }]
    }
  ],
  appliedTotal: 7,
  total: 7
}

describe('RollSteps (ink)', () => {
  test('renders without crashing', () => {
    const { lastFrame } = render(<RollSteps record={mockRecord} />)
    expect(lastFrame()).toBeDefined()
  })

  test('renders heading when showHeading is true', () => {
    const { lastFrame } = render(<RollSteps record={mockRecord} showHeading />)
    expect(lastFrame()).toContain('2d6')
  })

  test('does not render heading by default', () => {
    const { lastFrame } = render(<RollSteps record={mockRecord} />)
    // heading should not appear by default
    expect(lastFrame()).not.toContain('2d6')
  })

  test('renders replacement pairs (from→to) when replacements are present', () => {
    const { lastFrame } = render(<RollSteps record={mockRecordWithReplacement} />)
    const frame = lastFrame()
    // from value (1) and to value (3) should both appear
    expect(frame).toContain('1')
    expect(frame).toContain('3')
    // arrow separator should appear
    expect(frame).toContain('→')
  })

  test('renders unchanged dice alongside replacements', () => {
    const { lastFrame } = render(<RollSteps record={mockRecordWithReplacement} />)
    // unchanged die value (4) should still appear
    expect(lastFrame()).toContain('4')
  })
})
