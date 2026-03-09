import { beforeEach, describe, expect, mock, test } from 'bun:test'

const mockEmbed = {
  setColor: mock(() => {
    return mockEmbed
  }),
  setTitle: mock(() => {
    return mockEmbed
  }),
  setDescription: mock(() => {
    return mockEmbed
  }),
  setFooter: mock(() => {
    return mockEmbed
  }),
  addFields: mock(() => {
    return mockEmbed
  })
}

class OptionBuilder {
  public setName(): this {
    return this
  }
  public setDescription(): this {
    return this
  }
  public setRequired(): this {
    return this
  }
  public setMinValue(): this {
    return this
  }
  public setMaxValue(): this {
    return this
  }
  public addChoices(): this {
    return this
  }
}

void mock.module('discord.js', () => ({
  EmbedBuilder: mock(() => mockEmbed),
  SlashCommandBuilder: class {
    public setName(): this {
      return this
    }
    public setDescription(): this {
      return this
    }
    public addIntegerOption(fn: (o: OptionBuilder) => unknown): this {
      fn(new OptionBuilder())
      return this
    }
    public addStringOption(fn: (o: OptionBuilder) => unknown): this {
      fn(new OptionBuilder())
      return this
    }
  }
}))

const mockRoll = mock(() => ({
  result: 'strong_hit' as const,
  total: 10,
  rolls: [{ initialRolls: [5, 5], rolls: [5, 5], modifierLogs: [] }]
}))

void mock.module('@randsum/pbta', () => ({ roll: mockRoll }))

const { pbtaCommand } = await import('../../src/commands/pbta.js')

function makeInteraction(
  opts: {
    stat?: number
    forward?: number
    ongoing?: number
    rollingWith?: string | null
  } = {}
): {
  deferReply: ReturnType<typeof mock>
  editReply: ReturnType<typeof mock>
  options: {
    getInteger: ReturnType<typeof mock>
    getString: ReturnType<typeof mock>
  }
} {
  return {
    deferReply: mock(() => Promise.resolve(undefined)),
    editReply: mock(() => Promise.resolve(undefined)),
    options: {
      getInteger: mock((name: string) => {
        if (name === 'stat') return opts.stat ?? 2
        if (name === 'forward') return opts.forward ?? 0
        if (name === 'ongoing') return opts.ongoing ?? 0
        return 0
      }),
      getString: mock((_name: string) => opts.rollingWith ?? null)
    }
  }
}

beforeEach(() => {
  for (const fn of Object.values(mockEmbed)) fn.mockClear()
  mockRoll.mockClear()
})

describe('pbtaCommand', () => {
  test('strong hit', async () => {
    const interaction = makeInteraction({ stat: 2 })
    await pbtaCommand.execute(interaction as never)
    expect(mockEmbed.setTitle).toHaveBeenCalledWith('Strong Hit!')
  })

  test('weak hit', async () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 'weak_hit' as const,
      total: 8,
      rolls: [{ initialRolls: [4, 4], rolls: [4, 4], modifierLogs: [] }]
    }))
    const interaction = makeInteraction({ stat: 1 })
    await pbtaCommand.execute(interaction as never)
    expect(mockEmbed.setTitle).toHaveBeenCalledWith('Weak Hit')
  })

  test('miss', async () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 'miss' as const,
      total: 4,
      rolls: [{ initialRolls: [2, 2], rolls: [2, 2], modifierLogs: [] }]
    }))
    const interaction = makeInteraction({ stat: -1 })
    await pbtaCommand.execute(interaction as never)
    expect(mockEmbed.setTitle).toHaveBeenCalledWith('Miss')
  })

  test('non-zero forward adds forward field', async () => {
    const interaction = makeInteraction({ stat: 2, forward: 1 })
    await pbtaCommand.execute(interaction as never)
    expect(mockEmbed.addFields).toHaveBeenCalled()
  })

  test('non-zero ongoing adds ongoing field', async () => {
    const interaction = makeInteraction({ stat: 2, ongoing: 2 })
    await pbtaCommand.execute(interaction as never)
    expect(mockEmbed.addFields).toHaveBeenCalled()
  })

  test('rollingWith adds rolling_with field', async () => {
    const interaction = makeInteraction({ stat: 2, rollingWith: 'Advantage' })
    await pbtaCommand.execute(interaction as never)
    expect(mockEmbed.addFields).toHaveBeenCalled()
  })
})
