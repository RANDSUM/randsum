import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { makeContext } from './lib/context.js'
import { accentsOf, textOf } from '../lib/view.js'
import { ROOT } from '../../src/utils/palette.js'
import type { RollView } from '../../src/types.js'

const strongHit = (): { result: string; total: number; rolls: unknown[] } => ({
  result: 'strong_hit',
  total: 10,
  rolls: [{ initialRolls: [5, 5], rolls: [5, 5], modifierLogs: [] }]
})

const mockRoll = mock(strongHit)

void mock.module('@randsum/games/root-rpg', () => ({ roll: mockRoll }))

const { rootCommand } = await import('../../src/commands/root.js')

function render(options: { name: string; value: unknown }[] = []): RollView {
  return rootCommand.buildView!(makeContext(options))
}

beforeEach(() => {
  mockRoll.mockReset().mockImplementation(strongHit)
})

describe('rootCommand', () => {
  test('the band leads, as it does for every PbtA-family game', () => {
    const view = render([{ name: 'modifier', value: 1 }])
    expect(textOf(view)).toContain('## ◆ 10+  ·  Strong Hit')
    expect(accentsOf(view)[0]).toBe(ROOT.strongHit)
  })

  test('a weak hit and a miss are distinct in word and colour', () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 'weak_hit',
      total: 8,
      rolls: [{ initialRolls: [4, 4], rolls: [4, 4], modifierLogs: [] }]
    }))
    expect(accentsOf(render())[0]).toBe(ROOT.weakHit)

    mockRoll.mockImplementationOnce(() => ({
      result: 'miss',
      total: 4,
      rolls: [{ initialRolls: [2, 2], rolls: [2, 2], modifierLogs: [] }]
    }))
    const miss = render()
    expect(textOf(miss)).toContain('## ✕ 6-  ·  Miss')
    expect(accentsOf(miss)[0]).toBe(ROOT.miss)
  })

  test('the roller is not named in the headline', () => {
    // Discord already renders "<username> used /root" directly above every
    // response. The old title repeated it, and made this the one command whose
    // title shape differed from its nine siblings.
    expect(textOf(render([{ name: 'modifier', value: 1 }]))).not.toContain('Adventurer')
  })

  test('a named stat reads back the way a player says it out loud', () => {
    const text = textOf(
      render([
        { name: 'modifier', value: 2 },
        { name: 'stat', value: 'Cunning' }
      ])
    )
    expect(text).toContain('Strong Hit  ·  Cunning')
    expect(text).toContain('**Cunning** +2')
  })

  test('without a stat name the modifier is still labelled', () => {
    expect(textOf(render([{ name: 'modifier', value: 2 }]))).toContain('**Modifier** +2')
  })

  test('rollingWith is forwarded to the roller the spec supports', () => {
    // The spec has always supported this; the command exposed no option for it.
    render([
      { name: 'modifier', value: 1 },
      { name: 'rolling_with', value: 'Advantage' }
    ])
    expect(mockRoll).toHaveBeenCalledWith({ bonus: 1, rollingWith: 'Advantage' })
  })

  test('error path: a failing roll propagates', () => {
    mockRoll.mockImplementationOnce(() => {
      throw new Error('Test error')
    })
    expect(() => render()).toThrow('Test error')
  })
})
