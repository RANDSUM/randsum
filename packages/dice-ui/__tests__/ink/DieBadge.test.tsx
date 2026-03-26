import { describe, expect, test } from 'bun:test'
import { render } from 'ink-testing-library'
import React from 'react'
import { DieBadge } from '../../src/ink/DieBadge'

describe('DieBadge (ink)', () => {
  test('renders value for unchanged variant', () => {
    const { lastFrame } = render(<DieBadge value={6} variant="unchanged" />)
    expect(lastFrame()).toContain('6')
  })

  test('renders value for removed variant', () => {
    const { lastFrame } = render(<DieBadge value={3} variant="removed" />)
    expect(lastFrame()).toContain('3')
  })

  test('renders value for added variant', () => {
    const { lastFrame } = render(<DieBadge value={5} variant="added" />)
    expect(lastFrame()).toContain('5')
  })
})
