import { beforeEach, describe, expect, mock, test } from 'bun:test'
import type { APIEmbed } from 'discord.js'

const mockRoll = mock((): { result: string; total: number; rolls: unknown[] } => ({
  result: 'great',
  total: 4,
  rolls: [{ initialRolls: [1, 1, 0, 1], rolls: [1, 1, 0, 1], modifierLogs: [] }]
}))

void mock.module('@randsum/games/fate', () => ({ roll: mockRoll }))

const { fateCommand } = await import('../../src/commands/fate.js')

function makeInteraction(
  opts: {
    skill?: number
  } = {}
): {
  deferReply: ReturnType<typeof mock>
  editReply: ReturnType<typeof mock>
  options: {
    getInteger: ReturnType<typeof mock>
    getString: ReturnType<typeof mock>
    getBoolean: ReturnType<typeof mock>
  }
} {
  return {
    deferReply: mock(() => Promise.resolve(undefined)),
    editReply: mock(() => Promise.resolve(undefined)),
    options: {
      getInteger: mock((name: string) => {
        if (name === 'skill') return opts.skill ?? 0
        return 0
      }),
      getString: mock((_name: string) => null),
      getBoolean: mock(() => false)
    }
  }
}

beforeEach(() => {
  mockRoll.mockClear()
})

describe('fateCommand', () => {
  test('titles the embed with the ladder rung', async () => {
    const interaction = makeInteraction()
    await fateCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => APIEmbed }[]
    }
    const embedJson = call.embeds[0]!.toJSON()
    expect(embedJson.title).toBe('Great')
  })

  test('renders the four Fate dice symbols', async () => {
    const interaction = makeInteraction()
    await fateCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => APIEmbed }[]
    }
    const embedJson = call.embeds[0]!.toJSON() as { fields?: { name: string; value: string }[] }
    const diceField = (embedJson.fields ?? []).find(f => f.name === 'Fate Dice (4dF)')
    expect(diceField).toBeDefined()
    expect(diceField!.value).toBe('+  +  ▢  +')
  })

  test('non-zero skill adds a skill field', async () => {
    const interaction = makeInteraction({ skill: 3 })
    await fateCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => APIEmbed }[]
    }
    const embedJson = call.embeds[0]!.toJSON() as { fields?: { name: string; value: string }[] }
    const skillField = (embedJson.fields ?? []).find(f => f.name === 'Skill')
    expect(skillField).toBeDefined()
    expect(skillField!.value).toBe('+3')
  })

  test('zero skill omits the skill field', async () => {
    const interaction = makeInteraction({ skill: 0 })
    await fateCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => APIEmbed }[]
    }
    const embedJson = call.embeds[0]!.toJSON() as { fields?: { name: string }[] }
    const fieldNames = (embedJson.fields ?? []).map(f => f.name)
    expect(fieldNames).not.toContain('Skill')
  })

  test('clamps an out-of-range skill to the ladder bounds', async () => {
    const interaction = makeInteraction({ skill: 99 })
    await fateCommand.execute(interaction as never)
    expect(mockRoll).toHaveBeenCalledWith({ modifier: 5 })
  })

  test('error path: roll throws, replies with error embed', async () => {
    mockRoll.mockImplementationOnce(() => {
      throw new Error('Test error')
    })
    const interaction = makeInteraction({ skill: 1 })
    await fateCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => APIEmbed }[]
    }
    const embedJson = call.embeds[0]!.toJSON()
    expect(embedJson.title).toBe('Error')
  })
})
