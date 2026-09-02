import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { makeContext } from './lib/context.js'
import { accentsOf, textOf } from '../lib/view.js'
import { BLADES } from '../../src/utils/palette.js'
import type { RollView } from '../../src/types.js'

const mockRoll = mock((): { result: string; total: number; rolls: unknown[] } => ({
  result: 'success',
  total: 5,
  rolls: [{ initialRolls: [5, 3], rolls: [5], modifierLogs: [] }]
}))

void mock.module('@randsum/games/blades', () => ({ roll: mockRoll }))

const { bladesCommand } = await import('../../src/commands/blades.js')

function render(dice: number): RollView {
  return bladesCommand.buildView!(makeContext([{ name: 'dice', value: dice }]))
}

beforeEach(() => {
  mockRoll.mockReset().mockImplementation(() => ({
    result: 'success',
    total: 5,
    rolls: [{ initialRolls: [5, 3], rolls: [5], modifierLogs: [] }]
  }))
})

describe('bladesCommand', () => {
  test("a full success leads with the book's own phrasing", () => {
    const view = render(3)
    expect(textOf(view)).toContain('## ◆ Full Success')
    expect(textOf(view)).toContain('You do it.')
    expect(accentsOf(view)[0]).toBe(BLADES.success)
  })

  test('a critical is distinct from a plain success in both word and colour', () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 'critical' as const,
      total: 6,
      rolls: [{ initialRolls: [6, 6], rolls: [6, 6], modifierLogs: [] }]
    }))
    const view = render(2)
    expect(textOf(view)).toContain('## ✸ Critical')
    expect(accentsOf(view)[0]).toBe(BLADES.critical)
  })

  test('a partial says what it costs', () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 'partial' as const,
      total: 4,
      rolls: [{ initialRolls: [4, 3], rolls: [4], modifierLogs: [] }]
    }))
    const view = render(2)
    expect(textOf(view)).toContain('## ◈ Partial Success')
    expect(textOf(view)).toContain("there's a consequence")
    expect(accentsOf(view)[0]).toBe(BLADES.partial)
  })

  test('a bad outcome is not the same red as a validation error', () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 'failure' as const,
      total: 2,
      rolls: [{ initialRolls: [2, 1], rolls: [2], modifierLogs: [] }]
    }))
    const view = render(1)
    expect(textOf(view)).toContain('## ✕ Bad Outcome')
    expect(accentsOf(view)[0]).toBe(BLADES.failure)
  })

  test('reads the dice option Discord actually sends', () => {
    render(4)
    expect(mockRoll).toHaveBeenCalledWith({ rating: 4 })
  })

  test('0 dice is a real value, not an absent one', () => {
    // Blades rolls 2 dice and takes the lowest at rating 0, so `?? default`
    // logic that treats 0 as missing would silently change the mechanic.
    mockRoll.mockImplementationOnce(() => ({
      result: 'failure' as const,
      total: 2,
      rolls: [{ initialRolls: [2, 5], rolls: [2], modifierLogs: [] }]
    }))
    expect(textOf(render(0))).toContain('0 dice — roll two, take the worst')
  })

  test('at 0 dice the KEPT die is bold, not the highest', () => {
    // The regression this guards: the renderer used to bold `Math.max(...)`,
    // so a (2, 5) desperate roll bolded the 5 and labelled it "Highest Roll"
    // while the headline read Failure — from the 2 the engine actually kept.
    mockRoll.mockImplementationOnce(() => ({
      result: 'failure' as const,
      total: 2,
      rolls: [{ initialRolls: [2, 5], rolls: [2], modifierLogs: [] }]
    }))
    const text = textOf(render(0))
    expect(text).toContain('**2**')
    expect(text).toContain('~~5~~')
    expect(text).toContain('**Deciding Die** 2')
  })

  test('error path: a failing roll propagates', () => {
    // The dispatcher owns error rendering now — it catches this and returns an
    // error response (covered in __tests__/worker/dispatch.test.ts). What the
    // renderer owes it is a throw, not a half-built view.
    mockRoll.mockImplementationOnce(() => {
      throw new Error('Test error')
    })
    expect(() => render(3)).toThrow('Test error')
  })
})
