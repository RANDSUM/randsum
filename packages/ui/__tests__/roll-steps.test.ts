import { describe, expect, test } from 'bun:test'
import { roll } from '@randsum/roller'
import type { DiceNotation, RollRecord } from '@randsum/roller'
import { render } from 'lit'
import { rollSteps } from '../src/internal/parts/roll-steps'
import { timeline } from '../src/internal/steps'

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

const ROLLS = [
  '4d6R{1}!L+3',
  '4d6LH-2',
  '10d6!',
  '3d6!!',
  '3d6!p',
  '4d6U',
  '4d6C{>4}',
  '4d6V{1=6}',
  '5d6W',
  '4d6K2',
  '4d6ro{1}',
  '4dF',
  '6d6D{1}',
  '3d6!i',
  '4d6*2'
] as const

describe('timeline', () => {
  test('every lane ends on the dice the roll kept', () => {
    for (const notation of ROLLS) {
      for (const _ of Array.from({ length: 200 })) {
        for (const rec of roll(notation).rolls) {
          const kept = timeline(rec)
            .lanes.flatMap(l => (l.final === undefined ? [] : [l.final]))
            .sort((a, b) => a - b)
          expect(kept).toEqual([...rec.rolls].sort((a, b) => a - b))
        }
      }
    }
  })

  test('a die carries down until a step changes it', () => {
    // 4d6R{1}!L+3: 1 rerolls to 5; the 6 explodes into a 6, then a 2; the 2 drops
    const t = timeline(record('4d6R{1}!L+3', 6, [1, 6, 3, 4, 5, 6, 2]))
    expect(t.rows.map(r => [r.notation, r.label, r.ink])).toEqual([
      ['4d6', 'Roll 4 6-sided dice', 'plain'],
      ['R{1}', 'Reroll Exactly 1', 'substitute'],
      ['!', 'Explode', 'generate'],
      ['L', 'Drop Lowest 1', 'filter'],
      ['+3', 'Add', 'add']
    ])
    expect(t.rows[4]?.math).toBe('+3')
    expect(t.lanes.map(l => l.nodes.map(n => `${n.row}:${n.kind}:${n.value}`))).toEqual([
      ['0:rolled:1', '1:changed:5'],
      ['0:rolled:6', '2:trigger:6'],
      ['2:born:6'],
      ['2:born:2', '3:removed:2'],
      ['0:rolled:3'],
      ['0:rolled:4']
    ])
    expect(t.lanes.map(l => l.chained)).toEqual([false, false, true, true, false, false])
    expect(t.changed).toBe(true)
  })

  test('a compounding explosion keeps its chain on one die', () => {
    const t = timeline(record('1d6!!', 6, [6, 6, 3]))
    expect(t.lanes).toHaveLength(1)
    expect(t.lanes[0]?.nodes[1]?.chain).toEqual([6, 6, 3])
    expect(t.lanes[0]?.final).toBe(15)
  })

  test('a term alone still earns a Result row, where it shows beside the dice', () => {
    expect(timeline(record('1d20+5', 20, [14])).changed).toBe(true)
  })

  test('a roll with no steps after the initial roll has no Result row', () => {
    expect(timeline(record('1d20', 20, [14])).changed).toBe(false)
  })
})

