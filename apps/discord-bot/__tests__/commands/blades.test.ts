import { beforeEach, describe, expect, mock, test } from 'bun:test'
import type { APIEmbed } from 'discord.js'
import { makeContext } from './lib/context.js'

const mockRoll = mock((): { result: string; total: number; rolls: unknown[] } => ({
  result: 'success',
  total: 5,
  rolls: [{ initialRolls: [5, 3], rolls: [5], modifierLogs: [] }]
}))

void mock.module('@randsum/games/blades', () => ({ roll: mockRoll }))

const { bladesCommand } = await import('../../src/commands/blades.js')

function render(dice: number): APIEmbed {
  return bladesCommand.buildEmbed!(makeContext([{ name: 'dice', value: dice }])).toJSON()
}

beforeEach(() => {
  mockRoll.mockClear()
})

describe('bladesCommand', () => {
  test('success result', () => {
    expect(render(3).title).toBe('Success!')
  })

  test('critical result', () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 'critical' as const,
      total: 6,
      rolls: [{ initialRolls: [6, 6], rolls: [6, 6], modifierLogs: [] }]
    }))
    expect(render(2).title).toBe('Critical Success!')
  })

  test('partial result', () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 'partial' as const,
      total: 4,
      rolls: [{ initialRolls: [4, 3], rolls: [4], modifierLogs: [] }]
    }))
    expect(render(2).title).toBe('Partial Success')
  })

  test('failure result', () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 'failure' as const,
      total: 2,
      rolls: [{ initialRolls: [2, 1], rolls: [2], modifierLogs: [] }]
    }))
    expect(render(1).title).toBe('Failure')
  })

  test('reads the dice option Discord actually sends', () => {
    render(4)
    expect(mockRoll).toHaveBeenCalledWith({ rating: 4 })
  })

  test('0 dice is a real value, not an absent one', () => {
    // Blades rolls 2 dice and takes the lowest at rating 0, so `?? default`
    // logic that treats 0 as missing would silently change the mechanic.
    const embed = render(0)
    const pool = (embed.fields ?? []).find(field => field.name === 'Dice Pool')
    expect(pool?.value).toBe('0 dice (rolled 2, taking lowest)')
  })

  test('error path: a failing roll propagates', () => {
    // The dispatcher owns error rendering now — it catches this and returns an
    // "Error" embed (covered in __tests__/worker/dispatch.test.ts). What
    // buildEmbed owes it is a throw, not a half-built embed.
    mockRoll.mockImplementationOnce(() => {
      throw new Error('Test error')
    })
    expect(() => render(3)).toThrow('Test error')
  })
})
