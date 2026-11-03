import { describe, expect, test } from 'bun:test'
import { roll } from '@randsum/roller'
import type { DiceNotation, RollRecord } from '@randsum/roller'
import { render } from 'lit'
import { rollSteps } from '../src/internal/parts/roll-steps'
import { diceLayout, visibleSteps } from '../src/internal/steps'

/** A randomFn that rolls these faces, in order, on dice of `sides` */
function faces(sides: number, values: readonly number[]): () => number {
  const queue = [...values]
  return () => ((queue.shift() ?? 1) - 0.5) / sides
}

function record(notation: DiceNotation, sides: number, values: readonly number[]): RollRecord {
  const [only] = roll(notation, { randomFn: faces(sides, values) }).rolls
  if (only === undefined) throw new Error('no record')
  return only
}

function stepOf(r: RollRecord, label: string) {
  const step = visibleSteps(r).find(s => s.kind === 'rolls' && s.label === label)
  if (step === undefined || step.kind !== 'rolls') throw new Error(`no ${label} step`)
  return step
}

describe('explosion chains', () => {
  test('each exploded die keeps its chain; the rest show as before', () => {
    // 3d6! rolls 6, 2, 6: the first 6 chains 6 then 1, the second rolls a 4
    const layout = diceLayout(stepOf(record('3d6!', 6, [6, 2, 6, 6, 1, 4]), 'Explode'))
    expect(layout.chains).toEqual([
      { from: 6, rolls: [6, 1] },
      { from: 6, rolls: [4] }
    ])
    expect(layout.added).toEqual([])
    expect(layout.removed).toEqual([])
    expect(layout.unchanged).toEqual([2])
  })

  test('a compound chain takes its die out of removed and added', () => {
    const layout = diceLayout(stepOf(record('2d6!!', 6, [6, 3, 6, 2]), 'Compound'))
    expect(layout.chains).toEqual([{ from: 6, rolls: [6, 2], to: 14 }])
    expect(layout.removed).toEqual([])
    expect(layout.added).toEqual([])
    expect(layout.unchanged).toEqual([3])
  })

  test('a penetrate chain that comes out unchanged is not shown twice', () => {
    // 6 penetrates into a 1, which adds nothing: still 6
    const layout = diceLayout(stepOf(record('1d6!p', 6, [6, 1]), 'Penetrate'))
    expect(layout.chains).toEqual([{ from: 6, rolls: [1], to: 6 }])
    expect(layout.unchanged).toEqual([])
  })

  test('the steps draw the chain: the die, then an arrow to each die it rolled', () => {
    const host = document.createElement('div')
    render(rollSteps([record('2d6!', 6, [6, 3, 6, 2])]), host)
    const chain = host.querySelector('.rsui-chain')
    expect(chain?.getAttribute('aria-label')).toBe('6 exploded: 6, 2')
    const dice = [...(chain?.querySelectorAll('.rsui-die') ?? [])].map(d => [
      d.textContent,
      d.getAttribute('data-variant')
    ])
    expect(dice).toEqual([
      ['6', 'kept'],
      ['6', 'kept'],
      ['2', 'kept']
    ])
    expect(chain?.querySelectorAll('.rsui-chain-link').length).toBe(2)
  })

  test('a compound chain shows its dice, not what the die became', () => {
    const host = document.createElement('div')
    render(rollSteps([record('1d6!!', 6, [6, 6, 3])]), host)
    const chain = host.querySelector('.rsui-chain')
    expect(chain?.getAttribute('aria-label')).toBe('6 exploded: 6, 3')
    expect([...(chain?.querySelectorAll('.rsui-die') ?? [])].map(d => d.textContent)).toEqual([
      '6',
      '6',
      '3'
    ])
    expect(host.textContent).not.toContain('15')
  })
})

describe('initial roll', () => {
  test('the first step is marked initial and the modifier steps are not', () => {
    const host = document.createElement('div')
    render(rollSteps([record('4d6L', 6, [3, 5, 1, 6])]), host)
    const marks = [...host.querySelectorAll('.rsui-step')].map(s => s.getAttribute('data-step'))
    expect(marks).toEqual(['initial', 'modifier'])
  })

  test('a plain pool in a multi-pool roll is its own initial row', () => {
    const host = document.createElement('div')
    render(rollSteps([record('1d20', 20, [12]), record('1d6', 6, [4])]), host)
    const marks = [...host.querySelectorAll('.rsui-step')].map(s => s.getAttribute('data-step'))
    expect(marks).toEqual(['initial', 'initial'])
  })
})