describe('lanes', () => {
  test('each row shows the notation that made it, its words on hover, and = total ends the lanes', () => {
    const host = document.createElement('div')
    render(rollSteps([record('4d6R{1}!L+3', 6, [1, 6, 3, 4, 5, 6, 2])]), host)
    const labels = [...host.querySelectorAll('.rsui-lanes > .rsui-step-label')]
    expect(labels.map(el => el.textContent?.trim())).toEqual([
      '4d6',
      'R{1}',
      '!',
      'L',
      '+3',
      '= 27'
    ])
    expect(labels.map(el => el.getAttribute('title'))).toEqual([
      'Roll 4 6-sided dice',
      'Reroll Exactly 1',
      'Explode',
      'Drop Lowest 1',
      'Add',
      'Total 27'
    ])
    const result = [...host.querySelectorAll('.rsui-lane[data-row="result"] .rsui-die')]
    expect(result.map(d => d.textContent)).toEqual(['5', '6', '6', '3', '4', '+3'])
    expect(host.querySelector('[aria-label="6 exploded: 6, 2"]')).not.toBeNull()
    expect(host.querySelectorAll('.rsui-lane-arrow')).toHaveLength(2)
    expect(host.querySelector('.rsui-die[data-variant="removed"]')?.textContent).toBe('2')
  })

  test('the line into a changed die takes its step ink; removals are dashed red', () => {
    const host = document.createElement('div')
    render(rollSteps([record('4d6R{1}!L+3', 6, [1, 6, 3, 4, 5, 6, 2])]), host)
    const ins = [...host.querySelectorAll('.rsui-lane[data-in]')].map(c =>
      c.getAttribute('data-in')
    )
    expect(ins).toContain('substitute')
    expect(ins).toContain('removed')
  })

  test('a term carries a line down to the Result row and shows there', () => {
    const host = document.createElement('div')
    render(rollSteps([record('4d6L+3', 6, [1, 6, 3, 4])]), host)
    const term = [...host.querySelectorAll('.rsui-lane[data-term]')]
    expect(term.map(c => c.textContent?.trim())).toEqual(['+3', '+3'])
    expect(term[0]?.hasAttribute('data-out')).toBe(true)
    expect(term[1]?.getAttribute('data-row')).toBe('result')
    expect(term[1]?.getAttribute('data-in')).toBe('plain')
    const result = [...host.querySelectorAll('.rsui-lane[data-row="result"] .rsui-die')]
    expect(result.map(d => d.textContent)).toEqual(['6', '3', '4', '+3'])
  })

  test('plus and minus are cells in their ink', () => {
    const host = document.createElement('div')
    render(rollSteps([record('4d6L+3', 6, [1, 6, 3, 4])]), host)
    const plus = host.querySelector('.rsui-math')
    expect([plus?.textContent, plus?.getAttribute('data-ink')]).toEqual(['+3', 'add'])
    render(rollSteps([record('4d6L-2', 6, [1, 6, 3, 4])]), host)
    const minus = host.querySelector('.rsui-math')
    expect([minus?.textContent, minus?.getAttribute('data-ink')]).toEqual(['−2', 'subtract'])
  })

  test('a compounding chain shows its dice, not what the die became, on its step', () => {
    const host = document.createElement('div')
    render(rollSteps([record('1d6!!', 6, [6, 6, 3])]), host)
    const chain = host.querySelector('.rsui-chain')
    expect(chain?.getAttribute('aria-label')).toBe('6 exploded: 6, 3')
    expect([...(chain?.querySelectorAll('.rsui-die') ?? [])].map(d => d.textContent)).toEqual([
      '6',
      '6',
      '3'
    ])
  })
})

describe('stacks', () => {
  test('one row of kept dice, each change stacked above its die', () => {
    const host = document.createElement('div')
    render(rollSteps([record('4d6R{1}!L+3', 6, [1, 6, 3, 4, 5, 6, 2])], 'stacks'), host)
    const finals = [...host.querySelectorAll('.rsui-stack > .rsui-die:last-child')].map(d => [
      d.textContent,
      d.getAttribute('data-variant')
    ])
    expect(finals).toEqual([
      ['5', 'kept'],
      ['6', 'kept'],
      ['6', 'kept'],
      ['2', 'removed'],
      ['3', 'kept'],
      ['4', 'kept']
    ])
    expect(host.querySelector('.rsui-die[data-variant="was"]')?.textContent).toBe('1')
    expect(host.querySelectorAll('.rsui-stack-arrow')).toHaveLength(2)
    expect(
      [...host.querySelectorAll('.rsui-legend li')].map(li => li.getAttribute('data-ink'))
    ).toEqual(['substitute', 'generate', 'filter', 'add'])
  })
})

describe('pool names', () => {
  const labelled = (label: string): RollRecord => {
    const [only] = roll({ sides: 12, quantity: 1, label }).rolls
    if (only === undefined) throw new Error('no record')
    return only
  }

  test('a labelled pool shows its label, not its notation', () => {
    const host = document.createElement('div')
    render(rollSteps([labelled('Hope'), labelled('Fear')]), host)
    const names = [...host.querySelectorAll('.rsui-step-label')].map(el => [
      el.tagName,
      el.textContent
    ])
    expect(names).toEqual([
      ['SPAN', 'Hope'],
      ['SPAN', 'Fear']
    ])
    expect(host.textContent).not.toContain('1d12')
  })

  test('a pool without a label keeps its notation in code', () => {
    const host = document.createElement('div')
    render(rollSteps([record('1d6', 6, [3]), labelled('Hope')]), host)
    const names = [...host.querySelectorAll('.rsui-step-label')].map(el => [
      el.tagName,
      el.textContent
    ])
    expect(names).toEqual([
      ['CODE', '1d6'],
      ['SPAN', 'Hope']
    ])
  })

  test('a labelled pool with modifier steps puts its label in the heading', () => {
    const [hope] = roll('4d6L[Hope]').rolls
    if (hope === undefined) throw new Error('no record')
    const host = document.createElement('div')
    render(rollSteps([hope, labelled('Fear')]), host)
    const group = host.querySelector('.rsui-pool-group')
    expect(group?.getAttribute('aria-label')).toBe('Hope')
    expect(group?.querySelector('.rsui-pool-heading')?.textContent).toContain('Hope')
    expect(group?.querySelector('.rsui-pool-heading code')).toBeNull()
  })
})

test('a plain pool in a multi-pool roll is one framed row', () => {
  const host = document.createElement('div')
  render(rollSteps([record('1d20', 20, [12]), record('1d6', 6, [4])]), host)
  const marks = [...host.querySelectorAll('.rsui-step')].map(s => s.getAttribute('data-step'))
  expect(marks).toEqual(['initial', 'initial'])
})
