/**
 * Covers the shared Components V2 renderer against the REAL trace engine.
 *
 * `renderTrace` is a thin mapping over `@randsum/roller/trace`, so the trace
 * itself is deliberately NOT mocked — mocking it would test the mapping against
 * a fiction.
 *
 * The records below are literal fixtures copied from real `roll()` output
 * rather than produced by calling `roll()` here. Two reasons: a live roll is
 * random, so an assertion about which die was struck through would be flaky;
 * and sibling test files call `mock.module('@randsum/roller', ...)`, which
 * leaks across files and made `roll()` return `undefined` in this one.
 */
import { describe, expect, test } from 'bun:test'
import type { TraceableRollRecord } from '@randsum/roller/trace'
import {
  CUSTOM_ID_LIMIT,
  renderFacts,
  renderTrace,
  rollContainer
} from '../../../src/commands/lib/view.js'
import { accentsOf, buttonIdsOf, linesOf, textOf } from '../../lib/view.js'

/** Real `roll('4d6L')` output — one die dropped. */
const DROP_RECORD: TraceableRollRecord = {
  initialRolls: [1, 4, 2, 6],
  rolls: [2, 4, 6],
  modifierLogs: [{ modifier: 'drop', options: { lowest: 1 }, added: [], removed: [1] }],
  appliedTotal: 12,
  total: 12
}

/** Real `roll('2d6+3')` output — dice untouched, arithmetic applied. */
const ARITHMETIC_RECORD: TraceableRollRecord = {
  initialRolls: [3, 5],
  rolls: [3, 5],
  modifierLogs: [{ modifier: 'plus', options: 3, added: [], removed: [] }],
  appliedTotal: 11,
  total: 11
}

/** Real `roll('4d6R{<6}')` output — two dice rerolled into sixes. */
const REROLL_RECORD: TraceableRollRecord = {
  initialRolls: [2, 6, 2, 6],
  rolls: [6, 6, 6, 6],
  modifierLogs: [
    {
      modifier: 'reroll',
      options: { lessThan: 6 },
      added: [6, 6],
      removed: [2, 2],
      replacements: [
        { from: 2, to: 6 },
        { from: 2, to: 6 }
      ]
    }
  ],
  appliedTotal: 24,
  total: 24
}

/** Real `roll('2d6')` output — nothing modified it. */
const PLAIN_RECORD: TraceableRollRecord = {
  initialRolls: [4, 5],
  rolls: [4, 5],
  modifierLogs: [],
  appliedTotal: 9,
  total: 9
}

describe('renderTrace', () => {
  test('an unmodified pool renders exactly one line, with no total', () => {
    // The engine emits no `finalRolls` step when nothing modified the pool —
    // there is no arithmetic to summarise. So a plain 2d6 gets one line, and
    // the total reaches the reader through the headline instead. Pinned here
    // because a renderer that assumed a trailing total would silently print
    // nothing for the bot's single most common roll.
    const lines = renderTrace(PLAIN_RECORD)
    expect(lines).toEqual(['**Rolled**  4 5'])
  })

  test('a dropped die is struck through and the kept dice are not', () => {
    expect(renderTrace(DROP_RECORD)).toEqual([
      '**Rolled**  1 4 2 6',
      '**Drop Lowest 1**  ~~1~~ 4 2 6',
      '**Total**  2 + 4 + 6'
    ])
  })

  test('a reroll marks the replaced dice struck and the new dice bold', () => {
    // The information the old renderer lost entirely: two parallel plain lists
    // showed [2,6,2,6] and [6,6,6,6] with nothing saying which changed.
    expect(renderTrace(REROLL_RECORD)).toEqual([
      '**Rolled**  2 6 2 6',
      '**Reroll Less than 6**  ~~2~~ ~~2~~ **6** **6** 6 6',
      '**Total**  6 + 6 + 6 + 6'
    ])
  })

  test('arithmetic appears as its own step, not folded into the dice', () => {
    expect(renderTrace(ARITHMETIC_RECORD)).toEqual([
      '**Rolled**  3 5',
      '**Add**  +3',
      '**Total**  3 + 5 + 3'
    ])
  })
})

describe('renderFacts', () => {
  test('joins label/value pairs into the line that replaces the field grid', () => {
    expect(
      renderFacts([
        { label: 'Stat', value: '+2' },
        { label: 'Forward', value: '+1' }
      ])
    ).toBe('**Stat** +2  ·  **Forward** +1')
  })
})

describe('rollContainer', () => {
  const base = { accent: 0x4fb3a5, headline: '◆ Strong Hit' }

  test('the headline is an h2, which only Components V2 can render', () => {
    expect(linesOf([rollContainer(base)])[0]).toBe('## ◆ Strong Hit')
  })

  test('the accent is whatever the caller passed, not a constant', () => {
    expect(accentsOf([rollContainer({ ...base, accent: 0xb01b2e })])[0]).toBe(0xb01b2e)
  })

  test('attribution is always present, even with no derivation', () => {
    expect(textOf([rollContainer(base)])).toContain('rolled with 👹 by randsum.dev')
  })

  test('a derivation is prefixed to the attribution as subtext', () => {
    const text = textOf([rollContainer({ ...base, derivation: '2d6(4,5) +2 = 11' })])
    expect(text).toContain('-# 2d6(4,5) +2 = 11 · rolled with 👹 by randsum.dev')
  })

  test('a reroll button is attached beside the body when an id is given', () => {
    const view = [rollContainer({ ...base, body: ['dice'], rerollId: 'reroll:roll:2d6' })]
    expect(buttonIdsOf(view)).toEqual(['reroll:roll:2d6'])
  })

  test('an over-long custom_id drops the button rather than sending an invalid one', () => {
    // Discord rejects the whole message when a component exceeds the limit, so
    // silently losing the button is the only safe failure.
    const view = [
      rollContainer({ ...base, body: ['dice'], rerollId: 'r'.repeat(CUSTOM_ID_LIMIT + 1) })
    ]
    expect(buttonIdsOf(view)).toEqual([])
    expect(textOf(view)).toContain('dice')
  })

  test('a body-less container attaches no button and still renders', () => {
    const view = [rollContainer({ ...base, rerollId: 'reroll:x' })]
    expect(buttonIdsOf(view)).toEqual([])
    expect(linesOf(view).length).toBeGreaterThan(0)
  })
})
