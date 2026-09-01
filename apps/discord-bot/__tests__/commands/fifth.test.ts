import { beforeEach, describe, expect, mock, test } from 'bun:test'
import type { APIEmbed } from 'discord.js'
import { makeContext, type RawOption } from './lib/context.js'

const mockRoll = mock(
  (): { total: number; result: number; rolls: unknown[]; details: unknown } => ({
    total: 15,
    result: 15,
    rolls: [{ initialRolls: [15], rolls: [15], modifierLogs: [] }],
    details: { criticals: undefined }
  })
)

void mock.module('@randsum/games/fifth', () => ({ roll: mockRoll }))

const { fifthCommand } = await import('../../src/commands/fifth.js')

function render(options: readonly RawOption[] = []): APIEmbed {
  return fifthCommand.buildEmbed!(makeContext(options)).toJSON()
}

function diceValue(embed: APIEmbed, name: string): string | undefined {
  return (embed.fields ?? []).find(field => field.name === name)?.value
}

beforeEach(() => {
  mockRoll.mockClear()
})

describe('fifthCommand', () => {
  test('normal roll uses blue color', () => {
    const embed = render()
    expect(embed.color).toBe(0x1e90ff)
    expect(embed.title).toBe('D&D 5e Roll: 15')
  })

  test('passes crit: true in the roll call', () => {
    render([{ name: 'modifier', value: 3 }])
    expect(mockRoll).toHaveBeenCalledWith({ modifier: 3, crit: true })
  })

  test('passes crit: true with rollingWith advantage', () => {
    render([
      { name: 'modifier', value: 2 },
      { name: 'rolling_with', value: 'Advantage' }
    ])
    expect(mockRoll).toHaveBeenCalledWith({
      modifier: 2,
      crit: true,
      rollingWith: 'Advantage'
    })
  })

  test('passes crit: true with rollingWith disadvantage', () => {
    render([{ name: 'rolling_with', value: 'Disadvantage' }])
    expect(mockRoll).toHaveBeenCalledWith({
      modifier: 0,
      crit: true,
      rollingWith: 'Disadvantage'
    })
  })

  test('natural 20 uses gold color and "Natural 20!" prefix', () => {
    mockRoll.mockImplementationOnce(() => ({
      total: 20,
      result: 20,
      rolls: [{ initialRolls: [20], rolls: [20], modifierLogs: [] }],
      details: { criticals: { isNatural20: true, isNatural1: false } }
    }))
    const embed = render()
    expect(embed.color).toBe(0xffd700)
    expect(embed.title).toBe('Natural 20! D&D 5e Roll: 20')
  })

  test('natural 1 uses crimson color and "Natural 1!" prefix', () => {
    mockRoll.mockImplementationOnce(() => ({
      total: 1,
      result: 1,
      rolls: [{ initialRolls: [1], rolls: [1], modifierLogs: [] }],
      details: { criticals: { isNatural20: false, isNatural1: true } }
    }))
    const embed = render()
    expect(embed.color).toBe(0xdc143c)
    expect(embed.title).toBe('Natural 1! D&D 5e Roll: 1')
  })

  test('advantage tie: kept die bold, dropped die struck (not both bold)', () => {
    // Both d20s show 4. The roller keeps one (rolls: [4]); the display must
    // bold exactly one die and strike the other, never bold both.
    mockRoll.mockImplementationOnce(() => ({
      total: 4,
      result: 4,
      rolls: [{ initialRolls: [4, 4], rolls: [4], modifierLogs: [] }],
      details: { criticals: undefined }
    }))
    const embed = render([{ name: 'rolling_with', value: 'Advantage' }])
    expect(diceValue(embed, 'Dice Rolled (2d20)')).toBe('**4**, ~~4~~')
  })

  test('disadvantage tie: kept die bold, dropped die struck (not both bold)', () => {
    mockRoll.mockImplementationOnce(() => ({
      total: 17,
      result: 17,
      rolls: [{ initialRolls: [17, 17], rolls: [17], modifierLogs: [] }],
      details: { criticals: undefined }
    }))
    const embed = render([{ name: 'rolling_with', value: 'Disadvantage' }])
    expect(diceValue(embed, 'Dice Rolled (2d20)')).toBe('**17**, ~~17~~')
  })

  test('advantage non-tie: higher kept bold, lower struck', () => {
    mockRoll.mockImplementationOnce(() => ({
      total: 18,
      result: 18,
      rolls: [{ initialRolls: [18, 5], rolls: [18], modifierLogs: [] }],
      details: { criticals: undefined }
    }))
    const embed = render([{ name: 'rolling_with', value: 'Advantage' }])
    expect(diceValue(embed, 'Dice Rolled (2d20)')).toBe('**18**, ~~5~~')
  })

  test('error path: a failing roll propagates', () => {
    // The dispatcher renders the "Error" embed — see dispatch.test.ts.
    mockRoll.mockImplementationOnce(() => {
      throw new Error('Test error')
    })
    expect(() => render()).toThrow('Test error')
  })
})
