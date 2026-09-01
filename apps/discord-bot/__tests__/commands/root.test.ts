import { beforeEach, describe, expect, mock, test } from 'bun:test'
import type { APIEmbed } from 'discord.js'
import { makeContext, type RawOption } from './lib/context.js'

const mockRoll = mock((): { result: string; total: number; rolls: unknown[] } => ({
  result: 'strong_hit',
  total: 9,
  rolls: [{ initialRolls: [5, 4], rolls: [5, 4], modifierLogs: [] }]
}))

void mock.module('@randsum/games/root-rpg', () => ({ roll: mockRoll }))

const { rootCommand } = await import('../../src/commands/root.js')

function render(options: readonly RawOption[] = [], displayName = 'Tester'): APIEmbed {
  return rootCommand.buildEmbed!(makeContext(options, displayName)).toJSON()
}

beforeEach(() => {
  mockRoll.mockClear()
})

describe('rootCommand', () => {
  test('Strong Hit', () => {
    expect(render().title).toBe('Tester rolled a Strong Hit')
  })

  test('Weak Hit', () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 'weak_hit' as const,
      total: 7,
      rolls: [{ initialRolls: [4, 3], rolls: [4, 3], modifierLogs: [] }]
    }))
    expect(render().title).toBe('Tester rolled a Weak Hit')
  })

  test('Miss', () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 'miss' as const,
      total: 3,
      rolls: [{ initialRolls: [2, 1], rolls: [2, 1], modifierLogs: [] }]
    }))
    expect(render().title).toBe('Tester rolled a Miss')
  })

  test('titles with the display name the transport supplies', () => {
    // /root is the only command that reads `userDisplayName`, so this is the
    // one place the context's second field is load-bearing. The Worker resolves
    // it from the interaction payload (guild `member.user` or DM `user`).
    expect(render([], 'Vagabond').title).toBe('Vagabond rolled a Strong Hit')
  })

  test('non-zero modifier adds modifier field', () => {
    const embed = render([{ name: 'modifier', value: 2 }])
    expect((embed.fields ?? []).map(field => field.name)).toContain('Modifier')
    expect(mockRoll).toHaveBeenCalledWith({ bonus: 2 })
  })

  test('an absent modifier defaults to zero and omits the field', () => {
    const embed = render()
    expect((embed.fields ?? []).map(field => field.name)).not.toContain('Modifier')
    expect(mockRoll).toHaveBeenCalledWith({ bonus: 0 })
  })

  test('error path: a failing roll propagates', () => {
    // The dispatcher renders the "Error" embed — see dispatch.test.ts.
    mockRoll.mockImplementationOnce(() => {
      throw new Error('Test error')
    })
    expect(() => render()).toThrow('Test error')
  })
})
