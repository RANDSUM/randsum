import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { makeContext } from './lib/context.js'
import { accentsOf, textOf } from '../lib/view.js'
import { PBTA } from '../../src/utils/palette.js'
import type { RollView } from '../../src/types.js'

interface PbtaResult {
  result: string
  total: number
  details: { diceTotal: number }
  rolls: unknown[]
}

const strongHit = (): PbtaResult => ({
  result: 'strong_hit',
  total: 10,
  details: { diceTotal: 8 },
  rolls: [{ initialRolls: [4, 4], rolls: [4, 4], modifierLogs: [] }]
})

const mockRoll = mock(strongHit)

void mock.module('@randsum/games/pbta', () => ({ roll: mockRoll }))

const { pbtaCommand } = await import('../../src/commands/pbta.js')

function render(options: { name: string; value: unknown }[]): RollView {
  return pbtaCommand.buildView!(makeContext(options))
}

beforeEach(() => {
  mockRoll.mockReset().mockImplementation(strongHit)
})

describe('pbtaCommand', () => {
  test('the numeric band leads, the name follows', () => {
    // PbtA is a family, not a game: "10+" travels to every table running one
    // of them, where "strong hit" is Dungeon World's word specifically.
    const view = render([{ name: 'stat', value: 2 }])
    expect(textOf(view)).toContain('## ◆ 10+  ·  Strong Hit')
    expect(accentsOf(view)[0]).toBe(PBTA.strongHit)
  })

  test('a weak hit names the cost', () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 'weak_hit',
      total: 8,
      details: { diceTotal: 6 },
      rolls: [{ initialRolls: [3, 3], rolls: [3, 3], modifierLogs: [] }]
    }))
    const view = render([{ name: 'stat', value: 2 }])
    expect(textOf(view)).toContain('## ◈ 7-9  ·  Weak Hit')
    expect(accentsOf(view)[0]).toBe(PBTA.weakHit)
  })

  test('a miss reminds the player to mark experience', () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 'miss',
      total: 5,
      details: { diceTotal: 3 },
      rolls: [{ initialRolls: [1, 2], rolls: [1, 2], modifierLogs: [] }]
    }))
    const view = render([{ name: 'stat', value: 2 }])
    expect(textOf(view)).toContain('## ✕ 6-  ·  Miss')
    expect(textOf(view)).toContain('mark experience')
    expect(accentsOf(view)[0]).toBe(PBTA.miss)
  })

  test('the dice-only subtotal is shown beside the modifiers', () => {
    // `details.diceTotal` is computed on every roll and was never rendered —
    // it is exactly the number a PbtA player wants next to their stat.
    expect(textOf(render([{ name: 'stat', value: 2 }]))).toContain('**Dice** 8')
  })

  test('rollingWith is forwarded under the key the roller accepts', () => {
    // Regression guard: the command used to pass `{ advantage: true }`, a key
    // the generated roller does not declare. A conditional spread dodges
    // excess-property checking, so it compiled, was silently dropped, and the
    // embed reported advantage over a plain 2d6.
    render([
      { name: 'stat', value: 2 },
      { name: 'rolling_with', value: 'Advantage' }
    ])
    expect(mockRoll).toHaveBeenCalledWith({ stat: 2, rollingWith: 'Advantage' })
  })

  test('a kept-two pool names the mechanic and marks the dropped die', () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 'strong_hit',
      total: 12,
      details: { diceTotal: 10 },
      rolls: [{ initialRolls: [2, 4, 6], rolls: [4, 6], modifierLogs: [] }]
    }))
    const text = textOf(
      render([
        { name: 'stat', value: 2 },
        { name: 'rolling_with', value: 'Advantage' }
      ])
    )
    expect(text).toContain('**3d6, keep best 2**')
    expect(text).toContain('~~2~~')
  })

  test('forward and ongoing appear only when non-zero', () => {
    const without = textOf(render([{ name: 'stat', value: 2 }]))
    expect(without).not.toContain('Forward')
    expect(without).not.toContain('Ongoing')

    const withBoth = textOf(
      render([
        { name: 'stat', value: 2 },
        { name: 'forward', value: 1 },
        { name: 'ongoing', value: -1 }
      ])
    )
    expect(withBoth).toContain('**Forward** +1')
    expect(withBoth).toContain('**Ongoing** -1')
  })

  test('a negative stat renders with its sign', () => {
    expect(textOf(render([{ name: 'stat', value: -1 }]))).toContain('**Stat** -1')
  })

  test('error path: a failing roll propagates', () => {
    mockRoll.mockImplementationOnce(() => {
      throw new Error('Test error')
    })
    expect(() => render([{ name: 'stat', value: 1 }])).toThrow('Test error')
  })
})
