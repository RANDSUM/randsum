import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { makeContext } from './lib/context.js'
import { accentsOf, textOf } from '../lib/view.js'
import { FIFTH } from '../../src/utils/palette.js'
import type { RollView } from '../../src/types.js'

interface FifthResult {
  result: number
  total: number
  details: { criticals?: { isNatural1: boolean; isNatural20: boolean } }
  rolls: unknown[]
}

const plain = (): FifthResult => ({
  result: 12,
  total: 12,
  details: { criticals: { isNatural1: false, isNatural20: false } },
  rolls: [{ initialRolls: [12], rolls: [12], modifierLogs: [] }]
})

const mockRoll = mock(plain)

void mock.module('@randsum/games/fifth', () => ({ roll: mockRoll }))

const { fifthCommand } = await import('../../src/commands/fifth.js')

function render(options: { name: string; value: unknown }[] = []): RollView {
  return fifthCommand.buildView!(makeContext(options))
}

beforeEach(() => {
  mockRoll.mockReset().mockImplementation(plain)
})

describe('fifthCommand', () => {
  test('the total leads, and the system name is not repeated back', () => {
    // 5e is the one game where the raw number genuinely is the headline —
    // bounded accuracy makes the whole resolution "compare this to a DC". The
    // old title spent its loudest characters on "D&D 5e Roll:", which the
    // player had just typed.
    const view = render()
    expect(textOf(view)).toContain('## 12')
    expect(textOf(view)).not.toContain('D&D')
    expect(accentsOf(view)[0]).toBe(FIFTH.standard)
  })

  test('a natural 20 is marked, and worded truly for both rules editions', () => {
    // Under the 2014 rules a nat 20 auto-hits on ATTACK ROLLS only, not on
    // checks or saves; 2024 changed that. "Critical hit on an attack roll" is
    // true under both, where a bare "automatic success" would not be.
    mockRoll.mockImplementationOnce(() => ({
      result: 20,
      total: 20,
      details: { criticals: { isNatural1: false, isNatural20: true } },
      rolls: [{ initialRolls: [20], rolls: [20], modifierLogs: [] }]
    }))
    const view = render()
    expect(textOf(view)).toContain('## ✸ Natural 20  ·  20')
    expect(textOf(view)).toContain('Critical hit on an attack roll.')
    expect(accentsOf(view)[0]).toBe(FIFTH.natural20)
  })

  test('a natural 1 gets the fumble glyph and its own colour', () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 1,
      total: 1,
      details: { criticals: { isNatural1: true, isNatural20: false } },
      rolls: [{ initialRolls: [1], rolls: [1], modifierLogs: [] }]
    }))
    const view = render()
    expect(textOf(view)).toContain('## ☠ Natural 1  ·  1')
    expect(accentsOf(view)[0]).toBe(FIFTH.natural1)
  })

  test('a dc resolves the roll instead of leaving the player to compare', () => {
    expect(textOf(render([{ name: 'dc', value: 10 }]))).toContain('Success vs DC 10')
    expect(textOf(render([{ name: 'dc', value: 15 }]))).toContain('Failure vs DC 15')
  })

  test('no dc means no comparison line, not a wrong one', () => {
    expect(textOf(render())).not.toContain('vs DC')
  })

  test('advantage marks the kept die bold and the dropped die struck', () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 18,
      total: 18,
      details: { criticals: { isNatural1: false, isNatural20: false } },
      rolls: [{ initialRolls: [18, 4], rolls: [18], modifierLogs: [] }]
    }))
    const text = textOf(render([{ name: 'rolling_with', value: 'Advantage' }]))
    expect(text).toContain('**2d20, Advantage**')
    expect(text).toContain('**18**')
    expect(text).toContain('~~4~~')
  })

  test('a tie marks exactly one die kept and one dropped, not both bold', () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 9,
      total: 9,
      details: { criticals: { isNatural1: false, isNatural20: false } },
      rolls: [{ initialRolls: [9, 9], rolls: [9], modifierLogs: [] }]
    }))
    const text = textOf(render([{ name: 'rolling_with', value: 'Advantage' }]))
    expect(text).toContain('**9**, ~~9~~')
  })

  test('passes crit: true so the roller reports naturals', () => {
    render()
    expect(mockRoll).toHaveBeenCalledWith({ modifier: 0, crit: true })

    render([{ name: 'rolling_with', value: 'Disadvantage' }])
    expect(mockRoll).toHaveBeenLastCalledWith({
      modifier: 0,
      crit: true,
      rollingWith: 'Disadvantage'
    })
  })

  test('error path: a failing roll propagates', () => {
    mockRoll.mockImplementationOnce(() => {
      throw new Error('Test error')
    })
    expect(() => render()).toThrow('Test error')
  })

  test('a natural 1 that still clears the DC reads as a success, not a fumble', () => {
    // The two-axis bug: a nat 1 on a +30 modifier totals 31 and beats DC 10.
    // Rendering ☠ in fumble red over the word "Success" said the opposite of
    // the line beneath it — the same mistake as labelling a kept-lowest die
    // "Highest Roll". The natural is still announced, because it changes what
    // the roll means; it just no longer decides the colour.
    mockRoll.mockImplementationOnce(() => ({
      result: 31,
      total: 31,
      details: { criticals: { isNatural1: true, isNatural20: false } },
      rolls: [{ initialRolls: [1], rolls: [1], modifierLogs: [] }]
    }))
    const view = render([
      { name: 'modifier', value: 30 },
      { name: 'dc', value: 10 }
    ])
    expect(textOf(view)).toContain('## ◆ Natural 1  ·  31')
    expect(textOf(view)).toContain('Success vs DC 10')
    expect(accentsOf(view)[0]).toBe(FIFTH.natural20)
  })

  test('a natural 20 that misses the DC reads as a failure', () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 15,
      total: 15,
      details: { criticals: { isNatural1: false, isNatural20: true } },
      rolls: [{ initialRolls: [20], rolls: [20], modifierLogs: [] }]
    }))
    const view = render([
      { name: 'modifier', value: -5 },
      { name: 'dc', value: 30 }
    ])
    expect(textOf(view)).toContain('## ✕ Natural 20  ·  15')
    expect(accentsOf(view)[0]).toBe(FIFTH.natural1)
  })
})
