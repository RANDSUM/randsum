import { beforeEach, describe, expect, mock, test } from 'bun:test'

const mockCollector = {
  on: mock(() => mockCollector)
}

const mockRow = {}
void mock.module('../../src/utils/rollButton.js', () => ({
  createRollButton: mock(() => mockRow)
}))

// Import real roller implementations — no discord.js mocking needed.
const {
  roll: realRoll,
  isDiceNotation,
  notation: realNotation,
  validateNotation,
  validateFinite,
  validateRange,
  RandsumError,
  NotationParseError,
  ModifierError,
  ValidationError,
  RollError,
  ERROR_CODES,
  suggestNotationFix: realSuggestNotationFix
} = await import('../../../../packages/roller/src/index')

// Mock functions delegate to real implementations by default.
const mockNotation = mock((...args: Parameters<typeof realNotation>) => realNotation(...args))
const mockRoll = mock((...args: Parameters<typeof realRoll>) => realRoll(...args))
const mockSuggestNotationFix = mock((...args: Parameters<typeof realSuggestNotationFix>) =>
  realSuggestNotationFix(...args)
)

void mock.module('@randsum/roller', () => ({
  roll: mockRoll,
  notation: mockNotation,
  validateFinite,
  validateRange,
  isDiceNotation,
  validateNotation,
  suggestNotationFix: mockSuggestNotationFix,
  RandsumError,
  NotationParseError,
  ModifierError,
  ValidationError,
  RollError,
  ERROR_CODES
}))

void mock.module('@randsum/roller/roll', () => ({
  roll: mockRoll
}))

void mock.module('@randsum/roller/validate', () => ({
  notation: mockNotation,
  isDiceNotation,
  validateNotation,
  validateFinite,
  validateRange
}))

const mockTraceRoll = mock(() => [
  { kind: 'rolls', label: 'Rolled', unchanged: [3, 4], removed: [], added: [] }
])

void mock.module('@randsum/roller/trace', () => ({
  traceRoll: mockTraceRoll,
  formatAsMath: mock((rolls: number[], delta = 0) => {
    const terms = rolls.map((n: number, i: number) => (i === 0 ? String(n) : `+ ${n}`))
    if (delta > 0) terms.push(`+ ${delta}`)
    return terms.join(' ')
  })
}))

const { rollCommand } = await import('../../src/commands/roll.js')

function makeInteraction(opts: Record<string, string | null> = {}): {
  deferReply: ReturnType<typeof mock>
  editReply: ReturnType<typeof mock>
  options: { getString: ReturnType<typeof mock> }
} {
  return {
    deferReply: mock(() => Promise.resolve(undefined)),
    editReply: mock(() =>
      Promise.resolve({ createMessageComponentCollector: mock(() => mockCollector) })
    ),
    options: { getString: mock((name: string) => opts[name] ?? null) }
  }
}

beforeEach(() => {
  for (const fn of Object.values(mockCollector)) fn.mockClear()
  mockNotation
    .mockClear()
    .mockImplementation((...args: Parameters<typeof realNotation>) => realNotation(...args))
  mockRoll
    .mockClear()
    .mockImplementation((...args: Parameters<typeof realRoll>) => realRoll(...args))
  mockSuggestNotationFix
    .mockClear()
    .mockImplementation((...args: Parameters<typeof realSuggestNotationFix>) =>
      realSuggestNotationFix(...args)
    )
  mockTraceRoll
    .mockClear()
    .mockImplementation(() => [
      { kind: 'rolls', label: 'Rolled', unchanged: [3, 4], removed: [], added: [] }
    ])
})

