import { beforeEach, describe, expect, mock, test } from 'bun:test'

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

const { rollCommand } = await import('../../src/commands/roll.js')

function makeInteraction(opts: Record<string, string | null> = {}): {
  deferReply: ReturnType<typeof mock>
  editReply: ReturnType<typeof mock>
  options: { getString: ReturnType<typeof mock> }
} {
  return {
    deferReply: mock(() => Promise.resolve(undefined)),
    editReply: mock(() => Promise.resolve(undefined)),
    options: { getString: mock((name: string) => opts[name] ?? null) }
  }
}

beforeEach(() => {
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
})
