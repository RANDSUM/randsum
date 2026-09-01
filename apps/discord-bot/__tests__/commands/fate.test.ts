import { beforeEach, describe, expect, mock, test } from 'bun:test'
import type { APIEmbed } from 'discord.js'
import { makeContext, type RawOption } from './lib/context.js'

const mockRoll = mock((): { result: string; total: number; rolls: unknown[] } => ({
  result: 'great',
  total: 4,
  rolls: [{ initialRolls: [1, 1, 0, 1], rolls: [1, 1, 0, 1], modifierLogs: [] }]
}))

void mock.module('@randsum/games/fate', () => ({ roll: mockRoll }))

const { fateCommand } = await import('../../src/commands/fate.js')

function render(options: readonly RawOption[] = []): APIEmbed {
  return fateCommand.buildEmbed!(makeContext(options)).toJSON()
}

function field(embed: APIEmbed, name: string): { name: string; value: string } | undefined {
  return (embed.fields ?? []).find(entry => entry.name === name)
}

beforeEach(() => {
  mockRoll.mockClear()
})

describe('fateCommand', () => {
  test('titles the embed with the ladder rung', () => {
    expect(render().title).toBe('Great')
  })

  test('renders the four Fate dice symbols', () => {
    expect(field(render(), 'Fate Dice (4dF)')?.value).toBe('+  +  ▢  +')
  })

  test('non-zero skill adds a skill field', () => {
    expect(field(render([{ name: 'skill', value: 3 }]), 'Skill')?.value).toBe('+3')
  })

  test('zero skill omits the skill field', () => {
    expect(field(render([{ name: 'skill', value: 0 }]), 'Skill')).toBeUndefined()
  })

  test('clamps an out-of-range skill to the ladder bounds', () => {
    render([{ name: 'skill', value: 99 }])
    expect(mockRoll).toHaveBeenCalledWith({ modifier: 5 })
  })

  test('clamps a below-range skill to the ladder floor', () => {
    render([{ name: 'skill', value: -99 }])
    expect(mockRoll).toHaveBeenCalledWith({ modifier: -2 })
  })

  test('error path: a failing roll propagates', () => {
    // The dispatcher renders the "Error" embed — see dispatch.test.ts.
    mockRoll.mockImplementationOnce(() => {
      throw new Error('Test error')
    })
    expect(() => render([{ name: 'skill', value: 1 }])).toThrow('Test error')
  })
})
