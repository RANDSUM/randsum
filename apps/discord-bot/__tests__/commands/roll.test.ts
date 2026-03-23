import { beforeEach, describe, expect, mock, test } from 'bun:test'

// @randsum/roller is mocked via mock.module below, so we import from its source entry
// to get real implementations that bypass the mock. This single import replaces what were
// previously 5 deep relative imports into roller/notation internals.
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
  setThumbnail: mock(() => {
    return mockEmbed
  }),
  setURL: mock(() => {
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

// Mock functions delegate to real implementations by default.
// This is critical: mock.module leaks globally in Bun, so if other test files
// import roll from @randsum/roller, they must get the real behavior, not mock data.
// Only individual tests override with mockImplementationOnce for controlled results.
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

// Mock subpath imports to match the narrowed imports in source
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
  for (const fn of Object.values(mockEmbed)) fn.mockClear()
  // Reset to real implementations (mockClear only resets call counts, not implementation)
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
    expect(mockEmbed.setTitle).toHaveBeenCalledWith('You rolled a 15')
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
    expect(mockEmbed.addFields).toHaveBeenCalled()
  })

  test('error with suggestion: embed description includes "Did you mean" text', async () => {
    mockNotation.mockImplementationOnce(() => {
      throw new Error('Invalid notation')
    })
    mockSuggestNotationFix.mockImplementationOnce(() => '2d6')
    const interaction = makeInteraction({ notation: '2d garbage' })
    await rollCommand.execute(interaction as never)
    expect(interaction.editReply).toHaveBeenCalledTimes(1)
    expect(mockEmbed.setDescription).toHaveBeenCalledWith(
      expect.stringContaining('Did you mean `2d6`?')
    )
  })

  test('error without suggestion: shows generic error message without "Did you mean"', async () => {
    mockNotation.mockImplementationOnce(() => {
      throw new Error('Invalid notation')
    })
    mockSuggestNotationFix.mockImplementationOnce(() => undefined)
    const interaction = makeInteraction({ notation: 'zzz' })
    await rollCommand.execute(interaction as never)
    expect(interaction.editReply).toHaveBeenCalledTimes(1)
    expect(mockEmbed.setDescription).not.toHaveBeenCalledWith(
      expect.stringContaining('Did you mean')
    )
  })
})
