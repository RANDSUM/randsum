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
  }),
  setURL: mock(() => {
    return mockEmbed
  })
}

const mockSelectMenu = {
  setCustomId: mock(() => mockSelectMenu),
  setPlaceholder: mock(() => mockSelectMenu),
  addOptions: mock(() => mockSelectMenu),
  setDisabled: mock(() => mockSelectMenu)
}

const mockActionRow = {
  addComponents: mock(() => mockActionRow)
}

const mockCollector = {
  on: mock(() => mockCollector),
  stop: mock(() => undefined)
}

const mockMessage = {
  createMessageComponentCollector: mock(() => mockCollector),
  edit: mock(() => Promise.resolve(undefined))
}

void mock.module('../../src/utils/discord.js', () => ({
  EmbedBuilder: mock(() => mockEmbed),
  StringSelectMenuBuilder: mock(() => mockSelectMenu),
  ActionRowBuilder: mock(() => mockActionRow),
  SlashCommandBuilder: class {
    public setName(): this {
      return this
    }
    public setDescription(): this {
      return this
    }
  },
  ComponentType: { StringSelect: 3 }
}))

// Mock NOTATION_DOCS with a controlled fixture so tests are deterministic
const mockNotationDocs = {
  L: {
    key: 'L',
    category: 'Filter',
    title: 'Drop Lowest',
    description: 'Drops the lowest die from the pool',
    color: '#abc123',
    colorLight: '#123abc',
    displayBase: 'L',
    forms: [{ notation: 'NdSL', note: 'Drop lowest die' }],
    examples: [{ notation: '4d6L', description: 'Roll 4d6, drop lowest' }]
  },
  H: {
    key: 'H',
    category: 'Filter',
    title: 'Drop Highest',
    description: 'Drops the highest die from the pool',
    color: '#abc123',
    colorLight: '#123abc',
    displayBase: 'H',
    forms: [{ notation: 'NdSH', note: 'Drop highest die' }],
    examples: [{ notation: '4d6H', description: 'Roll 4d6, drop highest' }]
  },
  'C{..}': {
    key: 'C{..}',
    category: 'Clamp',
    title: 'Cap',
    description: 'Clamps dice to a range',
    color: '#def456',
    colorLight: '#456def',
    displayBase: 'C{..}',
    forms: [{ notation: 'NdSC{..}', note: 'Cap dice' }],
    examples: [{ notation: '4d6C{>5}', description: 'Cap at 5' }]
  }
}

void mock.module('@randsum/roller/docs', () => ({
  NOTATION_DOCS: mockNotationDocs
}))

const { notationCommand } = await import('../../src/commands/notation.js')

function makeInteraction(): {
  deferReply: ReturnType<typeof mock>
  editReply: ReturnType<typeof mock>
} {
  return {
    deferReply: mock(() => Promise.resolve(undefined)),
    editReply: mock(() => Promise.resolve(mockMessage) as ReturnType<ReturnType<typeof mock>>)
  }
}

beforeEach(() => {
  for (const fn of Object.values(mockEmbed)) fn.mockClear()
  for (const fn of Object.values(mockSelectMenu)) fn.mockClear()
  for (const fn of Object.values(mockActionRow)) fn.mockClear()
  for (const fn of Object.values(mockCollector)) fn.mockClear()
  for (const fn of Object.values(mockMessage)) fn.mockClear()
})

describe('notationCommand', () => {
  test('defers reply and edits once', async () => {
    const interaction = makeInteraction()
    await notationCommand.execute(interaction as never)
    expect(interaction.deferReply).toHaveBeenCalledTimes(1)
    expect(interaction.editReply).toHaveBeenCalledTimes(1)
  })

  test('uses NOTATION_DOCS grouped by category', async () => {
    const interaction = makeInteraction()
    await notationCommand.execute(interaction as never)
    // StringSelectMenuBuilder should be instantiated (for category pagination)
    const { StringSelectMenuBuilder } = await import('../../src/utils/discord.js')
    expect(StringSelectMenuBuilder).toHaveBeenCalled()
  })

  test('embed title links to notation.randsum.dev', async () => {
    const interaction = makeInteraction()
    await notationCommand.execute(interaction as never)
    expect(mockEmbed.setTitle).toHaveBeenCalledWith('notation.randsum.dev')
    expect(mockEmbed.setURL).toHaveBeenCalledWith('https://notation.randsum.dev')
  })

  test('embed shows fields for first category entries', async () => {
    const interaction = makeInteraction()
    await notationCommand.execute(interaction as never)
    expect(mockEmbed.addFields).toHaveBeenCalled()
  })

  test('collector is created with 5-minute timeout', async () => {
    const interaction = makeInteraction()
    await notationCommand.execute(interaction as never)
    expect(mockMessage.createMessageComponentCollector).toHaveBeenCalledWith(
      expect.objectContaining({ time: 5 * 60 * 1000 })
    )
  })

  test('collector registers end handler to disable menu', async () => {
    const interaction = makeInteraction()
    await notationCommand.execute(interaction as never)
    const onCalls = (mockCollector.on as ReturnType<typeof mock>).mock.calls
    const endCall = onCalls.find((args: unknown[]) => args[0] === 'end')
    expect(endCall).toBeDefined()
  })

  test('select menu options include all categories', async () => {
    const interaction = makeInteraction()
    await notationCommand.execute(interaction as never)
    // addOptions called with category entries
    expect(mockSelectMenu.addOptions).toHaveBeenCalled()
    const addOptionsCall = (mockSelectMenu.addOptions as ReturnType<typeof mock>).mock
      .calls[0]?.[0] as { label: string; value: string }[] | undefined
    const labels = addOptionsCall?.map((o: { label: string }) => o.label) ?? []
    // Our mock has two categories: Filter and Clamp
    expect(labels).toContain('Filter')
    expect(labels).toContain('Clamp')
  })
})
