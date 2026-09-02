import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { makeContext } from './lib/context.js'
import {
  accentsOf,
  buttonIdsOf,
  characterCountOf,
  componentCountOf,
  linesOf,
  textOf
} from '../lib/view.js'
import type { RollView } from '../../src/types.js'

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

function render(notation: string): RollView {
  return rollCommand.buildView!(makeContext([{ name: 'notation', value: notation }]))
}

beforeEach(() => {
  // `mockReset` rather than `mockClear`: clear keeps queued one-shot
  // implementations, so a `mockImplementationOnce` left unconsumed by a test
  // that threw early would silently be picked up by the next test.
  mockNotation
    .mockReset()
    .mockImplementation((...args: Parameters<typeof realNotation>) => realNotation(...args))
  mockRoll
    .mockReset()
    .mockImplementation((...args: Parameters<typeof realRoll>) => realRoll(...args))
})

describe('rollCommand', () => {
  test('happy path: valid notation calls roll and renders the total', () => {
    mockRoll.mockImplementationOnce(() => ({
      total: 15,
      result: ['8', '7'],
      rolls: [{ initialRolls: [8, 7], rolls: [8, 7], modifierLogs: [] }]
    }))
    const view = render('2d6')
    expect(mockRoll).toHaveBeenCalledTimes(1)
    expect(linesOf(view)[0]).toBe('## 15')
    expect(textOf(view)).toContain('2d6')
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

  test('unmodified pool: dice render plain, with no drop marking', () => {
    mockRoll.mockImplementationOnce(() => ({
      total: 5,
      rolls: [
        {
          notation: '1d6',
          description: ['Roll 1 6-sided die'],
          total: 5,
          initialRolls: [5],
          rolls: [5],
          modifierLogs: [],
          appliedTotal: 5
        }
      ]
    }))
    const text = textOf(render('1d6'))
    expect(text).toContain('## 5')
    expect(text).toContain('**Rolled**  5')
    expect(text).not.toContain('~~')
  })

  test('modified pool: dropped dice are struck through in place', () => {
    // The old renderer printed "Initial Rolls" and "Modified Rolls" as two
    // plain lists and left the reader to diff them.
    mockRoll.mockImplementationOnce(() => ({
      total: 9,
      rolls: [
        {
          notation: '3d6L',
          description: ['Roll 3 6-sided dice', 'Drop lowest'],
          total: 9,
          initialRolls: [4, 5, 1],
          rolls: [4, 5],
          modifierLogs: [{ modifier: 'drop', options: { lowest: 1 }, added: [], removed: [1] }],
          appliedTotal: 9
        }
      ]
    }))
    const text = textOf(render('3d6L'))
    expect(text).toContain('~~1~~')
    expect(text).toContain('Drop Lowest 1')
  })

  test("the roller's own description explains what the notation meant", () => {
    // `record.description` is generated on every roll and was never rendered.
    mockRoll.mockImplementationOnce(() => ({
      total: 9,
      rolls: [
        {
          notation: '3d6L',
          description: ['Roll 3 6-sided dice', 'Drop lowest'],
          total: 9,
          initialRolls: [4, 5, 1],
          rolls: [4, 5],
          modifierLogs: [{ modifier: 'drop', options: { lowest: 1 }, added: [], removed: [1] }],
          appliedTotal: 9
        }
      ]
    }))
    expect(textOf(render('3d6L'))).toContain('Roll 3 6-sided dice · Drop lowest')
  })

  test('a repeat renders every pool, plus a total container', () => {
    // The regression this guards: the renderer read `rolls[0]` only, so a
    // second pool's dice were invisible while its total was still reported.
    mockRoll.mockImplementationOnce(() => ({
      total: 14,
      rolls: [
        {
          notation: '4d6L',
          description: [],
          total: 7,
          initialRolls: [3, 4],
          rolls: [3, 4],
          modifierLogs: [],
          appliedTotal: 7
        },
        {
          notation: '4d6L',
          description: [],
          total: 7,
          initialRolls: [7],
          rolls: [7],
          modifierLogs: [],
          appliedTotal: 7
        }
      ]
    }))
    const view = render('4d6Lx2')
    expect(view).toHaveLength(3) // two pools plus the total
    const text = textOf(view)
    expect(text).toContain('## 4d6L  ·  7')
    expect(text).toContain('## Total  14')
  })

  test('a large repeat stays under the 40-component cap', () => {
    // The regression this guards, and the reason the previous version of this
    // test did not: it asserted `view.length <= 9`, which is the CONTAINER
    // count. That passes at 53 components. `4d6Lx6` shipped 41 and Discord
    // rejected the message outright — the six-ability-score idiom, broken.
    mockRoll.mockImplementationOnce(() => ({
      total: 60,
      rolls: Array.from({ length: 20 }, () => ({
        notation: '3d6',
        description: [],
        total: 3,
        initialRolls: [1, 1, 1],
        rolls: [1, 1, 1],
        modifierLogs: [],
        appliedTotal: 3
      }))
    }))
    const view = render('3d6x20')
    expect(componentCountOf(view)).toBeLessThanOrEqual(40)
    expect(textOf(view)).toContain('further pools not shown')
  })

  test('a huge pool stays under the character budget', () => {
    // Not bounded by MAX_POOLS: the roller allows 1000 dice per pool, so
    // `300d100x8` measured at 7850 characters against a ~4000 budget.
    mockRoll.mockImplementationOnce(() => ({
      total: 120000,
      rolls: Array.from({ length: 8 }, () => ({
        notation: '300d100',
        description: [],
        total: 15000,
        initialRolls: Array.from({ length: 300 }, () => 100),
        rolls: Array.from({ length: 300 }, () => 100),
        modifierLogs: [],
        appliedTotal: 15000
      }))
    }))
    const view = render('300d100x8')
    expect(characterCountOf(view)).toBeLessThanOrEqual(4000)
    expect(componentCountOf(view)).toBeLessThanOrEqual(40)
  })

  test('a single over-long pool is rendered rather than dropped', () => {
    // One pool is the whole answer to what the user asked; dropping it would
    // leave a container reporting a total with no dice at all.
    mockRoll.mockImplementationOnce(() => ({
      total: 100000,
      rolls: [
        {
          notation: '1000d1000',
          description: [],
          total: 100000,
          initialRolls: Array.from({ length: 1000 }, () => 1000),
          rolls: Array.from({ length: 1000 }, () => 1000),
          modifierLogs: [],
          appliedTotal: 100000
        }
      ]
    }))
    expect(render('1000d1000')).toHaveLength(1)
  })

  test('the accent is the brand colour, not an outcome tier', () => {
    // `/roll` has no outcome, so unlike the game commands its accent is
    // identity rather than signal.
    mockRoll.mockImplementationOnce(() => ({
      total: 4,
      rolls: [
        {
          notation: '1d6',
          description: [],
          total: 4,
          initialRolls: [4],
          rolls: [4],
          modifierLogs: [],
          appliedTotal: 4
        }
      ]
    }))
    expect(accentsOf(render('1d6'))[0]).toBe(0x7c3aed)
  })

  test('a reroll button carries the notation, on the first container only', () => {
    mockRoll.mockImplementationOnce(() => ({
      total: 4,
      rolls: [
        {
          notation: '2d6',
          description: [],
          total: 4,
          initialRolls: [4],
          rolls: [4],
          modifierLogs: [],
          appliedTotal: 4
        }
      ]
    }))
    expect(buttonIdsOf(render('2d6'))).toEqual(['r:roll:notation=2d6'])
  })

  test('an over-long notation drops the reroll button rather than sending an invalid id', () => {
    // A real, valid notation that is simply too long to round-trip: an
    // annotation label pushes it past the 100-character custom_id ceiling.
    const long = `2d6+3[${'a'.repeat(95)}]`
    mockRoll.mockImplementationOnce(() => ({
      total: 7,
      rolls: [
        {
          notation: '2d6',
          description: [],
          total: 7,
          initialRolls: [3, 4],
          rolls: [3, 4],
          modifierLogs: [],
          appliedTotal: 7
        }
      ]
    }))
    expect(buttonIdsOf(render(long))).toEqual([])
  })

  test('an empty roll result renders nothing rather than an empty container', () => {
    mockRoll.mockImplementationOnce(() => ({ total: 0, rolls: [] }))
    expect(render('1d6')).toHaveLength(0)
  })
})
