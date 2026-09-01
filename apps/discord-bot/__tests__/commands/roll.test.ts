import { beforeEach, describe, expect, mock, test } from 'bun:test'
import type { APIEmbed } from 'discord.js'
import { makeContext } from './lib/context.js'

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
  suggestNotationFix
} = await import('@randsum/roller')

// Mock functions delegate to real implementations by default.
const mockNotation = mock((...args: Parameters<typeof realNotation>) => realNotation(...args))
const mockRoll = mock(
  (...args: Parameters<typeof realRoll>): { total: number; result?: unknown; rolls: unknown[] } =>
    realRoll(...args)
)

void mock.module('@randsum/roller', () => ({
  roll: mockRoll,
  notation: mockNotation,
  validateFinite,
  validateRange,
  isDiceNotation,
  validateNotation,
  suggestNotationFix,
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

function render(notation: string): APIEmbed {
  return rollCommand.buildEmbed!(makeContext([{ name: 'notation', value: notation }])).toJSON()
}

function fieldNames(embed: APIEmbed): string[] {
  return (embed.fields ?? []).map(field => field.name)
}

beforeEach(() => {
  mockNotation
    .mockClear()
    .mockImplementation((...args: Parameters<typeof realNotation>) => realNotation(...args))
  mockRoll
    .mockClear()
    .mockImplementation((...args: Parameters<typeof realRoll>) => realRoll(...args))
})

describe('rollCommand', () => {
  test('happy path: valid notation calls roll and renders the total', () => {
    mockRoll.mockImplementationOnce(() => ({
      total: 15,
      result: ['8', '7'],
      rolls: [{ initialRolls: [8, 7], rolls: [8, 7], modifierLogs: [] }]
    }))
    const embed = render('2d6')
    expect(mockRoll).toHaveBeenCalledTimes(1)
    expect(embed.title).toBe('You rolled a 15')
    expect(String(embed.description)).toContain('2d6')
  })

  test('invalid notation: throws before roll is reached', () => {
    // Validation runs first, so a bad notation must never make it to the
    // engine. The dispatcher turns this throw into an "Error" embed.
    mockNotation.mockImplementationOnce(() => {
      throw new Error('Invalid')
    })
    expect(() => render('garbage')).toThrow('Invalid')
    expect(mockRoll).not.toHaveBeenCalled()
  })

  test('roll throws: the failure propagates to the dispatcher', () => {
    mockRoll.mockImplementationOnce(() => {
      throw new Error('Roll failed')
    })
    expect(() => render('1d20')).toThrow('Roll failed')
  })

  test('modified rolls same as initial: no Modified Rolls field added', () => {
    mockRoll.mockImplementationOnce(() => ({
      total: 5,
      rolls: [{ initialRolls: [5], rolls: [5], modifierLogs: [] }]
    }))
    const names = fieldNames(render('1d6'))
    expect(names).toContain('Initial Rolls')
    expect(names).not.toContain('Modified Rolls')
  })

  test('modified rolls differ from initial: Modified Rolls field added', () => {
    mockRoll.mockImplementationOnce(() => ({
      total: 7,
      rolls: [{ initialRolls: [3, 4], rolls: [4], modifierLogs: [] }]
    }))
    expect(fieldNames(render('2d6L'))).toContain('Modified Rolls')
  })

  test('an empty roll record renders no dice fields rather than empty ones', () => {
    // `rolls[0]` is optional under noUncheckedIndexedAccess, and an embed field
    // with an empty value is rejected by Discord — so the guard has to hold.
    mockRoll.mockImplementationOnce(() => ({ total: 0, rolls: [] }))
    expect(fieldNames(render('1d6'))).toHaveLength(0)
  })
})
