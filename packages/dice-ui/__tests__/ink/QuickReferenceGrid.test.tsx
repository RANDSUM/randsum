import { describe, expect, test } from 'bun:test'
import { render } from 'ink-testing-library'
import React from 'react'
import { QuickReferenceGrid } from '../../src/ink/QuickReferenceGrid'

describe('QuickReferenceGrid (ink)', () => {
  test('renders without crashing', () => {
    const { lastFrame } = render(<QuickReferenceGrid notation="1d20" />)
    expect(lastFrame()).toBeDefined()
  })

  test('renders category heading', () => {
    const { lastFrame } = render(<QuickReferenceGrid notation="1d20" />)
    // NOTATION_DOCS always has Core dice category
    expect(lastFrame()).toContain('Core')
  })

  test('renders at least one displayBase entry', () => {
    const { lastFrame } = render(<QuickReferenceGrid notation="1d20" />)
    // xDN is the core dice displayBase
    expect(lastFrame()).toContain('xDN')
  })
})
