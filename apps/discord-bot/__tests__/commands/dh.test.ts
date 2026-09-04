import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { makeContext } from './lib/context.js'
import { accentsOf, textOf } from '../lib/view.js'
import { DAGGERHEART } from '../../src/utils/palette.js'
import type { RollView } from '../../src/types.js'

interface DhResult {
  result: string
  total: number
  details: {
    hope: { roll: number; amplified: boolean }
    fear: { roll: number; amplified: boolean }
    modifier: number
    extraDie?: { advantageRoll: number; disadvantageRoll: number }
  }
  rolls: unknown[]
}

const withHope = (): DhResult => ({
  result: 'hope',
  total: 15,
  details: {
    hope: { roll: 9, amplified: false },
    fear: { roll: 6, amplified: false },
    modifier: 0
  },
  rolls: []
})

const mockRoll = mock(withHope)

void mock.module('@randsum/games/daggerheart', () => ({ roll: mockRoll }))

const { dhCommand } = await import('../../src/commands/dh.js')

function render(options: { name: string; value: unknown }[] = []): RollView {
  return dhCommand.buildView!(makeContext(options))
}

beforeEach(() => {
  mockRoll.mockReset().mockImplementation(withHope)
})

describe('dhCommand', () => {
  test("uses the game's own vocabulary, and states the consequence", () => {
    // "Critical Hope!" is not a Daggerheart term, and the consequence — you
    // gain a Hope, the GM gains a Fear — was stated nowhere in the old embed.
    const view = render()
    expect(textOf(view)).toContain('Rolled 15 with Hope')
    expect(textOf(view)).toContain('You gain a Hope.')
    expect(accentsOf(view)[0]).toBe(DAGGERHEART.hope)
  })

  test('a fear result says who gains the metacurrency', () => {
    mockRoll.mockImplementationOnce(() => ({
      ...withHope(),
      result: 'fear',
      details: { ...withHope().details, hope: { roll: 4, amplified: false } }
    }))
    const view = render()
    expect(textOf(view)).toContain('Rolled 15 with Fear')
    expect(textOf(view)).toContain('The GM gains a Fear.')
    expect(accentsOf(view)[0]).toBe(DAGGERHEART.fear)
  })

  test('a critical is the game term, and clears a Stress', () => {
    mockRoll.mockImplementationOnce(() => ({
      ...withHope(),
      result: 'critical_hope',
      total: 20
    }))
    const view = render()
    expect(textOf(view)).toContain('## ✸ Critical Success!  ·  20')
    expect(textOf(view)).toContain('clear a Stress')
    expect(accentsOf(view)[0]).toBe(DAGGERHEART.critical)
  })

  test('a difficulty renders the OTHER axis of the roll', () => {
    // Daggerheart resolves on a grid: success-or-failure AND hope-or-fear.
    // Without a difficulty the bot could only ever show the second, so
    // "Success with Fear" — the result that most defines the game — looked
    // identical to a plain failure.
    mockRoll.mockImplementationOnce(() => ({
      ...withHope(),
      result: 'fear',
      total: 16
    }))
    expect(textOf(render([{ name: 'difficulty', value: 14 }]))).toContain(
      'Success with Fear  ·  16 vs DC 14'
    )
  })

  test('a failure with fear is distinguishable from a success with fear', () => {
    mockRoll.mockImplementationOnce(() => ({
      ...withHope(),
      result: 'fear',
      total: 11
    }))
    expect(textOf(render([{ name: 'difficulty', value: 14 }]))).toContain(
      '✕ Failure with Fear  ·  11 vs DC 14'
    )
  })

  test('without a difficulty it falls back to the duality axis alone', () => {
    expect(textOf(render())).not.toContain('vs DC')
  })

  test('the headline carries the total, with or without a difficulty', () => {
    // "Rolled 19 with Hope" — the number the table is waiting for belongs in
    // the headline, not buried in the facts below it.
    mockRoll.mockImplementationOnce(() => ({ ...withHope(), total: 19 }))
    expect(textOf(render())).toContain('## ◆ Rolled 19 with Hope')

    mockRoll.mockImplementationOnce(() => ({ ...withHope(), result: 'critical_hope', total: 24 }))
    expect(textOf(render([{ name: 'difficulty', value: 14 }]))).toContain(
      '## ✸ Critical Success!  ·  24 vs DC 14'
    )
  })

  test('amplified dice are labelled from the engine, not the raw options', () => {
    mockRoll.mockImplementationOnce(() => ({
      ...withHope(),
      details: {
        ...withHope().details,
        hope: { roll: 17, amplified: true },
        fear: { roll: 6, amplified: false }
      }
    }))
    const text = textOf(render([{ name: 'amplify_hope', value: true }]))
    expect(text).toContain('Hope d20')
    expect(text).toContain('Fear d12')
  })

  test('a disadvantage die is shown signed, because it is subtracted', () => {
    // The old embed printed "Disadvantage Die (d6): 4" beside a total it had
    // reduced by 4.
    mockRoll.mockImplementationOnce(() => ({
      ...withHope(),
      details: {
        ...withHope().details,
        extraDie: { advantageRoll: 0, disadvantageRoll: 4 }
      }
    }))
    expect(textOf(render([{ name: 'rolling_with', value: 'Disadvantage' }]))).toContain(
      '**Disadvantage (d6)** -4'
    )
  })

  test('a modifier appears only when non-zero', () => {
    expect(textOf(render())).not.toContain('**Modifier**')
    expect(textOf(render([{ name: 'modifier', value: 2 }]))).toContain('**Modifier** +2')
  })

  test('error path: a failing roll propagates', () => {
    mockRoll.mockImplementationOnce(() => {
      throw new Error('Test error')
    })
    expect(() => render()).toThrow('Test error')
  })
})