describe('rollCommand', () => {
  test('happy path: valid notation calls roll and replies with embed', async () => {
    mockRoll.mockImplementationOnce(() => ({
      total: 15,
      result: ['8', '7'],
      rolls: [{ initialRolls: [8, 7], rolls: [8, 7], modifierLogs: [] }]
    }))
    const interaction = makeInteraction({ notation: '2d6' })
    await rollCommand.execute(interaction as never)
    expect(interaction.deferReply).toHaveBeenCalledTimes(1)
    expect(mockRoll).toHaveBeenCalledTimes(1)
    expect(interaction.editReply).toHaveBeenCalledTimes(1)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => Record<string, unknown> }[]
    }
    const embedJson = call.embeds[0]!.toJSON()
    expect(embedJson.title).toBe('You rolled a 15')
  })

  test('reply includes re-roll button component', async () => {
    mockRoll.mockImplementationOnce(() => ({
      total: 15,
      result: ['8', '7'],
      rolls: [{ initialRolls: [8, 7], rolls: [8, 7], modifierLogs: [] }]
    }))
    const interaction = makeInteraction({ notation: '2d6' })
    await rollCommand.execute(interaction as never)
    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({ components: expect.any(Array) })
    )
  })

  test('invalid notation: replyWithError called, roll not called', async () => {
    mockNotation.mockImplementationOnce(() => {
      throw new Error('Invalid')
    })
    const interaction = makeInteraction({ notation: 'garbage' })
    await rollCommand.execute(interaction as never)
    expect(mockRoll).not.toHaveBeenCalled()
    expect(interaction.editReply).toHaveBeenCalledTimes(1)
  })

  test('roll throws: replies with error embed', async () => {
    mockRoll.mockImplementationOnce(() => {
      throw new Error('Roll failed')
    })
    const interaction = makeInteraction({ notation: '1d20' })
    await rollCommand.execute(interaction as never)
    expect(interaction.editReply).toHaveBeenCalledTimes(1)
  })

  test('modified rolls same as initial: no Modified Rolls field added', async () => {
    mockRoll.mockImplementationOnce(() => ({
      total: 5,
      rolls: [{ initialRolls: [5], rolls: [5], modifierLogs: [] }]
    }))
    const interaction = makeInteraction({ notation: '1d6' })
    await rollCommand.execute(interaction as never)
    expect(interaction.editReply).toHaveBeenCalledTimes(1)
  })

  test('modified rolls differ from initial: Modified Rolls field added', async () => {
    mockRoll.mockImplementationOnce(() => ({
      total: 7,
      rolls: [{ initialRolls: [3, 4], rolls: [4], modifierLogs: [] }]
    }))
    const interaction = makeInteraction({ notation: '2d6L' })
    await rollCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => Record<string, unknown> }[]
    }
    const embedJson = call.embeds[0]!.toJSON() as { fields?: { name: string }[] }
    const fieldNames = (embedJson.fields ?? []).map(f => f.name)
    expect(fieldNames).toContain('Modified Rolls')
  })

  test('error with suggestion: embed description includes "Did you mean" text', async () => {
    mockNotation.mockImplementationOnce(() => {
      throw new Error('Invalid notation')
    })
    mockSuggestNotationFix.mockImplementationOnce(() => '2d6')
    const interaction = makeInteraction({ notation: '2d garbage' })
    await rollCommand.execute(interaction as never)
    expect(interaction.editReply).toHaveBeenCalledTimes(1)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => Record<string, unknown> }[]
    }
    const embedJson = call.embeds[0]!.toJSON()
    expect(String(embedJson.description)).toContain('Did you mean `2d6`?')
  })

  test('error without suggestion: shows generic error message without "Did you mean"', async () => {
    mockNotation.mockImplementationOnce(() => {
      throw new Error('Invalid notation')
    })
    mockSuggestNotationFix.mockImplementationOnce(() => undefined)
    const interaction = makeInteraction({ notation: 'zzz' })
    await rollCommand.execute(interaction as never)
    expect(interaction.editReply).toHaveBeenCalledTimes(1)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => Record<string, unknown> }[]
    }
    const embedJson = call.embeds[0]!.toJSON()
    expect(String(embedJson.description)).not.toContain('Did you mean')
  })

  test('Show Work button omitted when trace has only 1 step', async () => {
    mockRoll.mockImplementationOnce(() => ({
      total: 5,
      rolls: [{ initialRolls: [5], rolls: [5], modifierLogs: [], total: 5, appliedTotal: 5 }]
    }))
    mockTraceRoll.mockImplementationOnce(() => [
      { kind: 'rolls', label: 'Rolled', unchanged: [5], removed: [], added: [] }
    ])
    const interaction = makeInteraction({ notation: '1d6' })
    await rollCommand.execute(interaction as never)
    const callArgs = interaction.editReply.mock.calls[0]?.[0] as { components: unknown[] }
    expect(callArgs.components).toHaveLength(1)
  })

  test('Show Work button present when trace has more than 1 step', async () => {
    mockRoll.mockImplementationOnce(() => ({
      total: 7,
      rolls: [
        {
          initialRolls: [3, 4],
          rolls: [4],
          modifierLogs: [{ modifier: 'drop', options: { lowest: 1 }, removed: [3], added: [] }],
          total: 7,
          appliedTotal: 7
        }
      ]
    }))
    mockTraceRoll.mockImplementationOnce(() => [
      { kind: 'rolls', label: 'Rolled', unchanged: [3, 4], removed: [], added: [] },
      { kind: 'rolls', label: 'Drop Lowest 1', unchanged: [4], removed: [3], added: [] },
      { kind: 'finalRolls', rolls: [4], arithmeticDelta: 0 }
    ])
    const interaction = makeInteraction({ notation: '2d6L' })
    await rollCommand.execute(interaction as never)
    const callArgs = interaction.editReply.mock.calls[0]?.[0] as { components: unknown[] }
    expect(callArgs.components).toHaveLength(2)
  })
})
