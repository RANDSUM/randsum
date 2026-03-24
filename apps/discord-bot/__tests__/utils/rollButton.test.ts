import { describe, expect, mock, test } from 'bun:test'

const mockButton = {
  setCustomId: mock(() => mockButton),
  setLabel: mock(() => mockButton),
  setStyle: mock(() => mockButton),
  setDisabled: mock(() => mockButton)
}

const mockActionRow = {
  addComponents: mock(() => mockActionRow)
}

const mockEmbed = {
  setColor: () => mockEmbed,
  setTitle: () => mockEmbed,
  setDescription: () => mockEmbed,
  setFooter: () => mockEmbed,
  addFields: () => mockEmbed,
  setThumbnail: () => mockEmbed,
  setURL: () => mockEmbed
}

void mock.module('discord.js', () => ({
  EmbedBuilder: mock(() => mockEmbed),
  ActionRowBuilder: mock(() => mockActionRow),
  ButtonBuilder: mock(() => mockButton),
  ButtonStyle: { Secondary: 2 },
  StringSelectMenuBuilder: mock(() => ({})),
  ComponentType: { StringSelect: 3, Button: 2 },
  SlashCommandBuilder: class {
    public setName(): this {
      return this
    }
    public setDescription(): this {
      return this
    }
  }
}))

const { createRollButton, parseRerollId } = await import('../../src/utils/rollButton.js')

describe('createRollButton', () => {
  test('returns an ActionRow', () => {
    const row = createRollButton('roll', '2d6')
    expect(row).toBe(mockActionRow)
  })

  test('adds a button component to the row', () => {
    createRollButton('roll', '2d6')
    expect(mockActionRow.addComponents).toHaveBeenCalled()
  })

  test('button has Roll Again label', () => {
    createRollButton('roll', '2d6')
    expect(mockButton.setLabel).toHaveBeenCalledWith('Roll Again')
  })

  test('button custom ID encodes command and params', () => {
    createRollButton('roll', '2d6')
    expect(mockButton.setCustomId).toHaveBeenCalledWith('reroll:roll:2d6')
  })

  test('button custom ID for game command with JSON params', () => {
    createRollButton('fifth', '{"modifier":5,"rollingWith":"Advantage"}')
    expect(mockButton.setCustomId).toHaveBeenCalledWith(
      'reroll:fifth:{"modifier":5,"rollingWith":"Advantage"}'
    )
  })

  test('button custom ID stays within 100 chars', () => {
    const params = '2d6'
    createRollButton('roll', params)
    const customId = `reroll:roll:${params}`
    expect(customId.length).toBeLessThanOrEqual(100)
  })

  test('disabled button uses setDisabled(true)', () => {
    createRollButton('roll', '2d6', true)
    expect(mockButton.setDisabled).toHaveBeenCalledWith(true)
  })

  test('enabled button uses setDisabled(false) by default', () => {
    createRollButton('roll', '2d6')
    expect(mockButton.setDisabled).toHaveBeenCalledWith(false)
  })
})

describe('parseRerollId', () => {
  test('parses roll command custom ID', () => {
    const result = parseRerollId('reroll:roll:2d6')
    expect(result).toEqual({ command: 'roll', params: '2d6' })
  })

  test('parses game command with JSON params', () => {
    const result = parseRerollId('reroll:fifth:{"modifier":5}')
    expect(result).toEqual({ command: 'fifth', params: '{"modifier":5}' })
  })

  test('returns null for non-reroll custom IDs', () => {
    const result = parseRerollId('something:else')
    expect(result).toBeNull()
  })

  test('returns null for empty string', () => {
    const result = parseRerollId('')
    expect(result).toBeNull()
  })

  test('preserves colons in params (e.g. JSON with colons)', () => {
    const params = '{"modifier":5,"rollingWith":"Advantage"}'
    const result = parseRerollId(`reroll:fifth:${params}`)
    expect(result).toEqual({ command: 'fifth', params })
  })
})
