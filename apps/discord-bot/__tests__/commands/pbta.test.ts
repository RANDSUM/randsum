import { beforeEach, describe, expect, mock, test } from 'bun:test'
import type { APIEmbed } from 'discord.js'
import { makeContext, type RawOption } from './lib/context.js'

const mockRoll = mock((): { result: string; total: number; rolls: unknown[] } => ({
  result: 'strong_hit',
  total: 10,
  rolls: [{ initialRolls: [5, 5], rolls: [5, 5], modifierLogs: [] }]
}))

void mock.module('@randsum/games/pbta', () => ({ roll: mockRoll }))

const { pbtaCommand } = await import('../../src/commands/pbta.js')

function render(options: readonly RawOption[] = [{ name: 'stat', value: 2 }]): APIEmbed {
  return pbtaCommand.buildEmbed!(makeContext(options)).toJSON()
}

function fieldNames(embed: APIEmbed): string[] {
  return (embed.fields ?? []).map(field => field.name)
}

beforeEach(() => {
  mockRoll.mockClear()
})

describe('pbtaCommand', () => {
  test('strong hit', () => {
    expect(render().title).toBe('Strong Hit!')
  })

  test('weak hit', () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 'weak_hit' as const,
      total: 8,
      rolls: [{ initialRolls: [4, 4], rolls: [4, 4], modifierLogs: [] }]
    }))
    expect(render([{ name: 'stat', value: 1 }]).title).toBe('Weak Hit')
  })

  test('miss', () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 'miss' as const,
      total: 4,
      rolls: [{ initialRolls: [2, 2], rolls: [2, 2], modifierLogs: [] }]
    }))
    expect(render([{ name: 'stat', value: -1 }]).title).toBe('Miss')
  })

  test('non-zero forward adds forward field', () => {
    const embed = render([
      { name: 'stat', value: 2 },
      { name: 'forward', value: 1 }
    ])
    expect(fieldNames(embed)).toContain('Forward')
    expect(mockRoll).toHaveBeenCalledWith({ stat: 2, forward: 1 })
  })

  test('non-zero ongoing adds ongoing field', () => {
    const embed = render([
      { name: 'stat', value: 2 },
      { name: 'ongoing', value: 2 }
    ])
    expect(fieldNames(embed)).toContain('Ongoing')
    expect(mockRoll).toHaveBeenCalledWith({ stat: 2, ongoing: 2 })
  })

  test('rollingWith is forwarded under the key the roller accepts', () => {
    // Regression guard: the command used to pass `{ advantage: true }`, a key
    // the generated roller does not declare. A conditional spread dodges
    // excess-property checking, so it compiled, was silently dropped, and the
    // embed reported advantage over a plain 2d6.
    const embed = render([
      { name: 'stat', value: 2 },
      { name: 'rolling_with', value: 'Advantage' }
    ])
    expect(fieldNames(embed)).toContain('Rolling With')
    expect(mockRoll).toHaveBeenCalledWith({ stat: 2, rollingWith: 'Advantage' })
  })

  test('a negative stat renders with its sign', () => {
    const embed = render([{ name: 'stat', value: -1 }])
    const stat = (embed.fields ?? []).find(field => field.name === 'Stat')
    expect(stat?.value).toBe('-1')
  })

  test('error path: a failing roll propagates', () => {
    // The dispatcher renders the "Error" embed — see dispatch.test.ts.
    mockRoll.mockImplementationOnce(() => {
      throw new Error('Test error')
    })
    expect(() => render()).toThrow('Test error')
  })
})
