import { describe, expect, mock, test } from 'bun:test'

const mockEmbed = {
  setColor: mock(() => mockEmbed),
  setTitle: mock(() => mockEmbed),
  setDescription: mock(() => mockEmbed),
  setFooter: mock(() => mockEmbed),
  addFields: mock(() => mockEmbed),
  setURL: mock(() => mockEmbed)
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
  public setAutocomplete(): this {
    return this
  }
}

void mock.module('discord.js', () => ({
  EmbedBuilder: mock(() => mockEmbed),
  StringSelectMenuBuilder: mock(() => ({})),
  ActionRowBuilder: mock(() => ({ addComponents: () => ({}) })),
  ButtonBuilder: mock(() => ({
    setCustomId: () => ({}),
    setLabel: () => ({}),
    setStyle: () => ({}),
    setDisabled: () => ({})
  })),
  ButtonStyle: { Secondary: 2 },
  ComponentType: { StringSelect: 3, Button: 2 },
  SlashCommandBuilder: class {
    public name = ''
    public description = ''
    public setName(n: string): this {
      this.name = n
      return this
    }
    public setDescription(d: string): this {
      this.description = d
      return this
    }
    public addStringOption(fn: (o: OptionBuilder) => unknown): this {
      fn(new OptionBuilder())
      return this
    }
    public addIntegerOption(fn: (o: OptionBuilder) => unknown): this {
      fn(new OptionBuilder())
      return this
    }
    public addBooleanOption(fn: (o: OptionBuilder) => unknown): this {
      fn(new OptionBuilder())
      return this
    }
  }
}))

void mock.module('@randsum/roller', () => ({
  roll: () => ({ total: 1, result: ['1'], rolls: [] }),
  notation: () => ({}),
  isDiceNotation: () => true,
  validateNotation: () => ({}),
  validateFinite: () => true,
  validateRange: () => true,
  suggestNotationFix: () => undefined
}))

void mock.module('@randsum/roller/roll', () => ({
  roll: () => ({ total: 1, result: ['1'], rolls: [] })
}))

void mock.module('@randsum/roller/validate', () => ({
  notation: () => ({}),
  isDiceNotation: () => true,
  validateNotation: () => ({}),
  validateFinite: () => true,
  validateRange: () => true
}))

void mock.module('@randsum/games/blades', () => ({ roll: () => ({ total: 1 }) }))
void mock.module('@randsum/games/daggerheart', () => ({ roll: () => ({ total: 1 }) }))
void mock.module('@randsum/games/fifth', () => ({ roll: () => ({ total: 1 }) }))
void mock.module('@randsum/games/pbta', () => ({ roll: () => ({ total: 1 }) }))
void mock.module('@randsum/games/root-rpg', () => ({ roll: () => ({ total: 1 }) }))
void mock.module('@randsum/games/salvageunion', () => ({
  roll: () => ({ total: 1 }),
  VALID_TABLE_NAMES: ['Core Mechanic']
}))

// Must mock rollButton to avoid import issues
void mock.module('../../src/utils/rollButton.js', () => ({
  createRollButton: mock(() => ({}))
}))

const { helpCommand } = await import('../../src/commands/help.js')

function makeInteraction(): {
  deferReply: ReturnType<typeof mock>
  editReply: ReturnType<typeof mock>
} {
  return {
    deferReply: mock(() => Promise.resolve(undefined)),
    editReply: mock(() => Promise.resolve(undefined))
  }
}

describe('helpCommand', () => {
  test('has name "help"', () => {
    expect(helpCommand.data.name).toBe('help')
  })

  test('has a description', () => {
    expect(typeof helpCommand.data.description).toBe('string')
    expect(helpCommand.data.description.length).toBeGreaterThan(0)
  })

  test('execute: defers reply', async () => {
    const interaction = makeInteraction()
    await helpCommand.execute(interaction as never)
    expect(interaction.deferReply).toHaveBeenCalledTimes(1)
  })

  test('execute: replies with an embed', async () => {
    const interaction = makeInteraction()
    await helpCommand.execute(interaction as never)
    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({ embeds: expect.any(Array) })
    )
  })

  test('execute: embed uses gold color', async () => {
    const interaction = makeInteraction()
    await helpCommand.execute(interaction as never)
    expect(mockEmbed.setColor).toHaveBeenCalledWith('#FFD700')
  })

  test('execute: embed includes footer', async () => {
    const interaction = makeInteraction()
    await helpCommand.execute(interaction as never)
    expect(mockEmbed.setFooter).toHaveBeenCalled()
  })

  test('execute: embed lists commands via addFields', async () => {
    const interaction = makeInteraction()
    await helpCommand.execute(interaction as never)
    expect(mockEmbed.addFields).toHaveBeenCalled()
  })
})
