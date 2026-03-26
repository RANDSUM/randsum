import { describe, expect, test } from 'bun:test'
import { render } from 'ink-testing-library'
import React from 'react'
import { NotationRoller } from '../../src/ink/NotationRoller'

describe('NotationRoller (ink)', () => {
  test('renders without crashing', () => {
    const { lastFrame } = render(<NotationRoller />)
    expect(lastFrame()).toBeDefined()
  })

  test('shows default notation in output', () => {
    const { lastFrame } = render(<NotationRoller defaultNotation="4d6L" />)
    expect(lastFrame()).toContain('4d6L')
  })

  test('renders controlled notation', () => {
    const { lastFrame } = render(<NotationRoller notation="2d8" />)
    expect(lastFrame()).toContain('2d8')
  })

  test('shows invalid feedback for bad notation', () => {
    const { lastFrame } = render(<NotationRoller notation="xyz" />)
    expect(lastFrame()).toContain('Invalid')
  })

  test('shows valid feedback for valid notation', () => {
    const { lastFrame } = render(<NotationRoller notation="1d20" />)
    expect(lastFrame()).toContain('Valid')
  })
})
