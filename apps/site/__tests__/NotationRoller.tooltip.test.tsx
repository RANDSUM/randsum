/**
 * TDD tests for the floating tooltip result display (Story 2).
 *
 * Uses react-dom/server renderToStaticMarkup to verify rendered HTML
 * since no DOM environment (jsdom/happy-dom) is available.
 */
import { describe, expect, test } from 'bun:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { RollResult } from '../src/components/NotationRoller/NotationRoller'
import type { RollRecord } from '@randsum/roller'

// Minimal RollRecord fixture with the full shape computeSteps expects
const makeRecord = (): RollRecord => ({
  notation: '1d6' as RollRecord['notation'],
  argument: '1d6' as RollRecord['argument'],
  description: ['Roll 1 6-sided die'],
  parameters: {
    sides: 6,
    quantity: 1,
    modifiers: {},
    arithmetic: 'add' as const,
    key: 'Roll 1',
    argument: '1d6' as RollRecord['argument'],
    description: ['Roll 1 6-sided die'],
    notation: '1d6' as RollRecord['notation']
  },
  rolls: [4],
  initialRolls: [4],
  modifierLogs: [],
  appliedTotal: 4,
  total: 4
})

describe('RollResult component', () => {
  test('renders nr-result-inner container', () => {
    const html = renderToStaticMarkup(createElement(RollResult, { records: [makeRecord()] }))
    expect(html).toContain('nr-result-inner')
  })

  test('renders step rows for a single pool', () => {
    const html = renderToStaticMarkup(createElement(RollResult, { records: [makeRecord()] }))
    expect(html).toContain('du-step-row')
  })

  test('renders pool header when multiple records', () => {
    const html = renderToStaticMarkup(
      createElement(RollResult, { records: [makeRecord(), makeRecord()] })
    )
    expect(html).toContain('du-pool-heading')
    expect(html).toContain('1d6')
  })

  test('does not render pool header for single record', () => {
    const html = renderToStaticMarkup(createElement(RollResult, { records: [makeRecord()] }))
    expect(html).not.toContain('du-pool-heading')
  })
})

describe('Tooltip container structure', () => {
  test('result overlay CSS class is defined in CSS', async () => {
    const css = await Bun.file(
      new URL('../src/components/NotationRoller/NotationRoller.css', import.meta.url).pathname
    ).text()
    expect(css).toContain('.notation-roller-result-overlay')
  })

  test('result backdrop CSS class is defined in CSS', async () => {
    const css = await Bun.file(
      new URL('../src/components/NotationRoller/NotationRoller.css', import.meta.url).pathname
    ).text()
    expect(css).toContain('.notation-roller-result-backdrop')
  })

  test('result overlay CSS uses absolute positioning', async () => {
    const css = await Bun.file(
      new URL('../src/components/NotationRoller/NotationRoller.css', import.meta.url).pathname
    ).text()
    const overlayIdx = css.indexOf('.notation-roller-result-overlay')
    const blockEnd = css.indexOf('}', overlayIdx)
    const overlayBlock = css.slice(overlayIdx, blockEnd)
    expect(overlayBlock).toContain('position: absolute')
  })

  test('result backdrop CSS uses backdrop-filter: blur()', async () => {
    const css = await Bun.file(
      new URL('../src/components/NotationRoller/NotationRoller.css', import.meta.url).pathname
    ).text()
    const backdropIdx = css.indexOf('.notation-roller-result-backdrop')
    const blockEnd = css.indexOf('}', backdropIdx)
    const backdropBlock = css.slice(backdropIdx, blockEnd)
    expect(backdropBlock).toContain('backdrop-filter:')
    expect(backdropBlock).toContain('blur(')
  })
})
