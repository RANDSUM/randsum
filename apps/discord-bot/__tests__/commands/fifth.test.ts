import { beforeEach, describe, expect, mock, test } from 'bun:test'

const mockEmbed = {
  setColor: mock(() => mockEmbed),
  setTitle: mock(() => mockEmbed),
  setDescription: mock(() => mockEmbed),
  setFooter: mock(() => mockEmbed),
  addFields: mock(() => mockEmbed)
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
  total: 15,
  result: 15,
  rolls: [{ initialRolls: [15], rolls: [15], modifierLogs: [] }],
  details: { criticals: undefined }
}))

void mock.module('@randsum/games/fifth', () => ({ roll: mockRoll }))

const { fifthCommand } = await import('../../src/commands/fifth.js')

function makeInteraction(
  modifier: number | null = 0,
  rollingWith: string | null = null
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
      getInteger: mock(() => modifier),
      getString: mock(() => rollingWith)
    }
  }
}

beforeEach(() => {
  for (const fn of Object.values(mockEmbed)) fn.mockClear()
  mockRoll.mockClear()
})

describe('fifthCommand', () => {
  test('normal roll uses blue color', async () => {
    const interaction = makeInteraction()
    await fifthCommand.execute(interaction as never)
    expect(mockEmbed.setColor).toHaveBeenCalledWith(0x1e90ff)
    expect(mockEmbed.setTitle).toHaveBeenCalledWith('D&D 5e Roll: 15')
  })

  test('passes crit: true in the roll call', async () => {
    const interaction = makeInteraction(3)
    await fifthCommand.execute(interaction as never)
    expect(mockRoll).toHaveBeenCalledWith({ modifier: 3, crit: true })
  })

  test('passes crit: true with rollingWith advantage', async () => {
    const interaction = makeInteraction(2, 'Advantage')
    await fifthCommand.execute(interaction as never)
    expect(mockRoll).toHaveBeenCalledWith({
      modifier: 2,
      crit: true,
      rollingWith: 'Advantage'
    })
  })

  test('passes crit: true with rollingWith disadvantage', async () => {
    const interaction = makeInteraction(0, 'Disadvantage')
    await fifthCommand.execute(interaction as never)
    expect(mockRoll).toHaveBeenCalledWith({
      modifier: 0,
      crit: true,
      rollingWith: 'Disadvantage'
    })
  })

  test('natural 20 uses gold color and "Natural 20!" prefix', async () => {
    mockRoll.mockImplementationOnce(() => ({
      total: 20,
      result: 20,
      rolls: [{ initialRolls: [20], rolls: [20], modifierLogs: [] }],
      details: { criticals: { isNatural20: true, isNatural1: false } }
    }))
    const interaction = makeInteraction()
    await fifthCommand.execute(interaction as never)
    expect(mockEmbed.setColor).toHaveBeenCalledWith(0xffd700)
    expect(mockEmbed.setTitle).toHaveBeenCalledWith('Natural 20! D&D 5e Roll: 20')
  })

  test('natural 1 uses crimson color and "Natural 1!" prefix', async () => {
    mockRoll.mockImplementationOnce(() => ({
      total: 1,
      result: 1,
      rolls: [{ initialRolls: [1], rolls: [1], modifierLogs: [] }],
      details: { criticals: { isNatural20: false, isNatural1: true } }
    }))
    const interaction = makeInteraction()
    await fifthCommand.execute(interaction as never)
    expect(mockEmbed.setColor).toHaveBeenCalledWith(0xdc143c)
    expect(mockEmbed.setTitle).toHaveBeenCalledWith('Natural 1! D&D 5e Roll: 1')
  })

  test('error path: roll throws, replies with error embed', async () => {
    mockRoll.mockImplementationOnce(() => {
      throw new Error('Test error')
    })
    const interaction = makeInteraction()
    await fifthCommand.execute(interaction as never)
    expect(interaction.editReply).toHaveBeenCalledWith({ embeds: [mockEmbed] })
    expect(mockEmbed.setTitle).toHaveBeenCalledWith('Error')
  })
})
