import { beforeEach, describe, expect, mock, test } from 'bun:test'

const mockCollector = {
  on: mock(() => mockCollector),
  stop: mock(() => undefined)
}

const mockMessage = {
  createMessageComponentCollector: mock(() => mockCollector),
  edit: mock(() => Promise.resolve(undefined))
}

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

  test('editReply includes embeds and components', async () => {
    const interaction = makeInteraction()
    await notationCommand.execute(interaction as never)
    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        embeds: expect.any(Array),
        components: expect.any(Array)
      })
    )
  })

  test('embed title links to notation.randsum.dev', async () => {
    const interaction = makeInteraction()
    await notationCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => Record<string, unknown> }[]
    }
    const embedJson = call.embeds[0]!.toJSON()
    expect(embedJson.title).toBe('notation.randsum.dev')
    expect(embedJson.url).toBe('https://notation.randsum.dev')
  })

  test('embed shows fields for first category entries', async () => {
    const interaction = makeInteraction()
    await notationCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => Record<string, unknown> }[]
    }
    const embedJson = call.embeds[0]!.toJSON() as { fields?: unknown[] }
    expect(embedJson.fields).toBeDefined()
    expect((embedJson.fields ?? []).length).toBeGreaterThan(0)
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

  test('components include a select menu with category options', async () => {
    const interaction = makeInteraction()
    await notationCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      components: { toJSON: () => { components: { options?: { label: string }[] }[] } }[]
    }
    const rowJson = call.components[0]?.toJSON()
    const selectMenu = rowJson?.components[0]
    const labels = (selectMenu?.options ?? []).map(o => o.label)
    expect(labels).toContain('Filter')
    expect(labels).toContain('Clamp')
  })
})
