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
    expect(html).toContain('nr-result-row')
  })

  test('renders pool header when multiple records', () => {
    const html = renderToStaticMarkup(
      createElement(RollResult, { records: [makeRecord(), makeRecord()] })
    )
    expect(html).toContain('nr-result-pool-header')
    expect(html).toContain('1d6')
  })

  test('does not render pool header for single record', () => {
    const html = renderToStaticMarkup(createElement(RollResult, { records: [makeRecord()] }))
    expect(html).not.toContain('nr-result-pool-header')
  })
})

describe('Tooltip container structure', () => {
  test('tooltip CSS class notation-roller-tooltip is defined in CSS', async () => {
    const css = await Bun.file(
      new URL('../src/components/NotationRoller/NotationRoller.css', import.meta.url).pathname
    ).text()
    expect(css).toContain('.notation-roller-tooltip')
  })

  test('input blur CSS class notation-roller-input--blurred is defined in CSS', async () => {
    const css = await Bun.file(
      new URL('../src/components/NotationRoller/NotationRoller.css', import.meta.url).pathname
    ).text()
    expect(css).toContain('.notation-roller-input--blurred')
  })

  test('tooltip CSS uses absolute positioning', async () => {
    const css = await Bun.file(
      new URL('../src/components/NotationRoller/NotationRoller.css', import.meta.url).pathname
    ).text()
    const tooltipIdx = css.indexOf('.notation-roller-tooltip')
    const blockEnd = css.indexOf('}', tooltipIdx)
    const tooltipBlock = css.slice(tooltipIdx, blockEnd)
    expect(tooltipBlock).toContain('position: absolute')
  })

  test('input blur CSS uses filter: blur()', async () => {
    const css = await Bun.file(
      new URL('../src/components/NotationRoller/NotationRoller.css', import.meta.url).pathname
    ).text()
    const blurIdx = css.indexOf('.notation-roller-input--blurred')
    const blockEnd = css.indexOf('}', blurIdx)
    const blurBlock = css.slice(blurIdx, blockEnd)
    expect(blurBlock).toContain('filter:')
    expect(blurBlock).toContain('blur(')
  })
})
