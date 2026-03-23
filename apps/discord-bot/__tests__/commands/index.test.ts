import { describe, expect, mock, test } from 'bun:test'

const mockEmbed = {
  setColor: () => mockEmbed,
  setTitle: () => mockEmbed,
  setDescription: () => mockEmbed,
  setFooter: () => mockEmbed,
  addFields: () => mockEmbed,
  setThumbnail: () => mockEmbed,
  setURL: () => mockEmbed
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
  SlashCommandBuilder: class {
    public name = ''
    public setName(n: string): this {
      this.name = n
      return this
    }
    public setDescription(): this {
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

const { commands } = await import('../../src/commands/index.js')

describe('commands barrel', () => {
  test('exports an array of 8 commands', () => {
    expect(Array.isArray(commands)).toBe(true)
    expect(commands).toHaveLength(8)
  })

  test('each command has data and execute properties', () => {
    for (const command of commands) {
      expect(command).toHaveProperty('data')
      expect(command).toHaveProperty('execute')
      expect(typeof command.execute).toBe('function')
    }
  })

  test('each command has a data object', () => {
    for (const command of commands) {
      expect(command.data).toBeDefined()
    }
  })
})
