import { beforeEach, describe, expect, mock, test } from 'bun:test'
import type { APIEmbed } from 'discord.js'
import { makeContext, type RawOption } from './lib/context.js'

const mockRoll = mock(
  (): { result: string; total: number; details: unknown; rolls: unknown[] } => ({
    result: 'hope',
    total: 14,
    details: { hope: { roll: 8 }, fear: { roll: 6 }, extraDie: undefined, modifier: 0 },
    rolls: []
  })
)

void mock.module('@randsum/games/daggerheart', () => ({ roll: mockRoll }))

const { dhCommand } = await import('../../src/commands/dh.js')

function render(options: readonly RawOption[] = []): APIEmbed {
  return dhCommand.buildEmbed!(makeContext(options)).toJSON()
}

function fieldNames(embed: APIEmbed): string[] {
  return (embed.fields ?? []).map(field => field.name)
}

beforeEach(() => {
  mockRoll.mockClear()
})

describe('dhCommand', () => {
  test('hope result', () => {
    expect(render().title).toBe('Hope!')
  })

  test('fear result', () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 'fear' as const,
      total: 10,
      details: { hope: { roll: 4 }, fear: { roll: 8 }, extraDie: undefined, modifier: 0 },
      rolls: []
    }))
    expect(render().title).toBe('Fear!')
  })

  test('critical hope result', () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 'critical_hope' as const,
      total: 20,
      details: { hope: { roll: 10 }, fear: { roll: 10 }, extraDie: undefined, modifier: 0 },
      rolls: []
    }))
    expect(render().title).toBe('Critical Hope!')
  })

  test('with advantage and extraDie shows extra die fields', () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 'hope' as const,
      total: 18,
      details: {
        hope: { roll: 8 },
        fear: { roll: 6 },
        extraDie: { roll: 4, advantageRoll: 4, disadvantageRoll: undefined },
        modifier: 0
      },
      rolls: []
    }))
    const embed = render([{ name: 'rolling_with', value: 'Advantage' }])
    expect(fieldNames(embed)).toContain('Advantage Die (d6)')
  })

  test('with modifier adds modifier field', () => {
    expect(fieldNames(render([{ name: 'modifier', value: 3 }]))).toContain('Modifier')
  })

  test('without modifier omits the modifier field', () => {
    expect(fieldNames(render())).not.toContain('Modifier')
  })

  test('amplify options select the d20 die labels', () => {
    const embed = render([
      { name: 'amplify_hope', value: true },
      { name: 'amplify_fear', value: false }
    ])
    expect(fieldNames(embed)).toContain('Hope Die (d20)')
    expect(fieldNames(embed)).toContain('Fear Die (d12)')
  })

  test('error path: a failing roll propagates', () => {
    // The dispatcher renders the "Error" embed — see dispatch.test.ts.
    mockRoll.mockImplementationOnce(() => {
      throw new Error('Test error')
    })
    expect(() => render()).toThrow('Test error')
  })
})
