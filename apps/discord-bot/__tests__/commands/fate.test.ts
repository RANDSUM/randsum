import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { makeContext } from './lib/context.js'
import { accentsOf, textOf } from '../lib/view.js'
import { FATE } from '../../src/utils/palette.js'
import type { RollView } from '../../src/types.js'

const good = (): { result: string; total: number; rolls: unknown[] } => ({
  result: 'good',
  total: 3,
  rolls: [{ initialRolls: [1, 0, -1, 1], rolls: [1, 0, -1, 1], modifierLogs: [] }]
})

const mockRoll = mock(good)

void mock.module('@randsum/games/fate', () => ({ roll: mockRoll }))

const { fateCommand } = await import('../../src/commands/fate.js')

function render(options: { name: string; value: unknown }[] = []): RollView {
  return fateCommand.buildView!(makeContext(options))
}

beforeEach(() => {
  mockRoll.mockReset().mockImplementation(good)
})

describe('fateCommand', () => {
  test('the headline is the ladder rung and its number', () => {
    // The ladder is a number line, so the rung alone loses half the meaning.
    const view = render()
    expect(textOf(view)).toContain('## Good (+3)')
    expect(accentsOf(view)[0]).toBe(FATE.good)
  })

  test('Fate dice render as monospace tiles, not a tofu-prone glyph', () => {
    // The old renderer used ▢ (U+25A2), which has patchy font coverage and
    // rendered as tofu on some Android and Linux configurations.
    const text = textOf(render())
    expect(text).toContain('`[+]`')
    expect(text).toContain('`[ ]`')
    expect(text).toContain('`[-]`')
    expect(text).not.toContain('▢')
  })

  test('opposition resolves shifts into a real Fate outcome', () => {
    // Fate's actual outcomes are Fail / Tie / Success / Succeed with Style,
    // measured in shifts. A bare ladder rung tells a Fate player nothing.
    expect(textOf(render([{ name: 'opposition', value: 0 }]))).toContain('Succeed with Style')
    expect(textOf(render([{ name: 'opposition', value: 2 }]))).toContain('Success')
    expect(textOf(render([{ name: 'opposition', value: 3 }]))).toContain('Tie')
    expect(textOf(render([{ name: 'opposition', value: 5 }]))).toContain('Fail')
  })

  test('a tie is described as a tie, not as "0 shifts over"', () => {
    expect(textOf(render([{ name: 'opposition', value: 3 }]))).toContain('A tie')
  })

  test('shift counts are singular or plural as appropriate', () => {
    expect(textOf(render([{ name: 'opposition', value: 2 }]))).toContain('1 shift over')
    expect(textOf(render([{ name: 'opposition', value: 0 }]))).toContain('3 shifts over')
  })

  test('without opposition the rung stands alone, with no invented outcome', () => {
    const text = textOf(render())
    expect(text).not.toContain('Succeed with Style')
    expect(text).not.toContain('shift')
  })

  test('a skill appears only when non-zero', () => {
    expect(textOf(render())).not.toContain('**Skill**')
    expect(textOf(render([{ name: 'skill', value: 2 }]))).toContain('**Skill** +2')
  })

  test('an out-of-range skill is clamped to the ladder bounds', () => {
    render([{ name: 'skill', value: 99 }])
    expect(mockRoll).toHaveBeenCalledWith({ modifier: 5 })

    render([{ name: 'skill', value: -99 }])
    expect(mockRoll).toHaveBeenLastCalledWith({ modifier: -2 })
  })

  test('error path: a failing roll propagates', () => {
    mockRoll.mockImplementationOnce(() => {
      throw new Error('Test error')
    })
    expect(() => render()).toThrow('Test error')
  })

  test('the accent follows the outcome, not the ladder rung', () => {
    // A Legendary total against stiffer opposition is still a Fail, and the
    // accent used to come from the rung — so a failure rendered gold while the
    // word beside it read "Fail". palette.ts promises the accent lets a player
    // read success-versus-failure before any text; for this path it lied.
    mockRoll.mockImplementationOnce(() => ({
      result: 'legendary',
      total: 8,
      rolls: [{ initialRolls: [1, 1, 1, 0], rolls: [1, 1, 1, 0], modifierLogs: [] }]
    }))
    const view = render([{ name: 'opposition', value: 10 }])
    expect(textOf(view)).toContain('Fail')
    expect(accentsOf(view)[0]).toBe(FATE.terrible)
    expect(accentsOf(view)[0]).not.toBe(FATE.legendary)
  })

  test('a low rung that beats weak opposition is not painted as a failure', () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 'poor',
      total: -1,
      rolls: [{ initialRolls: [-1, 0, 0, 0], rolls: [-1, 0, 0, 0], modifierLogs: [] }]
    }))
    const view = render([{ name: 'opposition', value: -4 }])
    expect(textOf(view)).toContain('Succeed with Style')
    expect(accentsOf(view)[0]).toBe(FATE.legendary)
  })

  test('without opposition the rung still drives the accent', () => {
    // No verdict to report, so the ladder is all there is.
    expect(accentsOf(render())[0]).toBe(FATE.good)
  })
})
